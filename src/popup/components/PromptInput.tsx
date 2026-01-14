import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your prompt...',
  label = 'Original Prompt',
  maxLength = 2000,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      <div
        className={cn(
          'relative rounded-lg overflow-hidden transition-all duration-200',
          isFocused
            ? 'ring-2 ring-refyn-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
            : 'ring-1 ring-refyn-active'
        )}
      >
        {/* Subtle gradient glow on focus */}
        {isFocused && (
          <div className="absolute inset-0 bg-gradient-to-br from-refyn-cyan/5 to-transparent pointer-events-none" />
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          className={cn(
            'w-full px-4 py-3',
            'bg-refyn-elevated',
            'text-zinc-100 text-sm',
            'placeholder-zinc-600',
            'resize-none',
            'focus:outline-none',
            'relative z-10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Character count */}
        <div className="absolute bottom-2 right-3 text-xs text-zinc-600 z-10">
          {value.length}
          {maxLength && <span>/{maxLength}</span>}
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
