import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { getSessions } from '@/lib/sessionStorage';


interface Session {
  id: string;
  wpm: number;
  accuracy: number;
  timestamp: string;
  mode: string;
  testDuration: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  backspaces: number;
  commonlyMistypedCharacters: { [key: string]: number };
  topErrorHotspots: string[];
  topBackspaceHotspots: string[];
}

interface AnalyticsData {
  sessions: Session[];
  filteredSessions: Session[];
  summary: {
    totalTests: number;
    bestWPM: number;
    averageWPM: number;
    averageAccuracy: number;
    accuracyTrend: number;
    totalCharacters: number;
    totalErrors: number;
  };
  wpmTrend: Array<{ date: string; wpm: number; sessionId: string }>;
  accuracyTrend: Array<{ date: string; accuracy: number; sessionId: string }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [filters, setFilters] = useState({
    mode: 'all',
    dateFrom: '',
    dateTo: '',
    minWPM: '',
    maxWPM: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load and process data
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        const sessions = getSessions();
        const processedData = processAnalyticsData(sessions);
        setData(processedData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Process raw session data into analytics format
  const processAnalyticsData = (sessions: any[]): AnalyticsData => {
    if (sessions.length === 0) {
      return {
        sessions: [],
        filteredSessions: [],
        summary: {
          totalTests: 0,
          bestWPM: 0,
          averageWPM: 0,
          averageAccuracy: 0,
          accuracyTrend: 0,
          totalCharacters: 0,
          totalErrors: 0
        },
        wpmTrend: [],
        accuracyTrend: []
      };
    }

    // Convert sessions to proper format
    const processedSessions: Session[] = sessions.map(session => ({
      id: session.id,
      wpm: session.wpm || 0,
      accuracy: session.accuracy || 0,
      timestamp: session.timestamp || new Date().toISOString(),
      mode: session.mode || 'time',
      testDuration: session.testDuration || 30,
      totalCharacters: session.totalCharacters || 0,
      correctCharacters: session.correctCharacters || 0,
      incorrectCharacters: session.incorrectCharacters || 0,
      backspaces: session.backspaces || 0,
      commonlyMistypedCharacters: session.commonlyMistypedCharacters || {},
      topErrorHotspots: session.topErrorHotspots || [],
      topBackspaceHotspots: session.topBackspaceHotspots || []
    }));

    // Sort by timestamp
    processedSessions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate trends
    const wpmTrend = processedSessions.map(session => ({
      date: new Date(session.timestamp).toLocaleDateString(),
      wpm: session.wpm,
      sessionId: session.id
    }));

    const accuracyTrend = processedSessions.map(session => ({
      date: new Date(session.timestamp).toLocaleDateString(),
      accuracy: session.accuracy,
      sessionId: session.id
    }));



    
    
    // Calculate summary statistics
    const totalTests = processedSessions.length;
    const bestWPM = Math.max(...processedSessions.map(s => s.wpm));
    const averageWPM = processedSessions.reduce((sum, s) => sum + s.wpm, 0) / totalTests;
    const averageAccuracy = processedSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalTests;
    const totalCharacters = processedSessions.reduce((sum, s) => sum + s.totalCharacters, 0);
    const totalErrors = processedSessions.reduce((sum, s) => sum + s.incorrectCharacters, 0);

    // Calculate accuracy trend (last 5 sessions vs previous 5)
    const recentSessions = processedSessions.slice(-5);
    const previousSessions = processedSessions.slice(-10, -5);
    const recentAccuracy = recentSessions.length > 0 ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length : 0;
    const previousAccuracy = previousSessions.length > 0 ? previousSessions.reduce((sum, s) => sum + s.accuracy, 0) / previousSessions.length : 0;
    const accuracyTrendValue = previousAccuracy > 0 ? ((recentAccuracy - previousAccuracy) / previousAccuracy) * 100 : 0;

    return {
      sessions: processedSessions,
      filteredSessions: processedSessions, // Will be filtered later
      summary: {
        totalTests,
        bestWPM,
        averageWPM,
        averageAccuracy,
        accuracyTrend,
        totalCharacters,
        totalErrors
      },
      wpmTrend,
      accuracyTrend
    };
  };

  // Apply filters
  const filteredData = useMemo(() => {
    if (!data) return null;

    let filtered = data.sessions;

    // Filter by mode
    if (filters.mode !== 'all') {
      filtered = filtered.filter(session => session.mode === filters.mode);
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(session => new Date(session.timestamp) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(session => new Date(session.timestamp) <= toDate);
    }

    // Filter by WPM range
    if (filters.minWPM) {
      filtered = filtered.filter(session => session.wpm >= parseFloat(filters.minWPM));
    }

    if (filters.maxWPM) {
      filtered = filtered.filter(session => session.wpm <= parseFloat(filters.maxWPM));
    }

    // Recalculate trends and analysis with filtered data
    const wpmTrend = filtered.map(session => ({
      date: new Date(session.timestamp).toLocaleDateString(),
      wpm: session.wpm,
      sessionId: session.id
    }));

    const accuracyTrend = filtered.map(session => ({
      date: new Date(session.timestamp).toLocaleDateString(),
      accuracy: session.accuracy,
      sessionId: session.id
    }));





    // Recalculate summary
    const totalTests = filtered.length;
    const bestWPM = totalTests > 0 ? Math.max(...filtered.map(s => s.wpm)) : 0;
    const averageWPM = totalTests > 0 ? filtered.reduce((sum, s) => sum + s.wpm, 0) / totalTests : 0;
    const averageAccuracy = totalTests > 0 ? filtered.reduce((sum, s) => sum + s.accuracy, 0) / totalTests : 0;
    const totalCharacters = filtered.reduce((sum, s) => sum + s.totalCharacters, 0);
    const totalErrors = filtered.reduce((sum, s) => sum + s.incorrectCharacters, 0);

    const recentSessions = filtered.slice(-5);
    const previousSessions = filtered.slice(-10, -5);
    const recentAccuracy = recentSessions.length > 0 ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length : 0;
    const previousAccuracy = previousSessions.length > 0 ? previousSessions.reduce((sum, s) => sum + s.accuracy, 0) / previousSessions.length : 0;
    const accuracyTrendValue = previousAccuracy > 0 ? ((recentAccuracy - previousAccuracy) / previousAccuracy) * 100 : 0;

    return {
      ...data,
      filteredSessions: filtered,
      summary: {
        totalTests,
        bestWPM,
        averageWPM,
        averageAccuracy,
        accuracyTrend: accuracyTrendValue,
        totalCharacters,
        totalErrors
      },
      wpmTrend,
      accuracyTrend
    };
  }, [data, filters]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!filteredData || filteredData.sessions.length === 0) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-cyan-100 mb-2">No Data Available</h2>
              <p className="text-cyan-200">Complete some typing tests to see your analytics dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 fade-in">
          <h1 className="text-4xl font-bold text-cyan-100">Analytics Dashboard</h1>
          <p className="text-cyan-200 stagger-1">Comprehensive analysis of your typing performance</p>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance">
          <CardHeader>
            <CardTitle className="text-cyan-100">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-cyan-200">Mode</Label>
                <Select value={filters.mode} onValueChange={(value) => setFilters(prev => ({ ...prev, mode: value }))}>
                  <SelectTrigger className="bg-gray-800 border-cyan-600 text-cyan-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-cyan-600">
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="words">Words</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="zen">Zen</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-cyan-200">Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="bg-gray-800 border-cyan-600 text-cyan-100"
                />
              </div>
              
              <div>
                <Label className="text-cyan-200">Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="bg-gray-800 border-cyan-600 text-cyan-100"
                />
              </div>
              
              <div>
                <Label className="text-cyan-200">Min WPM</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minWPM}
                  onChange={(e) => setFilters(prev => ({ ...prev, minWPM: e.target.value }))}
                  className="bg-gray-800 border-cyan-600 text-cyan-100"
                />
              </div>
              
              <div>
                <Label className="text-cyan-200">Max WPM</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={filters.maxWPM}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxWPM: e.target.value }))}
                  className="bg-gray-800 border-cyan-600 text-cyan-100"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => setFilters({ mode: 'all', dateFrom: '', dateTo: '', minWPM: '', maxWPM: '' })}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 btn-hover btn-active"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance stagger-1">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cyan-400">{filteredData.summary.totalTests}</div>
              <p className="text-cyan-200 text-sm">Total Tests</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance stagger-2">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{filteredData.summary.bestWPM.toFixed(1)}</div>
              <p className="text-cyan-200 text-sm">Best WPM</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance stagger-3">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cyan-400">{filteredData.summary.averageWPM.toFixed(1)}</div>
              <p className="text-cyan-200 text-sm">Average WPM</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance stagger-4">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400">{filteredData.summary.averageAccuracy.toFixed(1)}%</div>
              <p className="text-cyan-200 text-sm">Average Accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WPM Trend */}
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance stagger-1">
            <CardHeader>
              <CardTitle className="text-cyan-100">WPM Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData.wpmTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #0891B2',
                      borderRadius: '8px',
                      color: '#E5E7EB'
                    }}
                  />
                  <Line type="monotone" dataKey="wpm" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4' }} className="chart-line" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Accuracy Trend */}
          <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 card-entrance stagger-2">
            <CardHeader>
              <CardTitle className="text-cyan-100">Accuracy Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData.accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #0891B2',
                      borderRadius: '8px',
                      color: '#E5E7EB'
                    }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} className="chart-line" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>




      </div>
    </div>
  );
};
