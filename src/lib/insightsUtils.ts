import { getSessions } from './sessionStorage';

export interface HistoricalData {
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
}

export const calculateHistoricalAverages = (): HistoricalData => {
  const sessions = getSessions();
  
  if (sessions.length === 0) {
    return {
      averageWPM: 0,
      averageAccuracy: 0,
      averageBackspaces: 0,
      averageConsistency: 0,
      averageReactionDelay: 0,
      totalSessions: 0,
      recentSessions: []
    };
  }
  
  // Calculate averages
  const totalWPM = sessions.reduce((sum, session) => sum + session.wpm, 0);
  const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracy, 0);
  const totalBackspaces = sessions.reduce((sum, session) => sum + session.backspaces, 0);
  const totalConsistency = sessions.reduce((sum, session) => sum + (session.typingConsistencyScore || 50), 0);
  const totalReactionDelay = sessions.reduce((sum, session) => sum + (session.reactionDelay || 0), 0);
  
  const averageWPM = totalWPM / sessions.length;
  const averageAccuracy = totalAccuracy / sessions.length;
  const averageBackspaces = totalBackspaces / sessions.length;
  const averageConsistency = totalConsistency / sessions.length;
  const averageReactionDelay = totalReactionDelay / sessions.length;
  
  // Get recent sessions (last 10)
  const recentSessions = sessions
    .slice(-10)
    .map(session => ({
      wpm: session.wpm,
      accuracy: session.accuracy,
      backspaces: session.backspaces,
      consistencyScore: session.typingConsistencyScore || 50,
      reactionDelay: session.reactionDelay || 0,
      testDuration: session.testDuration || 30
    }));
  
  return {
    averageWPM,
    averageAccuracy,
    averageBackspaces,
    averageConsistency,
    averageReactionDelay,
    totalSessions: sessions.length,
    recentSessions
  };
};

export const getCurrentSessionData = (
  finalWPM: number,
  finalAccuracy: number,
  backspaces: number,
  behavioralMetrics: any,
  missedCharacters: { [key: string]: number },
  analytics_wpmTimeline: Array<{ second: number, wpm: number }>,
  testDuration: number
) => {
  return {
    wpm: finalWPM,
    accuracy: finalAccuracy,
    backspaces: backspaces,
    consistencyScore: behavioralMetrics?.typingConsistencyScore || 50,
    reactionDelay: behavioralMetrics?.reactionDelay || 0,
    errorHotspots: behavioralMetrics?.topErrorHotspots || [],
    backspaceHotspots: behavioralMetrics?.topBackspaceHotspots || [],
    missedCharacters: missedCharacters || {},
    wpmOverTime: analytics_wpmTimeline?.map(item => item.wpm) || [],
    testDuration: testDuration
  };
};
