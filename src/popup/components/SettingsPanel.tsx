import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Check, AlertCircle, Trash2 } from 'lucide-react';
import { getApiKey, saveApiKey, removeApiKey, getSettings, saveSettings } from '@/lib/storage';
import type { UserSettings } from '@/shared/types';
import { cn } from '@/shared/utils';
import Button from './Button';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Load existing settings
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const key = await getApiKey();
    setHasKey(!!key);
    if (key) {
      setApiKey(key);
    }

    const s = await getSettings();
    setSettings(s);
  };

  const handleSaveKey = async () => {
    const trimmedKey = apiKey.trim();
    console.log('[Refyn Settings] Attempting to save key:', trimmedKey.substring(0, 15) + '...');
    if (!trimmedKey) return;

    // Instant format validation - no API call needed
    if (!trimmedKey.startsWith('sk-ant-')) {
      console.log('[Refyn Settings] Invalid: does not start with sk-ant-');
      setValidationResult('invalid');
      return;
    }

    if (trimmedKey.length < 40) {
      console.log('[Refyn Settings] Invalid: too short, length:', trimmedKey.length);
      setValidationResult('invalid');
      return;
    }

    if (!/^sk-ant-[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
      console.log('[Refyn Settings] Invalid: contains invalid characters');
      setValidationResult('invalid');
      return;
    }

    // Format is valid - save immediately
    console.log('[Refyn Settings] Format valid, saving...');
    await saveApiKey(trimmedKey);
    setHasKey(true);
    setValidationResult('valid');
    console.log('[Refyn Settings] Key saved and state updated');
  };

  const handleRemoveKey = async () => {
    await removeApiKey();
    setApiKey('');
    setHasKey(false);
    setValidationResult(null);
  };

  const handleSettingChange = async (key: keyof UserSettings, value: unknown) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings({ [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-x-4 top-4 bottom-4 bg-refyn-elevated rounded-xl border border-refyn-active shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-refyn-active">
          <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-refyn-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* API Key Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Anthropic API Key
            </h3>
            <p className="text-xs text-zinc-500">
              Your API key is stored locally and encrypted. Get one at{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-refyn-cyan hover:underline"
              >
                console.anthropic.com
              </a>
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="sk-ant-..."
                  className={cn(
                    'w-full px-4 py-2.5 pr-10',
                    'bg-refyn-surface border rounded-lg',
                    'text-sm text-zinc-100 placeholder-zinc-600',
                    'focus:outline-none focus:ring-2 focus:ring-refyn-cyan/50',
                    validationResult === 'valid' && 'border-green-500/50',
                    validationResult === 'invalid' && 'border-red-500/50',
                    !validationResult && 'border-refyn-active'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {validationResult === 'valid' && (
                <p className="flex items-center gap-1.5 text-xs text-green-400">
                  <Check className="w-3.5 h-3.5" />
                  API key saved successfully
                </p>
              )}
              {validationResult === 'invalid' && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Invalid API key. Must start with sk-ant- and be at least 40 characters.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim()}
                  size="sm"
                >
                  {hasKey ? 'Update Key' : 'Save Key'}
                </Button>
                {hasKey && (
                  <Button onClick={handleRemoveKey} variant="danger" size="sm">
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          {settings && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Preferences</h3>

              <label className="flex items-center justify-between p-3 bg-refyn-surface rounded-lg cursor-pointer">
                <div>
                  <p className="text-sm text-zinc-100">Auto-detect Platform</p>
                  <p className="text-xs text-zinc-500">
                    Automatically detect the AI platform from the current page
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoDetectPlatform}
                  onChange={(e) => handleSettingChange('autoDetectPlatform', e.target.checked)}
                  className="w-5 h-5 rounded border-refyn-active bg-refyn-surface text-refyn-cyan focus:ring-refyn-cyan focus:ring-offset-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-refyn-surface rounded-lg cursor-pointer">
                <div>
                  <p className="text-sm text-zinc-100">Show Floating Toolbar</p>
                  <p className="text-xs text-zinc-500">
                    Display Refyn toolbar when selecting text on AI platforms
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showFloatingToolbar}
                  onChange={(e) => handleSettingChange('showFloatingToolbar', e.target.checked)}
                  className="w-5 h-5 rounded border-refyn-active bg-refyn-surface text-refyn-cyan focus:ring-refyn-cyan focus:ring-offset-0"
                />
              </label>
            </section>
          )}

          {/* About Section */}
          <section className="space-y-2 pt-4 border-t border-refyn-active">
            <h3 className="text-sm font-medium text-zinc-300">About</h3>
            <div className="text-xs text-zinc-500 space-y-1">
              <p>Refyn v1.0.0</p>
              <p>Universal AI prompt optimization</p>
              <p className="italic">"Evolve the signal"</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
