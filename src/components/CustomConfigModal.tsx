import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CustomConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

export const CustomConfigModal: React.FC<CustomConfigModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [customText, setCustomText] = useState('');
  const [customDuration, setCustomDuration] = useState(30);
  const [customWordLimit, setCustomWordLimit] = useState(25);
  const [useTimeLimit, setUseTimeLimit] = useState(false);
  const [useWordLimit, setUseWordLimit] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomText('');
      setCustomDuration(30);
      setCustomWordLimit(25);
      setUseTimeLimit(false);
      setUseWordLimit(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (customText.trim()) {
      onSave({
        text: customText.trim(),
        duration: customDuration,
        wordLimit: customWordLimit,
        useTimeLimit,
        useWordLimit
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-600 rounded-lg shadow-lg shadow-cyan-500/25 p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-cyan-100 mb-4 text-center">
          🛠 Custom Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-cyan-200 text-sm font-medium mb-2">
              Custom Text
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter your custom text here..."
              className="w-full h-32 p-3 bg-gray-800 border border-cyan-600 rounded-md text-cyan-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          
          <div className="space-y-4">
            {/* Time Limit Options */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="useTimeLimit"
                checked={useTimeLimit}
                onChange={(e) => setUseTimeLimit(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-gray-800 border-cyan-600 rounded focus:ring-cyan-500"
              />
              <label htmlFor="useTimeLimit" className="text-cyan-200 text-sm font-medium">
                Use Time Limit
              </label>
            </div>
            
            {useTimeLimit && (
              <div>
                <label className="block text-cyan-200 text-sm font-medium mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  min="5"
                  max="600"
                  className="w-full p-3 bg-gray-800 border border-cyan-600 rounded-md text-cyan-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
            
            {/* Word Limit Options */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="useWordLimit"
                checked={useWordLimit}
                onChange={(e) => setUseWordLimit(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-gray-800 border-cyan-600 rounded focus:ring-cyan-500"
              />
              <label htmlFor="useWordLimit" className="text-cyan-200 text-sm font-medium">
                Use Word Limit
              </label>
            </div>
            
            {useWordLimit && (
              <div>
                <label className="block text-cyan-200 text-sm font-medium mb-2">
                  Word Limit
                </label>
                <input
                  type="number"
                  value={customWordLimit}
                  onChange={(e) => setCustomWordLimit(Number(e.target.value))}
                  min="1"
                  max="1000"
                  className="w-full p-3 bg-gray-800 border border-cyan-600 rounded-md text-cyan-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-cyan-600 text-cyan-200 hover:bg-cyan-900 hover:text-cyan-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!customText.trim()}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Start
          </Button>
        </div>
      </div>
    </div>
  );
};
