import React, { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { cn, copyToClipboard } from '@/shared/utils';

interface PromptOutputProps {
  value: string;
  loading?: boolean;
  error?: string;
  onReset?: () => void;
}

export const PromptOutput: React.FC<PromptOutputProps> = ({
  value,
  loading = false,
  error,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (value && (await copyToClipboard(value))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-400">Refined Prompt</label>
        <div className="flex items-center gap-1">
          {onReset && value && (
            <button
              onClick={onReset}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-refyn-surface transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!value || loading}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-refyn-surface text-zinc-300 hover:bg-refyn-hover hover:text-zinc-100',
              (!value || loading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'relative rounded-lg overflow-hidden',
          'ring-1',
          error ? 'ring-red-500/50' : 'ring-refyn-active'
        )}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-refyn-elevated/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-refyn-cyan/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-refyn-cyan animate-spin" />
              </div>
              <span className="text-sm text-zinc-400">Refining your prompt...</span>
            </div>
          </div>
        )}

        {/* Success gradient accent */}
        {value && !loading && !error && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-refyn-cyan via-refyn-violet to-refyn-amber" />
        )}

        <div
          className={cn(
            'min-h-[100px] max-h-[150px] overflow-y-auto px-4 py-3',
            'bg-refyn-elevated',
            'text-sm',
            error ? 'text-red-400' : 'text-zinc-100'
          )}
        >
          {error ? (
            <p>{error}</p>
          ) : value ? (
            <p className="whitespace-pre-wrap">{value}</p>
          ) : (
            <p className="text-zinc-600 italic">
              Your refined prompt will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptOutput;
