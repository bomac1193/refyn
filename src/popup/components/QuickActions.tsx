import React from 'react';
import { Sparkles, Expand, Palette, Settings2, Dna, Zap } from 'lucide-react';
import type { OptimizationMode } from '@/shared/types';
import { cn } from '@/shared/utils';

interface QuickActionsProps {
  selectedMode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
  onRefyn: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const modes: {
  id: OptimizationMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  isCrazy?: boolean;
}[] = [
  {
    id: 'enhance',
    label: 'Enhance',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Improve clarity and detail',
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: <Expand className="w-4 h-4" />,
    description: 'Add more descriptive elements',
  },
  {
    id: 'style',
    label: 'Style+',
    icon: <Palette className="w-4 h-4" />,
    description: 'Add artistic style references',
  },
  {
    id: 'params',
    label: 'Params',
    icon: <Settings2 className="w-4 h-4" />,
    description: 'Add platform parameters',
  },
  {
    id: 'crazy',
    label: 'Crazy',
    icon: <Zap className="w-4 h-4" />,
    description: 'Hidden platform tricks & magic triggers',
    isCrazy: true,
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({
  selectedMode,
  onModeChange,
  onRefyn,
  loading = false,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex gap-1 p-1 bg-refyn-surface rounded-lg">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            disabled={loading || disabled}
            title={mode.description}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md',
              'text-xs font-medium transition-all',
              selectedMode === mode.id
                ? mode.isCrazy
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-pink-400 shadow-sm border border-pink-500/30'
                  : 'bg-refyn-hover text-zinc-100 shadow-sm'
                : mode.isCrazy
                  ? 'text-purple-400 hover:text-pink-400 hover:bg-purple-500/20 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-refyn-hover/50',
              (loading || disabled) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Refyn button */}
      <button
        onClick={onRefyn}
        disabled={loading || disabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
          'font-semibold text-sm',
          'bg-gradient-to-r from-refyn-cyan to-refyn-cyan-dim',
          'text-refyn-base',
          'transition-all duration-200',
          'hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]',
          'active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-refyn-cyan focus:ring-offset-2 focus:ring-offset-refyn-base',
          (loading || disabled) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Refining...
          </>
        ) : (
          <>
            <Dna className="w-5 h-5" />
            Refyn It
          </>
        )}
      </button>

      {/* Mode description */}
      <p className="text-center text-xs text-zinc-500">
        {modes.find((m) => m.id === selectedMode)?.description}
      </p>
    </div>
  );
};

export default QuickActions;
