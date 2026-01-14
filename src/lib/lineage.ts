import { getLineageTree, addLineageNode } from './storage';
import type { Platform, PromptNode, OptimizationMode } from '@/shared/types';

export interface TreeVisualization {
  id: string;
  content: string;
  platform: Platform;
  mode: string;
  depth: number;
  children: TreeVisualization[];
}

/**
 * LineageTree - Tracks prompt evolution and versions
 */
export class LineageTree {
  private nodes: Map<string, PromptNode> = new Map();
  private loaded = false;

  /**
   * Load lineage tree from storage
   */
  async load(): Promise<void> {
    const tree = await getLineageTree();
    this.nodes = new Map(Object.entries(tree));
    this.loaded = true;
  }

  /**
   * Ensure tree is loaded
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) await this.load();
  }

  /**
   * Create a new node in the tree
   */
  async createNode(
    content: string,
    platform: Platform,
    parentId?: string,
    mode: OptimizationMode | 'manual' = 'manual'
  ): Promise<PromptNode> {
    await this.ensureLoaded();

    const node = await addLineageNode(content, platform, parentId || null, mode);
    this.nodes.set(node.id, node);

    // Update parent's children if exists
    if (parentId && this.nodes.has(parentId)) {
      const parent = this.nodes.get(parentId)!;
      if (!parent.children.includes(node.id)) {
        parent.children.push(node.id);
      }
    }

    return node;
  }

  /**
   * Get full lineage (ancestry) of a node
   */
  async getLineage(nodeId: string): Promise<PromptNode[]> {
    await this.ensureLoaded();

    const lineage: PromptNode[] = [];
    let current = this.nodes.get(nodeId);

    while (current) {
      lineage.unshift(current);
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }

    return lineage;
  }

  /**
   * Get children of a node
   */
  async getChildren(nodeId: string): Promise<PromptNode[]> {
    await this.ensureLoaded();

    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return node.children
      .map((id) => this.nodes.get(id))
      .filter((n): n is PromptNode => n !== undefined);
  }

  /**
   * Get all root nodes (nodes without parents)
   */
  async getRoots(): Promise<PromptNode[]> {
    await this.ensureLoaded();

    return Array.from(this.nodes.values()).filter((node) => !node.parentId);
  }

  /**
   * Build tree visualization from a root node
   */
  async buildTree(rootId: string, maxDepth = 10): Promise<TreeVisualization | null> {
    await this.ensureLoaded();

    const root = this.nodes.get(rootId);
    if (!root) return null;

    return this.buildTreeRecursive(root, 0, maxDepth);
  }

  /**
   * Recursive helper for building tree
   */
  private buildTreeRecursive(
    node: PromptNode,
    depth: number,
    maxDepth: number
  ): TreeVisualization {
    const children: TreeVisualization[] = [];

    if (depth < maxDepth) {
      for (const childId of node.children) {
        const childNode = this.nodes.get(childId);
        if (childNode) {
          children.push(this.buildTreeRecursive(childNode, depth + 1, maxDepth));
        }
      }
    }

    return {
      id: node.id,
      content: node.content,
      platform: node.platform,
      mode: node.metadata.mode,
      depth,
      children,
    };
  }

  /**
   * Get all trees (from all root nodes)
   */
  async getAllTrees(): Promise<TreeVisualization[]> {
    const roots = await this.getRoots();
    const trees: TreeVisualization[] = [];

    for (const root of roots) {
      const tree = await this.buildTree(root.id);
      if (tree) trees.push(tree);
    }

    return trees;
  }

  /**
   * Find similar prompts in the tree
   */
  async findSimilar(
    content: string,
    threshold = 0.3
  ): Promise<{ node: PromptNode; similarity: number }[]> {
    await this.ensureLoaded();

    const results: { node: PromptNode; similarity: number }[] = [];
    const contentWords = new Set(content.toLowerCase().split(/\s+/));

    for (const node of this.nodes.values()) {
      const nodeWords = new Set(node.content.toLowerCase().split(/\s+/));
      const intersection = new Set([...contentWords].filter((x) => nodeWords.has(x)));
      const union = new Set([...contentWords, ...nodeWords]);
      const similarity = intersection.size / union.size;

      if (similarity >= threshold) {
        results.push({ node, similarity });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Get statistics about the lineage tree
   */
  async getStats(): Promise<{
    totalNodes: number;
    totalRoots: number;
    avgDepth: number;
    platformCounts: Record<Platform, number>;
    modeCounts: Record<string, number>;
  }> {
    await this.ensureLoaded();

    const platformCounts: Record<string, number> = {};
    const modeCounts: Record<string, number> = {};
    let totalDepth = 0;
    let leafCount = 0;

    for (const node of this.nodes.values()) {
      // Platform counts
      platformCounts[node.platform] = (platformCounts[node.platform] || 0) + 1;

      // Mode counts
      modeCounts[node.metadata.mode] = (modeCounts[node.metadata.mode] || 0) + 1;

      // Calculate depth for leaf nodes
      if (node.children.length === 0) {
        let depth = 0;
        let current: PromptNode | undefined = node;
        while (current?.parentId) {
          depth++;
          current = this.nodes.get(current.parentId);
        }
        totalDepth += depth;
        leafCount++;
      }
    }

    const roots = await this.getRoots();

    return {
      totalNodes: this.nodes.size,
      totalRoots: roots.length,
      avgDepth: leafCount > 0 ? totalDepth / leafCount : 0,
      platformCounts: platformCounts as Record<Platform, number>,
      modeCounts,
    };
  }

  /**
   * Rate a node (for learning)
   */
  async rateNode(nodeId: string, rating: number): Promise<void> {
    await this.ensureLoaded();

    const node = this.nodes.get(nodeId);
    if (node) {
      node.metadata.rating = rating;
      // Note: This would need to update storage as well
    }
  }

  /**
   * Add tags to a node
   */
  async addTags(nodeId: string, tags: string[]): Promise<void> {
    await this.ensureLoaded();

    const node = this.nodes.get(nodeId);
    if (node) {
      node.metadata.tags = [...new Set([...node.metadata.tags, ...tags])];
      // Note: This would need to update storage as well
    }
  }

  /**
   * Get a single node
   */
  async getNode(nodeId: string): Promise<PromptNode | undefined> {
    await this.ensureLoaded();
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  async getAllNodes(): Promise<PromptNode[]> {
    await this.ensureLoaded();
    return Array.from(this.nodes.values());
  }
}

// Export singleton instance
export const lineageTree = new LineageTree();
