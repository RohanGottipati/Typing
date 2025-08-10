import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessions, clearSessions, formatTimestamp, type SessionData } from '@/lib/sessionStorage';
import { ErrorAnalysis } from './ErrorAnalysis';


interface SessionHistoryProps {
  onSessionSelect?: (session: SessionData) => void;
  selectedSessionId?: string | null;
}

export const SessionHistory = ({ onSessionSelect, selectedSessionId }: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);

  useEffect(() => {
    loadSessions();
    
    // Listen for storage changes to update the session history
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'typing-sessions') {
        loadSessions();
      }
    };

    // Listen for custom events when sessions are saved
    const handleSessionSaved = () => {
      loadSessions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionSaved', handleSessionSaved);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionSaved', handleSessionSaved);
    };
  }, []);

  const loadSessions = () => {
    const sessionData = getSessions();
    setSessions(sessionData);
    console.log('SessionHistory: Loaded sessions:', sessionData);
    console.log('SessionHistory: Number of sessions:', sessionData.length);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all session history? This action cannot be undone.')) {
      clearSessions();
      setSessions([]);
      setSelectedSession(null);
    }
  };

  const handleRefresh = () => {
    loadSessions();
  };

  const handleSessionClick = (session: SessionData) => {
    setSelectedSession(session);
    onSessionSelect?.(session);
  };

  if (sessions.length === 0) {
    return (
      <Card className="bg-gray-900 border-cyan-600 shadow-lg shadow-cyan-500/25">
        <CardContent className="p-6 text-center">
          <div className="text-cyan-400 mb-2 text-2xl">📊</div>
          <h3 className="text-lg font-semibold text-cyan-100 mb-2">No Session History</h3>
          <p className="text-cyan-200">Complete your first typing test to start tracking your progress!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session List */}
      <Card className="bg-gray-900 border-cyan-600 shadow-lg shadow-cyan-500/25">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-cyan-100">Session History</CardTitle>
            <p className="text-sm text-cyan-200 mt-1">Click any row to view detailed results</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="text-cyan-200 border-cyan-600 hover:bg-cyan-900 hover:text-cyan-100"
            >
              🔄 Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearHistory}
              className="text-red-400 border-red-600 hover:bg-red-900 hover:text-red-100"
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyan-600">
                  <th className="text-left py-3 px-2 font-medium text-cyan-100">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-cyan-100">WPM</th>
                  <th className="text-left py-3 px-2 font-medium text-cyan-100">Accuracy</th>
                  <th className="text-left py-3 px-2 font-medium text-cyan-100">Persona</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr 
                    key={session.id} 
                    className={`border-b border-cyan-800 hover:bg-cyan-900 cursor-pointer transition-colors ${
                      selectedSessionId === session.id ? 'bg-cyan-900 border-cyan-500' : ''
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <td className="py-3 px-2 text-cyan-200">
                      {formatTimestamp(session.timestamp)}
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-cyan-100">{session.wpm.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-cyan-100">{session.accuracy.toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-800 text-cyan-100 border border-cyan-600">
                        {session.personaType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Session Results */}
      {selectedSession && (
        <Card className="bg-gray-900 border-cyan-600 shadow-lg shadow-cyan-500/25">
          <CardHeader>
            <CardTitle className="text-cyan-100 text-center">Session Details - {formatTimestamp(selectedSession.timestamp)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm text-center">
                <div className="text-4xl font-bold text-cyan-100 mb-2">
                  {selectedSession.wpm.toFixed(1)}
                </div>
                <div className="text-cyan-200 uppercase tracking-wide text-sm font-medium">Words Per Minute</div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm text-center">
                <div className="text-4xl font-bold text-cyan-100 mb-2">
                  {selectedSession.accuracy.toFixed(1)}%
                </div>
                <div className="text-cyan-200 uppercase tracking-wide text-sm font-medium">Accuracy</div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm text-center">
                <div className="text-4xl font-bold text-cyan-100 mb-2">
                  {selectedSession.backspaces}
                </div>
                <div className="text-cyan-200 uppercase tracking-wide text-sm font-medium">Backspaces</div>
              </div>
            </div>



            {/* Behavioral Metrics */}
            <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm">
              <h3 className="text-xl font-semibold text-cyan-100 mb-4 text-center">🎯 Behavioral Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="text-center p-6 bg-gray-700 rounded-lg border border-cyan-600 shadow-sm">
                  <div className="text-3xl font-bold text-cyan-100 mb-2">
                    {isNaN(selectedSession.consistencyScore) ? '50' : Math.round(selectedSession.consistencyScore)}
                  </div>
                  <div className="text-sm text-cyan-200 font-medium mb-2">Consistency Score</div>
                  <div className="text-xs text-cyan-300">
                    {selectedSession.consistencyScore >= 80 ? '🌟 Excellent' : 
                     selectedSession.consistencyScore >= 60 ? '✨ Good' : 
                     selectedSession.consistencyScore >= 40 ? '👍 Fair' : '💪 Keep Practicing'}
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-700 rounded-lg border border-cyan-600 shadow-sm">
                  <div className="text-3xl font-bold text-cyan-100 mb-2">
                    {selectedSession.reactionDelay.toFixed(2)}s
                  </div>
                  <div className="text-sm text-cyan-200 font-medium mb-2">Reaction Delay</div>
                  <div className="text-xs text-cyan-300">
                    {selectedSession.reactionDelay <= 1 ? '🚀 Quick Start' : 
                     selectedSession.reactionDelay <= 3 ? '✨ Normal' : '⏳ Slow Start'}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Analysis */}
            {selectedSession.topErrorHotspots && selectedSession.topBackspaceHotspots && (
              <ErrorAnalysis 
                errorHotspots={selectedSession.topErrorHotspots}
                backspaceHotspots={selectedSession.topBackspaceHotspots}
                testDuration={selectedSession.testDuration}
                totalErrors={selectedSession.totalCharacters - selectedSession.correctCharacters}
                totalBackspaces={selectedSession.backspaces}
              />
            )}

            {/* Persona Information */}
            {selectedSession.personaType && (
              <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm">
                <h3 className="text-xl font-semibold text-cyan-100 mb-4 text-center">🎭 Typing Persona</h3>
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <h4 className="text-lg font-bold text-cyan-100 mb-2">{selectedSession.personaType}</h4>
                  <p className="text-cyan-200">Your typing style and characteristics from this session</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
