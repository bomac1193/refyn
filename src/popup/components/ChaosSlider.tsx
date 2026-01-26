import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { CHAOS_LEVELS, getChaosLevel } from '@/lib/chaosEngine';
import { cn } from '@/shared/utils';

interface ChaosSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const ChaosSlider: React.FC<ChaosSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const currentLevel = useMemo(() => getChaosLevel(value), [value]);

  const levelColors: Record<string, string> = {
    clean: 'from-zinc-500 to-zinc-400',
    refined: 'from-blue-500 to-cyan-400',
    creative: 'from-cyan-500 to-green-400',
    wild: 'from-yellow-500 to-orange-400',
    unhinged: 'from-orange-500 to-red-500',
  };

  const levelTextColors: Record<string, string> = {
    clean: 'text-zinc-400',
    refined: 'text-blue-400',
    creative: 'text-cyan-400',
    wild: 'text-yellow-400',
    unhinged: 'text-red-400',
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className={cn('w-4 h-4', levelTextColors[currentLevel.level])} />
          <span className="text-xs font-medium text-zinc-400">Chaos Intensity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold', levelTextColors[currentLevel.level])}>
            {currentLevel.label}
          </span>
          <span className="text-xs text-zinc-500 tabular-nums">{value}</span>
        </div>
      </div>

      <div className="relative">
        {/* Track background */}
        <div className="absolute inset-0 h-2 mt-2.5 rounded-full bg-refyn-surface" />

        {/* Filled track */}
        <div
          className={cn(
            'absolute h-2 mt-2.5 rounded-full bg-gradient-to-r transition-all',
            levelColors[currentLevel.level]
          )}
          style={{ width: `${value}%` }}
        />

        {/* Slider input */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className={cn(
            'relative w-full h-7 appearance-none bg-transparent cursor-pointer',
            'focus:outline-none',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:shadow-black/30',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:shadow-black/30',
            '[&::-moz-range-thumb]:cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>

      {/* Level markers */}
      <div className="flex justify-between px-0.5">
        {CHAOS_LEVELS.map((level) => (
          <button
            key={level.level}
            onClick={() => !disabled && onChange(level.range[0])}
            disabled={disabled}
            className={cn(
              'text-[10px] transition-colors',
              value >= level.range[0] && value <= level.range[1]
                ? levelTextColors[level.level]
                : 'text-zinc-600 hover:text-zinc-400',
              disabled && 'cursor-not-allowed'
            )}
            title={level.description}
          >
            {level.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-center text-[10px] text-zinc-500">
        {currentLevel.description}
      </p>
    </div>
  );
};

export default ChaosSlider;
