import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface BehavioralInsightsProps {
  currentSession: {
    wpm: number;
    accuracy: number;
    backspaces: number;
    consistencyScore: number;
    reactionDelay: number;
    errorHotspots: { second: number; count: number }[];
    backspaceHotspots: { second: number; count: number }[];
    missedCharacters: { [key: string]: number };
    wpmOverTime: number[];
    testDuration: number;
  };
  historicalData: {
    averageWPM: number;
    averageAccuracy: number;
    averageBackspaces: number;
    averageConsistency: number;
    averageReactionDelay: number;
    totalSessions: number;
    recentSessions: Array<{
      wpm: number;
      accuracy: number;
      backspaces: number;
      consistencyScore: number;
      reactionDelay: number;
      testDuration: number;
    }>;
  };
}

interface Insight {
  type: 'strength' | 'weakness' | 'suggestion';
  title: string;
  description: string;
  metric?: string;
  icon: string;
}

export const BehavioralInsights: React.FC<BehavioralInsightsProps> = ({
  currentSession,
  historicalData
}) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    // Calculate improvements/declines
    const wpmChange = currentSession.wpm - historicalData.averageWPM;
    const accuracyChange = currentSession.accuracy - historicalData.averageAccuracy;
    const backspaceChange = currentSession.backspaces - historicalData.averageBackspaces;
    const consistencyChange = currentSession.consistencyScore - historicalData.averageConsistency;
    const reactionChange = currentSession.reactionDelay - historicalData.averageReactionDelay;
    
    // WPM Analysis
    if (wpmChange > 5) {
      insights.push({
        type: 'strength',
        title: 'Speed Improvement',
        description: `Your WPM improved by ${wpmChange.toFixed(1)} from your average of ${historicalData.averageWPM.toFixed(1)} WPM`,
        metric: `${wpmChange > 0 ? '+' : ''}${wpmChange.toFixed(1)} WPM`,
        icon: '🚀'
      });
    } else if (wpmChange < -5) {
      insights.push({
        type: 'weakness',
        title: 'Speed Decline',
        description: `Your WPM decreased by ${Math.abs(wpmChange).toFixed(1)} from your average. Consider focusing on speed drills.`,
        metric: `${wpmChange.toFixed(1)} WPM`,
        icon: '🐌'
      });
    }
    
    // Accuracy Analysis
    if (accuracyChange > 2) {
      insights.push({
        type: 'strength',
        title: 'Accuracy Boost',
        description: `Your accuracy improved by ${accuracyChange.toFixed(1)}% from your average of ${historicalData.averageAccuracy.toFixed(1)}%`,
        metric: `${accuracyChange > 0 ? '+' : ''}${accuracyChange.toFixed(1)}%`,
        icon: '🎯'
      });
    } else if (accuracyChange < -2) {
      insights.push({
        type: 'weakness',
        title: 'Accuracy Drop',
        description: `Your accuracy decreased by ${Math.abs(accuracyChange).toFixed(1)}%. Focus on precision over speed.`,
        metric: `${accuracyChange.toFixed(1)}%`,
        icon: '💥'
      });
    }
    
    // Consistency Analysis
    if (consistencyChange > 10) {
      insights.push({
        type: 'strength',
        title: 'Consistent Performance',
        description: `Your typing consistency improved by ${consistencyChange.toFixed(1)} points. Great rhythm!`,
        metric: `${consistencyChange > 0 ? '+' : ''}${consistencyChange.toFixed(1)}`,
        icon: '🎵'
      });
    } else if (consistencyChange < -10) {
      insights.push({
        type: 'weakness',
        title: 'Inconsistent Rhythm',
        description: `Your consistency dropped by ${Math.abs(consistencyChange).toFixed(1)} points. Try maintaining steady pace.`,
        metric: `${consistencyChange.toFixed(1)}`,
        icon: '📈'
      });
    }
    
    // Reaction Time Analysis
    if (reactionChange < -0.5) {
      insights.push({
        type: 'strength',
        title: 'Quick Start',
        description: `You started typing ${Math.abs(reactionChange).toFixed(2)}s faster than usual. Excellent focus!`,
        metric: `${reactionChange.toFixed(2)}s`,
        icon: '⚡'
      });
    } else if (reactionChange > 0.5) {
      insights.push({
        type: 'weakness',
        title: 'Slow Start',
        description: `You took ${reactionChange.toFixed(2)}s longer to start than usual. Try to begin typing immediately.`,
        metric: `+${reactionChange.toFixed(2)}s`,
        icon: '⏰'
      });
    }
    
    // Backspace Analysis
    if (backspaceChange < -5) {
      insights.push({
        type: 'strength',
        title: 'Fewer Corrections',
        description: `You used ${Math.abs(backspaceChange)} fewer backspaces than your average. Great precision!`,
        metric: `${backspaceChange} backspaces`,
        icon: '✨'
      });
    } else if (backspaceChange > 5) {
      insights.push({
        type: 'weakness',
        title: 'More Corrections',
        description: `You used ${backspaceChange} more backspaces than usual. Consider slowing down slightly for accuracy.`,
        metric: `+${backspaceChange} backspaces`,
        icon: '⌫'
      });
    }
    
    // Error Pattern Analysis
    const topErrorSecond = currentSession.errorHotspots[0];
    if (topErrorSecond && topErrorSecond.count > 2) {
      const timeDescription = topErrorSecond.second < 10 ? 'early' : 
                             topErrorSecond.second > currentSession.testDuration * 0.7 ? 'late' : 'mid-test';
      insights.push({
        type: 'suggestion',
        title: 'Error Timing',
        description: `Most errors occurred ${timeDescription} in the test (second ${topErrorSecond.second}). Focus on maintaining concentration ${timeDescription}.`,
        metric: `${topErrorSecond.count} errors`,
        icon: '🎯'
      });
    }
    
    // Fatigue Analysis (if test duration > 30s)
    if (currentSession.testDuration > 30 && currentSession.wpmOverTime.length > 3) {
      const firstHalf = currentSession.wpmOverTime.slice(0, Math.floor(currentSession.wpmOverTime.length / 2));
      const secondHalf = currentSession.wpmOverTime.slice(Math.floor(currentSession.wpmOverTime.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const fatigue = firstAvg - secondAvg;
      
      if (fatigue > 5) {
        insights.push({
          type: 'weakness',
          title: 'Endurance Issue',
          description: `Your speed dropped by ${fatigue.toFixed(1)} WPM in the second half. Build endurance with longer practice sessions.`,
          metric: `${fatigue.toFixed(1)} WPM drop`,
          icon: '💪'
        });
      } else if (fatigue < -5) {
        insights.push({
          type: 'strength',
          title: 'Endurance Strength',
          description: `You improved by ${Math.abs(fatigue).toFixed(1)} WPM in the second half. Great stamina!`,
          metric: `+${Math.abs(fatigue).toFixed(1)} WPM`,
          icon: '🏃'
        });
      }
    }
    
    // Character-specific suggestions
    const topMissedChar = Object.entries(currentSession.missedCharacters)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topMissedChar && topMissedChar[1] > 1) {
      const char = topMissedChar[0];
      const count = topMissedChar[1];
      const percentage = ((count / (currentSession.wpmOverTime.length * 5)) * 100).toFixed(1);
      
      insights.push({
        type: 'suggestion',
        title: 'Character Focus',
        description: `Focus on the "${char}" key — ${percentage}% of your errors involve this character.`,
        metric: `${count} errors`,
        icon: '⌨️'
      });
    }
    
    // Progress tracking
    if (historicalData.totalSessions > 5) {
      const recentAvg = historicalData.recentSessions
        .slice(-5)
        .reduce((sum, session) => sum + session.wpm, 0) / 5;
      const overallAvg = historicalData.averageWPM;
      
      if (recentAvg > overallAvg + 2) {
        insights.push({
          type: 'strength',
          title: 'Recent Progress',
          description: `Your recent sessions average ${recentAvg.toFixed(1)} WPM vs ${overallAvg.toFixed(1)} overall. You're improving!`,
          metric: `+${(recentAvg - overallAvg).toFixed(1)} WPM`,
          icon: '📈'
        });
      }
    }
    
    return insights.slice(0, 6); // Limit to 6 most relevant insights
  };
  
  const insights = generateInsights();
  
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'border-green-500 bg-green-500 bg-opacity-10';
      case 'weakness':
        return 'border-red-500 bg-red-500 bg-opacity-10';
      case 'suggestion':
        return 'border-blue-500 bg-blue-500 bg-opacity-10';
      default:
        return 'border-cyan-600 bg-gray-700';
    }
  };
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return '💚';
      case 'weakness':
        return '🔴';
      case 'suggestion':
        return '💡';
      default:
        return '📊';
    }
  };
  
  if (insights.length === 0) {
    return (
      <Card className="bg-gray-800 border border-cyan-600 shadow-lg shadow-cyan-500/25">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-cyan-100 mb-4 text-center">🧠 Behavioral Insights</h3>
          <p className="text-cyan-200 text-center">
            Complete more tests to receive personalized insights based on your typing patterns.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gray-800 border border-cyan-600 shadow-lg shadow-cyan-500/25">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-cyan-100 mb-4 text-center">🧠 Behavioral Insights</h3>
        
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-cyan-100">{insight.title}</h4>
                    <span className="text-sm font-mono text-cyan-300 bg-gray-700 px-2 py-1 rounded">
                      {insight.metric}
                    </span>
                  </div>
                  <p className="text-cyan-200 text-sm leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-cyan-600">
          <p className="text-cyan-200 text-sm text-center">
            💡 These insights are based on {historicalData.totalSessions} previous sessions. 
            Keep practicing to get more personalized feedback!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
