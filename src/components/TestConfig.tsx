import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TestSettings } from './TypingTest';

interface TestConfigProps {
  settings: TestSettings;
  onSettingsChange: (settings: TestSettings) => void;
}

export const TestConfig = ({ settings, onSettingsChange }: TestConfigProps) => {
  const [localSettings, setLocalSettings] = useState<TestSettings>(settings);
  const [customWordCount, setCustomWordCount] = useState(localSettings.wordCount || 25);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('typing-test-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setLocalSettings(parsed);
        setCustomWordCount(parsed.wordCount || 25);
        onSettingsChange(parsed);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, [onSettingsChange]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('typing-test-settings', JSON.stringify(localSettings));
  }, [localSettings]);

  const durations = [15, 30, 60, 120];

  const modes = [
    { key: 'time' as const, icon: '⏱', label: 'time' },
    { key: 'words' as const, icon: 'A', label: 'words' },
    { key: 'quote' as const, icon: '"', label: 'quote' },
    { key: 'zen' as const, icon: '▲', label: 'zen' },
    { key: 'custom' as const, icon: '🛠', label: 'custom' }
  ];

  const toggles = [
    { key: 'punctuation' as const, icon: '@', label: 'punctuation' },
    { key: 'numbers' as const, icon: '#', label: 'numbers' }
  ];

  const handleModeChange = (mode: TestSettings['mode']) => {
    const newSettings = { ...localSettings, mode };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleToggleChange = (toggle: 'punctuation' | 'numbers') => {
    const newSettings = { 
      ...localSettings, 
      [toggle]: !localSettings[toggle] 
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleDurationChange = (duration: number) => {
    const newSettings = { ...localSettings, duration };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleCustomWordCountChange = (wordCount: number) => {
    setCustomWordCount(wordCount);
    const newSettings = { ...localSettings, wordCount };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const renderModeSpecificOptions = () => {
    switch (localSettings.mode) {
      case 'time':
        return (
          <div className="flex items-center gap-2 fade-in">
            <span className="text-gray-400 font-mono text-sm">Duration:</span>
            <div className="flex items-center gap-1">
              {durations.map((duration, index) => (
                <button
                  key={duration}
                  onClick={() => handleDurationChange(duration)}
                  className={`
                    px-3 py-1 rounded-md font-mono text-sm btn-hover btn-active
                    ${localSettings.duration === duration
                      ? 'bg-green-500 text-gray-900 shadow-lg shadow-green-500/50 border border-green-400'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300'
                    }
                  `}
                  title={`${duration} seconds`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'words':
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono text-sm">Words:</span>
            <input
              type="number"
              value={customWordCount}
              onChange={(e) => handleCustomWordCountChange(Number(e.target.value))}
              min="1"
              max="1000"
              className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-cyan-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        );
      
      case 'quote':
        return (
          <div>
            <span className="text-gray-400 font-mono text-sm">Random famous quotes</span>
          </div>
        );
      
      case 'zen':
        return (
          <div>
            <span className="text-gray-400 font-mono text-sm">Free typing, no limits</span>
          </div>
        );
      
      case 'custom':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 font-mono text-sm mb-2">Custom Text:</label>
              <textarea
                value={localSettings.customText || ''}
                onChange={(e) => {
                  const newSettings = { ...localSettings, customText: e.target.value };
                  setLocalSettings(newSettings);
                  onSettingsChange(newSettings);
                }}
                placeholder="Paste or type your custom text here..."
                className="w-full h-20 p-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                <input
                  type="checkbox"
                  checked={localSettings.customUseTime || false}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, customUseTime: e.target.checked };
                    setLocalSettings(newSettings);
                    onSettingsChange(newSettings);
                  }}
                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                Use timer
              </label>
              
              <label className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                <input
                  type="checkbox"
                  checked={localSettings.customUseWords || false}
                  onChange={(e) => {
                    const newSettings = { ...localSettings, customUseWords: e.target.checked };
                    setLocalSettings(newSettings);
                    onSettingsChange(newSettings);
                  }}
                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                Use word limit
              </label>
            </div>
            
            {(localSettings.customUseTime || localSettings.customUseWords) && (
              <div className="flex items-center gap-4">
                {localSettings.customUseTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono text-sm">Time:</span>
                    <input
                      type="number"
                      value={localSettings.customTimeLimit || 30}
                      onChange={(e) => {
                        const newSettings = { ...localSettings, customTimeLimit: Number(e.target.value) };
                        setLocalSettings(newSettings);
                        onSettingsChange(newSettings);
                      }}
                      min="5"
                      max="600"
                      className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="text-gray-400 font-mono text-sm">sec</span>
                  </div>
                )}
                
                {localSettings.customUseWords && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono text-sm">Words:</span>
                    <input
                      type="number"
                      value={localSettings.customWordLimit || 25}
                      onChange={(e) => {
                        const newSettings = { ...localSettings, customWordLimit: Number(e.target.value) };
                        setLocalSettings(newSettings);
                        onSettingsChange(newSettings);
                      }}
                      min="1"
                      max="1000"
                      className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-900 border border-cyan-600 rounded-lg shadow-lg shadow-cyan-500/25 p-4">
        <div className="flex flex-col gap-4">
          
          {/* Top Row - Toggles */}
          <div className="flex items-center justify-center gap-2">
            {toggles.map((toggle, index) => (
              <button
                key={toggle.key}
                onClick={() => handleToggleChange(toggle.key)}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-md font-mono text-sm btn-hover btn-active fade-in
                  ${localSettings[toggle.key]
                    ? 'bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/50 border border-yellow-400'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300'
                  }
                `}
                title={`Toggle ${toggle.label}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-base">{toggle.icon}</span>
                <span className="hidden sm:inline">{toggle.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Row - Mode Selection */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {modes.map((mode, index) => (
              <button
                key={mode.key}
                onClick={() => handleModeChange(mode.key)}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-md font-mono text-sm btn-hover btn-active fade-in
                  ${localSettings.mode === mode.key
                    ? 'bg-green-500 text-gray-900 shadow-lg shadow-green-500/50 border border-green-400'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300'
                  }
                `}
                title={`${mode.label} mode`}
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <span className="text-base">{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Mode-specific options - displayed below without overlap */}
          {renderModeSpecificOptions() && (
            <div className="mt-4 pt-4 border-t border-gray-700 slide-in-left">
              {renderModeSpecificOptions()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};