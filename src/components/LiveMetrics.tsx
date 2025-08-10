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
    <Card className="bg-gray-900 border-cyan-600 shadow-lg shadow-cyan-500/25">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-cyan-100">Live Metrics</h2>
          <div className="text-2xl font-bold text-green-100">
            {timeRemaining}s
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-linear shadow-lg shadow-cyan-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-100 mb-1">
              {stats.wpm}
            </div>
            <div className="text-sm text-cyan-200 uppercase tracking-wide">
              WPM
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-100 mb-1">
              {stats.accuracy}%
            </div>
            <div className="text-sm text-cyan-200 uppercase tracking-wide">
              Accuracy
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-100 mb-1">
              {stats.backspaces}
            </div>
            <div className="text-sm text-cyan-200 uppercase tracking-wide">
              Backspaces
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};