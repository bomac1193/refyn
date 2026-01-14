import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHelpClick }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-refyn-active">
      <div className="flex items-center gap-2">
        {/* Logo */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-gradient-to-br from-refyn-cyan via-refyn-violet to-refyn-amber rounded-lg opacity-80" />
          <div className="absolute inset-[2px] bg-refyn-base rounded-md flex items-center justify-center">
            <span className="text-refyn-cyan font-bold text-sm">R</span>
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex flex-col">
          <span className="text-lg font-bold text-zinc-100 tracking-tight">REFYN</span>
          <span className="text-[10px] text-zinc-500 -mt-1">Evolve the signal</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-refyn-surface transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={onHelpClick}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-refyn-surface transition-colors"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
