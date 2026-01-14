import React from 'react';
import { Dna } from 'lucide-react';
import type { GenomeTag } from '@/shared/types';

interface GenomeTagsProps {
  tags: GenomeTag[];
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    style: '#00F0FF',
    mood: '#A855F7',
    palette: '#FFB800',
    lighting: '#22C55E',
    genre: '#00F0FF',
    tempo: '#FFB800',
    vocals: '#A855F7',
    camera: '#3B82F6',
  };
  return colors[category.toLowerCase()] || '#A1A1AA';
};

export const GenomeTags: React.FC<GenomeTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg bg-refyn-elevated border border-refyn-active">
      <div className="flex items-center gap-2 mb-3">
        <Dna className="w-4 h-4 text-refyn-violet" />
        <span className="text-sm font-medium text-zinc-400">Prompt DNA</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => {
          const color = getCategoryColor(tag.category);
          return (
            <div key={index} className="group relative">
              <div
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-refyn-surface border transition-all duration-200 hover:shadow-md"
                style={{
                  borderColor: `${color}30`,
                  color: color,
                }}
              >
                <span className="opacity-60">{tag.category}:</span> {tag.value}
              </div>

              {/* Confidence indicator */}
              <div
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all"
                style={{
                  width: `${tag.confidence * 80}%`,
                  backgroundColor: color,
                  opacity: 0.6,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenomeTags;
