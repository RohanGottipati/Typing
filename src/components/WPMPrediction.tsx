import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { wpmPredictor, PredictionResult } from '@/lib/wpmPredictor';
import { getSessions } from '@/lib/sessionStorage';

export const WPMPrediction: React.FC = () => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    updatePrediction();
  }, []);

  const updatePrediction = () => {
    setIsLoading(true);
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      try {
        const sessions = getSessions();
        setSessionCount(sessions.length);
        
        if (sessions.length === 0) {
          setPrediction(null);
          setIsLoading(false);
          return;
        }

        const newPrediction = wpmPredictor.predictNextSessionWPM(sessions);
        setPrediction(newPrediction);
        
        console.log('🔮 WPM Prediction updated:', newPrediction);
      } catch (error) {
        console.error('❌ Error updating WPM prediction:', error);
        setPrediction(null);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  // Update prediction when component mounts or when sessions change
  useEffect(() => {
    const handleStorageChange = () => {
      updatePrediction();
    };

    const handleSessionSaved = () => {
      updatePrediction();
    };

    // Listen for storage changes (when new sessions are saved)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom session saved event
    window.addEventListener('sessionSaved', handleSessionSaved);
    
    // Also update when the page becomes visible (in case sessions were saved in another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePrediction();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionSaved', handleSessionSaved);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (sessionCount === 0) {
    return null; // Don't show anything if no sessions exist
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border border-cyan-600 shadow-lg shadow-cyan-500/25 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
            <span className="text-cyan-200 text-sm">Training prediction model...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="bg-gray-800 border border-cyan-600 shadow-lg shadow-cyan-500/25 mb-6">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🔮</div>
            <h3 className="text-lg font-semibold text-cyan-100 mb-1">WPM Prediction</h3>
            <p className="text-cyan-200 text-sm">
              Prediction model is being trained...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return '🎯';
    if (confidence >= 60) return '📊';
    return '⚠️';
  };

  return (
    <Card className="bg-gray-800 border border-cyan-600 shadow-lg shadow-cyan-500/25 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🔮</div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-100">Next Session WPM</h3>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-cyan-400">
                  {prediction.predictedWPM}
                </span>
                <span className="text-sm text-cyan-200">WPM</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-sm">{getConfidenceIcon(prediction.confidence)}</span>
              <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence.toFixed(0)}% confidence
              </span>
            </div>
            <p className="text-xs text-cyan-300">
              Based on {sessionCount} sessions
            </p>
            <p className="text-xs text-gray-400">
              Updated {prediction.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {/* Feature importance indicators */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-cyan-200">
              Recent avg: {prediction.features.averageWPM.toFixed(1)} WPM
            </span>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-cyan-200">
              Accuracy: {prediction.features.accuracy.toFixed(1)}%
            </span>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-cyan-200">
              Consistency: {prediction.features.consistencyScore.toFixed(0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
