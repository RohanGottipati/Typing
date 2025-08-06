import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestResult } from './TypingTest';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResultDashboardProps {
  result: TestResult;
  onRestart: () => void;
}

export const ResultDashboard = ({ result, onRestart }: ResultDashboardProps) => {
  // Prepare chart data
  const chartData = result.wpmOverTime.map((wpm, index) => ({
    time: `${(index + 1) * 5}s`,
    wpm
  }));

  // Get top missed characters
  const topMissedChars = Object.entries(result.missedCharacters)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 fade-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Test Complete!</h1>
          <p className="text-muted-foreground">Here are your results</p>
        </div>

        {/* Main Stats */}
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-metric-wpm mb-2">
                  {result.wpm}
                </div>
                <div className="text-muted-foreground uppercase tracking-wide">
                  Words Per Minute
                </div>
              </div>
              
              <div>
                <div className="text-5xl font-bold text-metric-accuracy mb-2">
                  {result.accuracy}%
                </div>
                <div className="text-muted-foreground uppercase tracking-wide">
                  Accuracy
                </div>
              </div>
              
              <div>
                <div className="text-5xl font-bold text-metric-error mb-2">
                  {result.backspaces}
                </div>
                <div className="text-muted-foreground uppercase tracking-wide">
                  Backspaces
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WPM Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">WPM Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="wpm" 
                      stroke="hsl(var(--metric-wpm))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--metric-wpm))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="space-y-6">
            {/* Most Missed Characters */}
            {topMissedChars.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Most Missed Characters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topMissedChars.map(([char, count]) => (
                      <div key={char} className="flex justify-between items-center">
                        <span className="typing-font text-lg bg-muted px-3 py-1 rounded">
                          {char}
                        </span>
                        <span className="text-metric-error font-semibold">
                          {count} miss{count !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Typing Tips */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Typing Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.suggestions.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <Button onClick={onRestart} size="lg" className="min-w-[150px]">
            Take Another Test
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.reload()}
            className="min-w-[150px]"
          >
            Reset All
          </Button>
        </div>
      </div>
    </div>
  );
};