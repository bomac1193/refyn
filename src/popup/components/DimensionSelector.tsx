import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export interface TasteDimension {
  id: string;
  name: string;
  layer: string;
  description: string;
}

export interface TasteLayer {
  id: string;
  name: string;
  description: string;
}

interface DimensionSelectorProps {
  selectedDimensions: string[];
  onDimensionsChange: (dimensions: string[]) => void;
  disabled?: boolean;
}

// Layer definitions with icons/colors
const LAYER_STYLES: Record<string, { color: string; icon: string }> = {
  mood: { color: 'text-purple-400 border-purple-400/30 bg-purple-400/10', icon: '✨' },
  palette: { color: 'text-amber-400 border-amber-400/30 bg-amber-400/10', icon: '🎨' },
  light: { color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10', icon: '💡' },
  era: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/10', icon: '⏳' },
  lens: { color: 'text-green-400 border-green-400/30 bg-green-400/10', icon: '🌍' },
  form: { color: 'text-pink-400 border-pink-400/30 bg-pink-400/10', icon: '📐' },
};

export const DimensionSelector: React.FC<DimensionSelectorProps> = ({
  selectedDimensions,
  onDimensionsChange,
  disabled = false,
}) => {
  const [layers, setLayers] = useState<TasteLayer[]>([]);
  const [dimensions, setDimensions] = useState<TasteDimension[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch layers and dimensions from background
  useEffect(() => {
    async function fetchData() {
      try {
        const [layersRes, dimensionsRes] = await Promise.all([
          chrome.runtime.sendMessage({ type: 'GET_TASTE_LAYERS' }),
          chrome.runtime.sendMessage({ type: 'GET_TASTE_DIMENSIONS' }),
        ]);

        if (layersRes?.success && layersRes.layers) {
          setLayers(layersRes.layers);
        }
        if (dimensionsRes?.success && dimensionsRes.dimensions) {
          setDimensions(dimensionsRes.dimensions);
        }
      } catch (error) {
        console.error('Failed to fetch taste dimensions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleDimension = (dimensionId: string) => {
    if (disabled) return;

    const dimension = dimensions.find(d => d.id === dimensionId);
    if (!dimension) return;

    // Find if any dimension from this layer is already selected
    const currentLayerDimension = selectedDimensions.find(id => {
      const d = dimensions.find(dim => dim.id === id);
      return d?.layer === dimension.layer;
    });

    let newSelection: string[];

    if (selectedDimensions.includes(dimensionId)) {
      // Deselect
      newSelection = selectedDimensions.filter(id => id !== dimensionId);
    } else if (currentLayerDimension) {
      // Replace the current selection in this layer
      newSelection = selectedDimensions.filter(id => id !== currentLayerDimension);
      newSelection.push(dimensionId);
    } else {
      // Add to selection
      newSelection = [...selectedDimensions, dimensionId];
    }

    onDimensionsChange(newSelection);
  };

  const clearAll = () => {
    onDimensionsChange([]);
  };

  // Get dimensions grouped by layer
  const getDimensionsByLayer = (layerId: string) => {
    return dimensions.filter(d => d.layer === layerId);
  };

  // Get selected dimension for a layer
  const getSelectedForLayer = (layerId: string): TasteDimension | undefined => {
    const selectedId = selectedDimensions.find(id => {
      const d = dimensions.find(dim => dim.id === id);
      return d?.layer === layerId;
    });
    return dimensions.find(d => d.id === selectedId);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-refyn-active/50 rounded-lg p-3 h-12" />
    );
  }

  // Compact view - show selected dimensions as chips
  const selectedChips = selectedDimensions.map(id => {
    const dim = dimensions.find(d => d.id === id);
    if (!dim) return null;
    const style = LAYER_STYLES[dim.layer] || LAYER_STYLES.mood;
    return (
      <span
        key={id}
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${style.color}`}
      >
        <span>{style.icon}</span>
        <span>{dim.name}</span>
      </span>
    );
  }).filter(Boolean);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Taste Stack</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {selectedDimensions.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear ({selectedDimensions.length})
          </button>
        )}
      </div>

      {/* Selected chips (always visible) */}
      {selectedChips.length > 0 && !expanded && (
        <div className="flex flex-wrap gap-1.5">
          {selectedChips}
        </div>
      )}

      {/* Expanded view - layer picker */}
      {expanded && (
        <div className="space-y-3 pt-1">
          {layers.map(layer => {
            const layerDimensions = getDimensionsByLayer(layer.id);
            const selected = getSelectedForLayer(layer.id);
            const style = LAYER_STYLES[layer.id] || LAYER_STYLES.mood;

            return (
              <div key={layer.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{style.icon}</span>
                  <span className="text-xs font-medium text-zinc-400">{layer.name}</span>
                  <span className="text-xs text-zinc-600">{layer.description}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {layerDimensions.map(dim => (
                    <button
                      key={dim.id}
                      onClick={() => toggleDimension(dim.id)}
                      disabled={disabled}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        selected?.id === dim.id
                          ? style.color + ' border'
                          : 'bg-refyn-active/50 text-zinc-500 border border-transparent hover:bg-refyn-active hover:text-zinc-300'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={dim.description}
                    >
                      {dim.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quick combos hint */}
          <div className="text-xs text-zinc-600 pt-1 border-t border-zinc-800">
            💡 Mix layers: e.g., <span className="text-yellow-400/70">Chiaroscuro</span> + <span className="text-green-400/70">Sankofa</span> = dramatic afrofuturist lighting
          </div>
        </div>
      )}
    </div>
  );
};
