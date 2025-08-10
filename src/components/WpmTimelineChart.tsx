import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface WpmTimelineDataPoint {
  second: number;
  wpm: number;
}

interface WpmTimelineChartProps {
  wpmTimeline: WpmTimelineDataPoint[];
  smoothed?: boolean;
}

export const WpmTimelineChart: React.FC<WpmTimelineChartProps> = ({ 
  wpmTimeline, 
  smoothed = false 
}) => {
  // Check if we have valid data
  if (!wpmTimeline || wpmTimeline.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm">
        <h3 className="text-xl font-semibold text-cyan-100 mb-2 text-center">📈 WPM Over Time</h3>
        <p className="text-cyan-300 text-sm text-center mb-4">
          Track your typing speed progression throughout the test
        </p>
        <div className="h-[300px] w-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-cyan-200 text-lg">No WPM samples captured</p>
            <p className="text-cyan-300 text-sm mt-1">Complete a typing test to see your WPM progression</p>
          </div>
        </div>
      </div>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-cyan-500 rounded-lg p-3 shadow-lg">
          <p className="text-cyan-300 font-semibold">Second {label}</p>
          <p className="text-green-400 font-bold">
            WPM: {payload[0].value.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm">
      <h3 className="text-xl font-semibold text-cyan-100 mb-2 text-center">
        📈 WPM Over Time {smoothed && '(Smoothed)'}
      </h3>
      <p className="text-cyan-300 text-sm text-center mb-6">
        {smoothed ? '3-second moving average' : 'Real-time WPM progression'}
      </p>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={wpmTimeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              stroke="#444" 
              strokeDasharray="3 3" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="second" 
              stroke="#10b981"
              fontSize={12}
              tick={{ fill: '#10b981' }}
              label={{ 
                value: "Time (s)", 
                position: "insideBottom", 
                offset: -5,
                fill: '#06b6d4',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            <YAxis 
              stroke="#10b981"
              fontSize={12}
              tick={{ fill: '#10b981' }}
              label={{ 
                value: "WPM", 
                angle: -90, 
                position: "insideLeft",
                fill: '#06b6d4',
                fontSize: 12,
                fontWeight: 'bold'
              }}
              tickFormatter={(value) => `${value} WPM`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="wpm" 
              stroke="#00ffcc" 
              strokeWidth={2}
              dot={{ 
                fill: '#10b981', 
                stroke: '#ffffff', 
                strokeWidth: 2, 
                r: 3
              }}
              activeDot={{ 
                r: 6, 
                fill: '#00ffcc', 
                stroke: '#ffffff', 
                strokeWidth: 2 
              }}
              connectNulls={true}
              animationDuration={300}
              animationBegin={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-cyan-300">
          <p>Debug: {wpmTimeline.length} data points</p>
          <p>WPM Range: {wpmTimeline.length > 0 ? Math.min(...wpmTimeline.map(d => d.wpm)).toFixed(1) : '0'} - {wpmTimeline.length > 0 ? Math.max(...wpmTimeline.map(d => d.wpm)).toFixed(1) : '0'}</p>
          <p>Smoothed: {smoothed ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};
