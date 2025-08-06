import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TestSettings } from './TypingTest';

interface TestConfigProps {
  settings: TestSettings;
  onSettingsChange: (settings: TestSettings) => void;
}

export const TestConfig = ({ settings, onSettingsChange }: TestConfigProps) => {
  const durations = [15, 30, 60, 120];
  const textTypes = [
    { key: 'random' as const, label: 'Random Words' },
    { key: 'quotes' as const, label: 'Quotes' },
    { key: 'code' as const, label: 'Code Snippets' }
  ];

  return (
    <div className="space-y-6">
      {/* Duration Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Duration</h3>
        <div className="flex gap-2 flex-wrap">
          {durations.map(duration => (
            <Button
              key={duration}
              variant={settings.duration === duration ? "default" : "outline"}
              size="sm"
              onClick={() => onSettingsChange({ ...settings, duration })}
              className="min-w-[60px]"
            >
              {duration}s
            </Button>
          ))}
        </div>
      </div>

      {/* Text Type Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Text Type</h3>
        <div className="flex gap-2 flex-wrap">
          {textTypes.map(type => (
            <Button
              key={type.key}
              variant={settings.textType === type.key ? "default" : "outline"}
              size="sm"
              onClick={() => onSettingsChange({ ...settings, textType: type.key })}
              className="flex-1 min-w-[100px]"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};