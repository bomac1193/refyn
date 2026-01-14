import React from 'react';
import { ChevronDown, Image, Music, Video, MessageSquare } from 'lucide-react';
import { PLATFORMS, PLATFORM_CATEGORIES } from '@/shared/constants';
import type { Platform, PlatformCategory } from '@/shared/types';
import { cn } from '@/shared/utils';

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  detectedPlatform?: Platform;
}

const categoryIcons: Record<PlatformCategory, React.ReactNode> = {
  image: <Image className="w-4 h-4" />,
  music: <Music className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  text: <MessageSquare className="w-4 h-4" />,
};

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  value,
  onChange,
  detectedPlatform,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedPlatform = PLATFORMS[value];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5',
          'bg-refyn-surface border border-refyn-active rounded-lg',
          'text-zinc-100 text-sm',
          'hover:border-refyn-cyan/30 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-refyn-cyan/50'
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Platform:</span>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedPlatform.color }}
            />
            <span className="font-medium">{selectedPlatform.name}</span>
            {detectedPlatform === value && detectedPlatform !== 'unknown' && (
              <span className="px-1.5 py-0.5 text-[10px] bg-refyn-cyan/20 text-refyn-cyan rounded">
                Auto
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-zinc-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 bg-refyn-elevated border border-refyn-active rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {detectedPlatform && detectedPlatform !== 'unknown' && (
            <>
              <div className="px-3 py-1.5 text-xs text-zinc-500 uppercase tracking-wider">
                Detected
              </div>
              <button
                onClick={() => {
                  onChange(detectedPlatform);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2',
                  'hover:bg-refyn-surface transition-colors',
                  value === detectedPlatform && 'bg-refyn-surface'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PLATFORMS[detectedPlatform].color }}
                />
                <span className="text-sm text-zinc-100">
                  {PLATFORMS[detectedPlatform].name}
                </span>
                <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-refyn-cyan/20 text-refyn-cyan rounded">
                  Auto
                </span>
              </button>
              <div className="my-2 border-t border-refyn-active" />
            </>
          )}

          {(Object.entries(PLATFORM_CATEGORIES) as [PlatformCategory, Platform[]][]).map(
            ([category, platforms]) => (
              <div key={category}>
                <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider">
                  {categoryIcons[category]}
                  {category}
                </div>
                {platforms.map((platformId) => {
                  const platform = PLATFORMS[platformId];
                  return (
                    <button
                      key={platformId}
                      onClick={() => {
                        onChange(platformId);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2',
                        'hover:bg-refyn-surface transition-colors',
                        value === platformId && 'bg-refyn-surface'
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: platform.color }}
                      />
                      <span className="text-sm text-zinc-100">{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;
