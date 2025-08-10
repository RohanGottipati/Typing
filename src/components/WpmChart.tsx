import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area
} from 'recharts';

interface WpmDataPoint {
  second: number;
  wpm: number;
}

interface WpmChartProps {
  wpmData: Array<{ second: number, wpm: number }>;
  testDuration: number;
}

export const WpmChart: React.FC<WpmChartProps> = ({ wpmData, testDuration }) => {
  // Add safe defaults
  const safeWpmData = wpmData || [];
  const safeTestDuration = testDuration || 30;
  // Transform the wpmData array into the required format for Recharts
  const chartData: WpmDataPoint[] = React.useMemo(() => {
    if (!safeWpmData || safeWpmData.length === 0) {
      return [];
    }

    // The data is already in the correct format, just ensure it's valid
    const data: WpmDataPoint[] = safeWpmData.map(item => ({
      second: item.second,
      wpm: Math.round(item.wpm * 100) / 100 // Round to 2 decimal places
    }));

    // Filter out any invalid data points and ensure we have data for all seconds
    const validData = data.filter(point => point.wpm >= 0 && !isNaN(point.wpm));
    
    // Fill in missing seconds with 0 WPM to keep timeline consistent
    const filledData: WpmDataPoint[] = [];
    for (let second = 1; second <= Math.max(safeTestDuration, ...validData.map(d => d.second)); second++) {
      const existingData = validData.find(d => d.second === second);
      filledData.push({
        second,
        wpm: existingData ? existingData.wpm : 0
      });
    }

    return filledData;
  }, [safeWpmData, safeTestDuration]);

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

  // Check if we have valid data
  if (!safeWpmData || safeWpmData.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm">
        <h3 className="text-xl font-semibold text-cyan-100 mb-2 text-center">📈 WPM Over Time</h3>
        <p className="text-cyan-300 text-sm text-center mb-4">
          Track your typing speed progression throughout the test
        </p>
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-cyan-200 text-lg">WPM data not available</p>
            <p className="text-cyan-300 text-sm mt-1">Complete a typing test to see your WPM progression</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm">
      <h3 className="text-xl font-semibold text-cyan-100 mb-2 text-center">📈 WPM Over Time</h3>
      <p className="text-cyan-300 text-sm text-center mb-6">
        Average typing speed progression per second
      </p>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00ffcc" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
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
                value: "Time (seconds)", 
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
            <Area 
              type="monotone" 
              dataKey="wpm" 
              stroke="none" 
              fill="url(#wpmGradient)"
              fillOpacity={0.3}
            />
            <Line 
              type="monotone" 
              dataKey="wpm" 
              stroke="#00ffcc" 
              strokeWidth={2}
              dot={{ 
                fill: '#10b981', 
                stroke: '#ffffff', 
                strokeWidth: 2, 
                r: 3,
                strokeDasharray: "0"
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
          <p>Debug: {chartData.length} data points, Test Duration: {safeTestDuration}s</p>
          <p>WPM Range: {chartData.length > 0 ? Math.min(...chartData.map(d => d.wpm)).toFixed(1) : '0'} - {chartData.length > 0 ? Math.max(...chartData.map(d => d.wpm)).toFixed(1) : '0'}</p>
        </div>
      )}
    </div>
  );
};
