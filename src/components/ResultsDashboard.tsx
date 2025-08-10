import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessions } from '@/lib/sessionStorage';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ResultsDashboardProps {
  currentWPM: number;
  currentAccuracy: number;
}

export const ResultsDashboard = ({ currentWPM, currentAccuracy }: ResultsDashboardProps) => {
  const analyticsData = useMemo(() => {
    try {
      const sessions = getSessions();
      
      if (sessions.length === 0) {
        return {
          bestWPM: 0,
          averageWPM: 0,
          accuracyTrend: 0,
          totalSessions: 0,
          wpmChartData: [],
          accuracyChartData: []
        };
      }

      // Calculate summary stats
      const wpmValues = sessions.map(s => s.wpm);
      const accuracyValues = sessions.map(s => s.accuracy);
      
      const bestWPM = Math.max(...wpmValues);
      const averageWPM = wpmValues.reduce((sum, wpm) => sum + wpm, 0) / wpmValues.length;
      const totalSessions = sessions.length;

      // Calculate accuracy trend (last 5 vs overall)
      const recentSessions = sessions.slice(0, 5);
      const recentAccuracy = recentSessions.length > 0 
        ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length 
        : 0;
      const overallAccuracy = accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length;
      const accuracyTrend = recentAccuracy - overallAccuracy;

      // Prepare chart data (last 20 sessions)
      const recentSessionsForChart = sessions.slice(0, 20).reverse();
      const wpmChartData = recentSessionsForChart.map((session, index) => ({
        session: index + 1,
        wpm: session.wpm
      }));
      
      const accuracyChartData = recentSessionsForChart.map((session, index) => ({
        session: index + 1,
        accuracy: session.accuracy
      }));

      return {
        bestWPM: Math.round(bestWPM * 10) / 10,
        averageWPM: Math.round(averageWPM * 10) / 10,
        accuracyTrend: Math.round(accuracyTrend * 10) / 10,
        totalSessions,
        wpmChartData,
        accuracyChartData
      };
    } catch (error) {
      console.error('Error calculating analytics data:', error);
      return {
        bestWPM: 0,
        averageWPM: 0,
        accuracyTrend: 0,
        totalSessions: 0,
        wpmChartData: [],
        accuracyChartData: []
      };
    }
  }, [currentWPM, currentAccuracy]);

  const hasChartData = analyticsData.wpmChartData.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Best WPM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.bestWPM}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average WPM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.averageWPM}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analyticsData.accuracyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.accuracyTrend >= 0 ? '+' : ''}{analyticsData.accuracyTrend}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analyticsData.totalSessions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {hasChartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WPM Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analyticsData.wpmChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="session" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} WPM`, 'WPM']}
                    labelFormatter={(label) => `Session ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="wpm" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accuracy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analyticsData.accuracyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="session" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Accuracy']}
                    labelFormatter={(label) => `Session ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasChartData && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">No data yet</p>
              <p className="text-sm">Complete more tests to see your progress charts</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
