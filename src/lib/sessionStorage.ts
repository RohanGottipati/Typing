export interface SessionData {
  id: string;
  timestamp: number;
  wpm: number;
  accuracy: number;
  personaType: string;
  backspaces: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  testDuration: number;
  textType: string;
  wpmHistory: number[];
  consistencyScore: number;
  fatigueScore: number;
  reactionDelay: number;
  topErrorHotspots: { second: number; count: number }[];
  topBackspaceHotspots: { second: number; count: number }[];
  missedCharacters: { [key: string]: number };
  personaInsights: string[];
}

const STORAGE_KEY = 'typing-sessions';

// Save a new session
export const saveSession = (
  wpm: number, 
  accuracy: number, 
  personaType: string,
  backspaces: number,
  totalCharacters: number,
  correctCharacters: number,
  incorrectCharacters: number,
  testDuration: number,
  textType: string,
  wpmHistory: number[],
  consistencyScore: number,
  fatigueScore: number,
  reactionDelay: number,
  topErrorHotspots: { second: number; count: number }[],
  topBackspaceHotspots: { second: number; count: number }[],
  missedCharacters: { [key: string]: number },
  personaInsights: string[]
): void => {
  try {
    const sessions = getSessions();
    const newSession: SessionData = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      wpm: Math.round(wpm * 10) / 10, // Round to 1 decimal place
      accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal place
      personaType,
      backspaces,
      totalCharacters,
      correctCharacters,
      incorrectCharacters,
      testDuration,
      textType,
      wpmHistory,
      consistencyScore,
      fatigueScore,
      reactionDelay,
      topErrorHotspots,
      topBackspaceHotspots,
      missedCharacters,
      personaInsights
    };
    
    sessions.unshift(newSession); // Add to beginning
    
    // Keep only last 50 sessions
    if (sessions.length > 50) {
      sessions.splice(50);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    console.log('sessionStorage: Session saved:', newSession);
    console.log('sessionStorage: Total sessions in storage:', sessions.length);
    
    // Dispatch custom event to notify components that a session was saved
    window.dispatchEvent(new CustomEvent('sessionSaved'));
    console.log('sessionStorage: Dispatched sessionSaved event');
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// Get all sessions
export const getSessions = (): SessionData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading sessions:', error);
  }
  return [];
};

// Clear all sessions
export const clearSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('All sessions cleared');
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
};

// Format timestamp for display
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};
