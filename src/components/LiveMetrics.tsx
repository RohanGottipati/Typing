import { Card, CardContent } from '@/components/ui/card';
import { TestStats } from './TypingTest';

interface LiveMetricsProps {
  stats: TestStats;
  timeRemaining: number;
  totalTime: number;
}

export const LiveMetrics = ({ stats, timeRemaining, totalTime }: LiveMetricsProps) => {
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Live Metrics</h2>
          <div className="text-2xl font-bold text-primary">
            {timeRemaining}s
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-metric-wpm mb-1">
              {stats.wpm}
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              WPM
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-metric-accuracy mb-1">
              {stats.accuracy}%
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              Accuracy
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-metric-error mb-1">
              {stats.backspaces}
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              Backspaces
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};