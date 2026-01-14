import React, { useState } from 'react';
import { Copy, Check, Star, Trash2 } from 'lucide-react';
import { PLATFORMS } from '@/shared/constants';
import { copyToClipboard, formatRelativeTime, truncate } from '@/shared/utils';
import type { PromptRecord } from '@/shared/types';

interface HistoryItemProps {
  item: PromptRecord;
  onSelect: (content: string) => void;
  onSave?: (item: PromptRecord) => void;
  onDelete?: (id: string) => void;
  isSaved?: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  onSelect,
  onSave,
  onDelete,
  isSaved = false,
}) => {
  const [copied, setCopied] = useState(false);
  const platform = PLATFORMS[item.platform] || PLATFORMS.unknown;

  // Safety check for invalid items
  if (!item || !item.content) {
    return null;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await copyToClipboard(item.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(item.id);
  };

  return (
    <div
      onClick={() => onSelect(item.content)}
      className="group p-3 bg-refyn-surface rounded-lg border border-transparent hover:border-refyn-cyan/30 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: platform.color }}
          />
          <span className="text-xs text-zinc-500">{platform.name}</span>
        </div>
        <span className="text-xs text-zinc-600">
          {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
        </span>
      </div>

      <p className="text-sm text-zinc-300 mb-3">{truncate(item.content, 100)}</p>

      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-refyn-hover transition-colors"
          title="Copy"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {onSave && !isSaved && (
          <button
            onClick={handleSave}
            className="p-1.5 rounded text-zinc-500 hover:text-refyn-amber hover:bg-refyn-hover transition-colors"
            title="Save to Library"
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-refyn-hover transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;
