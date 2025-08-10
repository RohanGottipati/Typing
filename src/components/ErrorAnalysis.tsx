import React from 'react';

interface ErrorHotspot {
  second: number;
  count: number;
}

interface ErrorAnalysisProps {
  errorHotspots: ErrorHotspot[];
  backspaceHotspots: ErrorHotspot[];
  testDuration: number;
  totalErrors: number;
  totalBackspaces: number;
}

export const ErrorAnalysis: React.FC<ErrorAnalysisProps> = ({
  errorHotspots,
  backspaceHotspots,
  testDuration,
  totalErrors,
  totalBackspaces
}) => {
  // Calculate peak error and correction seconds (excluding second 0)
  const validErrorHotspots = errorHotspots.filter(spot => spot.second > 0);
  const validBackspaceHotspots = backspaceHotspots.filter(spot => spot.second > 0);
  
  const peakErrorSecond = validErrorHotspots.length > 0 ? validErrorHotspots[0]?.second : null;
  const peakCorrectionSecond = validBackspaceHotspots.length > 0 ? validBackspaceHotspots[0]?.second : null;

  // Generate error insights
  const generateErrorInsights = () => {
    if (totalErrors === 0) {
      return "🎯 Perfect! No errors detected during your test.";
    }
    
    if (totalErrors > 2) {
      return `⚠️ You made ${totalErrors} errors. Focus on accuracy over speed.`;
    }
    
    return `⚠️ You made ${totalErrors} errors. Good accuracy!`;
  };

  // Generate backspace insights
  const generateBackspaceInsights = () => {
    if (totalBackspaces === 0) {
      return "✨ Excellent! No corrections needed during your test.";
    }
    
    if (totalBackspaces > 2) {
      return `⌫ You corrected yourself ${totalBackspaces} times. Good effort — but try for smoother typing.`;
    }
    
    return `⌫ You corrected yourself ${totalBackspaces} times. Good self-correction!`;
  };

  // Generate specific warnings for high error/correction seconds
  const generateSpecificWarnings = () => {
    const warnings = [];
    
    // Check for high error seconds
    if (validErrorHotspots.length > 0 && validErrorHotspots[0].count > 2) {
      warnings.push(`⚠️ You made the most mistakes in second ${validErrorHotspots[0].second} — try slowing down during this part of the test.`);
    }
    
    // Check for high backspace seconds
    if (validBackspaceHotspots.length > 0 && validBackspaceHotspots[0].count > 2) {
      warnings.push(`⌫ You made the most corrections in second ${validBackspaceHotspots[0].second} — focus on accuracy here.`);
    }
    
    return warnings;
  };

  // Create data for horizontal bar charts (excluding second 0)
  const createChartData = (hotspots: ErrorHotspot[], maxCount: number) => {
    return hotspots
      .filter(spot => spot.second > 0) // Exclude second 0
      .map(spot => ({
        second: spot.second,
        count: spot.count,
        percentage: maxCount > 0 ? (spot.count / maxCount) * 100 : 0
      }));
  };

  const maxErrorCount = validErrorHotspots.length > 0 ? Math.max(...validErrorHotspots.map(h => h.count)) : 0;
  const maxBackspaceCount = validBackspaceHotspots.length > 0 ? Math.max(...validBackspaceHotspots.map(h => h.count)) : 0;

  const errorChartData = createChartData(errorHotspots, maxErrorCount);
  const backspaceChartData = createChartData(backspaceHotspots, maxBackspaceCount);
  const specificWarnings = generateSpecificWarnings();

  return (
    <div className="mt-4 p-6 bg-gray-800 bg-opacity-70 rounded-lg border border-cyan-600 shadow-sm max-w-6xl mx-auto">
      <h4 className="text-xl font-semibold text-cyan-100 mb-4 text-center">🔍 Error & Correction Analysis</h4>
      


      {/* Insights Section */}
      <div className="mb-6 space-y-3 max-w-4xl mx-auto">
        <div className="p-3 bg-gray-700 rounded-lg border border-cyan-600">
          <p className="text-cyan-100 font-medium text-center">{generateErrorInsights()}</p>
        </div>
        <div className="p-3 bg-gray-700 rounded-lg border border-cyan-600">
          <p className="text-cyan-100 font-medium text-center">{generateBackspaceInsights()}</p>
        </div>
        {specificWarnings.map((warning, index) => (
          <div key={index} className="p-3 bg-yellow-900 bg-opacity-50 rounded-lg border border-yellow-600">
            <p className="text-yellow-100 font-medium text-center">{warning}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Error Hotspots Chart */}
        {errorChartData.length > 0 && (
          <div className="bg-gray-700 p-4 rounded-lg border border-cyan-600">
            <h5 className="font-semibold text-cyan-100 mb-3 flex items-center justify-center">
              <span className="text-lg mr-2">⚠️</span>
              Error Frequency by Second
            </h5>
            <div className="space-y-2">
              {errorChartData.map((data, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-16 text-sm font-medium text-cyan-200">
                    {data.second}s
                  </div>
                  <div className="flex-1 bg-gray-600 rounded-full h-4 relative">
                    <div 
                      className="bg-red-500 h-4 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-bold text-cyan-100 text-right">
                    {data.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-cyan-300 text-center">
              Higher bars indicate more errors in that second
            </div>
          </div>
        )}

        {/* Backspace Hotspots Chart */}
        {backspaceChartData.length > 0 && (
          <div className="bg-gray-700 p-4 rounded-lg border border-cyan-600">
            <h5 className="font-semibold text-cyan-100 mb-3 flex items-center justify-center">
              <span className="text-lg mr-2">⌫</span>
              Correction Frequency by Second
            </h5>
            <div className="space-y-2">
              {backspaceChartData.map((data, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-16 text-sm font-medium text-cyan-200">
                    {data.second}s
                  </div>
                  <div className="flex-1 bg-gray-600 rounded-full h-4 relative">
                    <div 
                      className="bg-green-500 h-4 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-bold text-cyan-100 text-right">
                    {data.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-cyan-300 text-center">
              Higher bars indicate more corrections in that second
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-cyan-600 max-w-4xl mx-auto">
        <h6 className="font-semibold text-cyan-100 mb-2 text-center">💡 What This Means</h6>
        <div className="text-sm text-cyan-200 space-y-1">
          <p className="text-center">• <strong>Error patterns</strong> help identify when you're most likely to make mistakes</p>
          <p className="text-center">• <strong>Correction timing</strong> shows when you need to fix errors most often</p>
          <p className="text-center">• <strong>Peak seconds</strong> indicate areas for focused practice and improvement</p>
        </div>
      </div>
    </div>
  );
};
