import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypingViewport, TypingViewportRef } from './TypingViewport';
import { TestConfig } from './TestConfig';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SessionHistory } from './SessionHistory';
import { BehavioralInsights } from './BehavioralInsights';
import { ErrorAnalysis } from './ErrorAnalysis';
import { WPMPrediction } from './WPMPrediction';
import { generateText, generateExactWordCount, TextGeneratorOptions } from '@/lib/textGenerator';
import { getRandomQuote } from '@/lib/quotesData';
import { saveSession } from '@/lib/sessionStorage';
import { calculateBehavioralMetrics } from '@/lib/behavioralMetrics';
import { analyzeTypingPersona, getPersonaInsights } from '@/lib/typingPersonas';
import { exportToCSV, exportToJSON } from '@/lib/exportUtils';

export interface TestSettings {
  duration: number;
  textType: 'sentences' | 'quotes' | 'code';
  mode: 'time' | 'words' | 'quote' | 'zen' | 'custom';
  punctuation: boolean;
  numbers: boolean;
  wordCount?: number;
  customText?: string;
  customUseTime?: boolean;
  customUseWords?: boolean;
  customTimeLimit?: number;
  customWordLimit?: number;
}

export interface KeystrokeData {
  key: string;
  keyId: string;
  correct: boolean;
  timestamp: number;
  position: number;
  latency?: number;
}

export const TypingTest = () => {
  // View state
  const [currentView, setCurrentView] = useState<'main' | 'analytics'>('main');
  
  // Test state
  const [testSettings, setTestSettings] = useState<TestSettings>({ 
    duration: 30, 
    textType: 'sentences',
    mode: 'time',
    punctuation: true,
    numbers: true,
    wordCount: 25,
    customText: '',
    customUseTime: false,
    customUseWords: false,
    customTimeLimit: 30,
    customWordLimit: 25
  });
  const [isTestActive, setIsTestActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [expectedText, setExpectedText] = useState('');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [typedCharacters, setTypedCharacters] = useState<string[]>([]);
  const [characterStatus, setCharacterStatus] = useState<('pending' | 'correct' | 'incorrect' | 'extra')[]>([]);
  
  // Word-based tracking for smooth input handling
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const [wordList, setWordList] = useState<string[]>([]);
  const [charStates, setCharStates] = useState<Array<Array<'pending' | 'correct' | 'incorrect' | 'extra'>>>([]);
  const [isComposing, setIsComposing] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  
  // Statistics
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const [totalTypedCharacters, setTotalTypedCharacters] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [missedCharacters, setMissedCharacters] = useState<{ [key: string]: number }>({});
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [liveWPM, setLiveWPM] = useState(0);
  const [firstKeystrokeTime, setFirstKeystrokeTime] = useState<number | null>(null);
  
  // Analytics tracking
  const [analytics_wpmTimeline, setAnalytics_wpmTimeline] = useState<Array<{ second: number, wpm: number }>>([]);
  const [analytics_correctCharsSoFar, setAnalytics_correctCharsSoFar] = useState(0);
  
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [finalWPM, setFinalWPM] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [behavioralMetrics, setBehavioralMetrics] = useState<{
    typingConsistencyScore: number;
    fatigueScore: number;
    reactionDelay: number;
    topErrorHotspots: { second: number; count: number }[];
    topBackspaceHotspots: { second: number; count: number }[];
  }>({
    typingConsistencyScore: 0,
    fatigueScore: 0,
    reactionDelay: 0,
    topErrorHotspots: [],
    topBackspaceHotspots: []
  });
  
  // Typing persona
  const [typingPersona, setTypingPersona] = useState<any>(null);
  const [personaInsights, setPersonaInsights] = useState<string[]>([]);
  
  // Keystroke logging
  const [keystrokeLog, setKeystrokeLog] = useState<KeystrokeData[]>([]);
  
  // Zen mode
  const [zenContent, setZenContent] = useState('');
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const testEndedRef = useRef(false);
  const isStartingRef = useRef(false);
  const typingViewportRef = useRef<TypingViewportRef>(null);

  // Generate text for current mode
  const generateTextForMode = useCallback(() => {
    // Custom mode with custom text
    if (testSettings.mode === 'custom' && testSettings.customText) {
      return testSettings.customText;
    }
    
    // Words mode or custom mode with word limit
    if (testSettings.mode === 'words' || (testSettings.mode === 'custom' && testSettings.customUseWords)) {
      const wordCount = testSettings.mode === 'words' ? testSettings.wordCount : testSettings.customWordLimit;
      const options: TextGeneratorOptions = {
        includeNumbers: testSettings.numbers,
        includePunctuation: testSettings.punctuation,
        targetWordCount: wordCount
      };
      return generateExactWordCount(wordCount || 25, options);
    }
    
    // Quote mode
    if (testSettings.mode === 'quote') {
      const quote = getRandomQuote();
      setQuoteAuthor(quote.author);
      return quote.text;
    }
    
    // Time mode or custom mode with time limit
    if (testSettings.mode === 'time' || (testSettings.mode === 'custom' && testSettings.customUseTime)) {
      const options: TextGeneratorOptions = {
        includeNumbers: testSettings.numbers,
        includePunctuation: testSettings.punctuation
      };
      return generateText(options);
    }
    
    // Zen mode - return empty string, will be handled by textarea
    if (testSettings.mode === 'zen') {
      return '';
    }
    
    // Default fallback
    const options: TextGeneratorOptions = {
      includeNumbers: testSettings.numbers,
      includePunctuation: testSettings.punctuation
    };
    return generateText(options);
  }, [testSettings]);

  // Start test function - optimized to prevent UI freeze
  const startTest = useCallback(() => {
    // Re-entrancy guard
    if (isStartingRef.current || isRunning) return;
    isStartingRef.current = true;
    
    // Immediate UI feedback - disable button and show loading state
    setIsRunning(true);
    setIsTestActive(false);
    setShowResults(false);
    setIsEnded(false);
    testEndedRef.current = false;
    
    // Use setTimeout to defer heavy work and allow UI to update
    setTimeout(() => {
      try {
        // Generate text and prepare data
        const textToType = generateTextForMode();
        const words = textToType.split(' ');
        const initialCharStates = words.map(word => 
          new Array(word.length + 1).fill('pending') // +1 for space
        );
        
        // Batch state updates to minimize re-renders
        const updates = () => {
          setExpectedText(textToType);
          setWordList(words);
          setCharStates(initialCharStates);
          setActiveWordIdx(0);
          setActiveCharIdx(0);
          setCurrentPosition(0);
          setTypedCharacters(new Array(textToType.length).fill(''));
          setCharacterStatus(new Array(textToType.length).fill('pending'));
          
          // Reset metrics
          setCorrectCharacters(0);
          setTotalTypedCharacters(0);
          setBackspaces(0);
          setWordsCompleted(0);
          setLiveWPM(0);
          setAnalytics_wpmTimeline([]);
          setAnalytics_correctCharsSoFar(0);
          setKeystrokeLog([]);
          setFirstKeystrokeTime(null);
        };
        
        // Execute updates
        updates();
        
        // Handle different modes
        if (testSettings.mode === 'time' || (testSettings.mode === 'custom' && testSettings.customUseTime)) {
          // Time mode: Start countdown
          setTimeRemaining(testSettings.duration);
          setShowCountdown(true);
          setCountdown(3);
          setIsCountingDown(true);
          
          // Countdown timer
          const countdownTimer = setInterval(() => {
            setCountdown(prev => {
              if (prev === null || prev <= 1) {
                clearInterval(countdownTimer);
                setShowCountdown(false);
                setIsCountingDown(false);
                setTestStartTime(Date.now());
                
                // Start the actual test timer
                timerRef.current = setInterval(() => {
                  setTimeRemaining(prev => {
                    if (prev <= 1) {
                      // End test when timer reaches 0
                      if (testEndedRef.current) return 0;
                      testEndedRef.current = true;
                      setIsEnded(true);
                      if (timerRef.current) {
                        clearInterval(timerRef.current);
                      }
                      setIsRunning(false);
                      isStartingRef.current = false;
                      setShowResults(true);
                      setIsTestActive(false);
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                
                // Activate test and start typing viewport imperatively
                setIsTestActive(true);
                setTimeout(() => {
                  if (typingViewportRef.current) {
                    typingViewportRef.current.startTest();
                  }
                }, 50);
                
                return null;
              }
              return prev - 1;
            });
          }, 1000);
          
        } else {
          // Non-time modes: Start immediately
          setTestStartTime(Date.now());
          setIsTestActive(true);
          
          // Start typing viewport imperatively after a short delay
          setTimeout(() => {
            if (typingViewportRef.current) {
              typingViewportRef.current.startTest();
            }
          }, 50);
        }
        
      } catch (error) {
        console.error('Error starting test:', error);
        // Reset state on error
        isStartingRef.current = false;
        setIsRunning(false);
        setIsTestActive(false);
        setShowCountdown(false);
        setIsCountingDown(false);
      }
    }, 0); // Use 0ms timeout to defer to next tick
  }, [testSettings, generateTextForMode]);

  // Finalize test function
  const finalizeTest = useCallback(() => {
    if (testEndedRef.current) return;
    testEndedRef.current = true;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // End the typing viewport imperatively
    if (typingViewportRef.current) {
      typingViewportRef.current.endTest();
    }
    
    const testDurationMs = testStartTime ? Date.now() - testStartTime : 0;
    const testDurationMinutes = testDurationMs / 60000;
    
    const finalWPMValue = testDurationMinutes > 0 ? (correctCharacters / 5) / testDurationMinutes : 0;
    const finalAccuracyValue = totalTypedCharacters > 0 ? (correctCharacters / totalTypedCharacters) * 100 : 0;
    
    setFinalWPM(Math.round(finalWPMValue));
    setFinalAccuracy(Math.round(finalAccuracyValue * 10) / 10);
    
    // Calculate behavioral metrics
    const metrics = calculateBehavioralMetrics(
      keystrokeLog, 
      analytics_wpmTimeline.map(item => item.wpm),
      testSettings.duration,
      firstKeystrokeTime ? (firstKeystrokeTime - testStartTime!) / 1000 : 0
    );
    setBehavioralMetrics(metrics);
    
    // Analyze typing persona
    const personaData = {
      finalWPM: finalWPMValue,
      accuracy: finalAccuracyValue,
      consistencyScore: metrics.typingConsistencyScore,
      fatigueScore: metrics.fatigueScore,
      backspaceCount: backspaces,
      reactionDelay: metrics.reactionDelay,
      wpmOverTime: analytics_wpmTimeline.map(item => item.wpm)
    };
    const persona = analyzeTypingPersona(personaData);
    setTypingPersona(persona);
    
    const insights = getPersonaInsights(persona, personaData);
    setPersonaInsights(insights);
    
    // Save session
    saveSession(
      finalWPMValue,
      finalAccuracyValue,
      persona.name,
      backspaces,
      totalTypedCharacters,
      correctCharacters,
      totalTypedCharacters - correctCharacters,
      testSettings.duration,
      testSettings.textType,
      analytics_wpmTimeline.map(item => item.wpm),
      metrics.typingConsistencyScore,
      metrics.fatigueScore,
      metrics.reactionDelay,
      metrics.topErrorHotspots,
      metrics.topBackspaceHotspots,
      missedCharacters,
      insights
    );
    
    setIsRunning(false); // re-enable Start button
    isStartingRef.current = false; // allow next run
    setShowResults(true); // auto-open results
    setIsTestActive(false);
  }, [testStartTime, testSettings, correctCharacters, totalTypedCharacters, backspaces, analytics_wpmTimeline, keystrokeLog, firstKeystrokeTime, activeWordIdx, activeCharIdx, wordList]);

  // Check for test completion based on mode
  const checkTestCompletion = useCallback(() => {
    if (!isTestActive || testEndedRef.current) return;
    
    let shouldEnd = false;
    
    switch (testSettings.mode) {
      case 'words':
      case 'custom':
        // Words mode: End when last character of target word count is typed
        if (testSettings.mode === 'words' && activeWordIdx >= (testSettings.wordCount || 25) - 1) {
          const targetWord = wordList[testSettings.wordCount! - 1];
          if (activeCharIdx >= targetWord.length) {
            shouldEnd = true;
          }
        } else if (testSettings.mode === 'custom' && testSettings.customUseWords && activeWordIdx >= (testSettings.customWordLimit || 25) - 1) {
          const targetWord = wordList[testSettings.customWordLimit! - 1];
          if (activeCharIdx >= targetWord.length) {
            shouldEnd = true;
          }
        }
        break;
        
      case 'quote':
        // Quote mode: End when last character of quote is typed
        if (activeWordIdx >= wordList.length - 1) {
          const lastWord = wordList[wordList.length - 1];
          if (activeCharIdx >= lastWord.length) {
            shouldEnd = true;
          }
        }
        break;
        
      case 'time':
      case 'zen':
        // Time mode: Timer handles ending, Zen mode: Manual end only
        break;
    }
    
    if (shouldEnd) {
      finalizeTest();
    }
  }, [isTestActive, testSettings, activeWordIdx, activeCharIdx, wordList, finalizeTest]);

  // Handle character input
  const handleCharacterInput = useCallback((char: string) => {
    if (!isTestActive || isCountingDown || isComposing) return;
    
    if (firstKeystrokeTime === null && testStartTime) {
      setFirstKeystrokeTime(Date.now());
    }
    
    const timestamp = testStartTime ? (Date.now() - testStartTime) / 1000 : 0;
    
    if (activeWordIdx < wordList.length) {
      const currentWord = wordList[activeWordIdx];
      
      if (activeCharIdx < currentWord.length) {
        // Inside a word
        const expected = currentWord[activeCharIdx];
        const isCorrect = char === expected;
        
        if (isCorrect) {
          setCorrectCharacters(prev => prev + 1);
          setAnalytics_correctCharsSoFar(prev => prev + 1);
        } else {
          setMissedCharacters(prev => ({
            ...prev,
            [expected]: (prev[expected] || 0) + 1
          }));
        }
        
        setTotalTypedCharacters(prev => prev + 1);
        
        // Update character state
        setCharStates(prev => {
          const newStates = [...prev];
          newStates[activeWordIdx] = [...newStates[activeWordIdx]];
          newStates[activeWordIdx][activeCharIdx] = isCorrect ? 'correct' : 'incorrect';
          return newStates;
        });
        
        setActiveCharIdx(prev => prev + 1);
      } else {
        // Beyond word length - add extra
        setTotalTypedCharacters(prev => prev + 1);
        
        setCharStates(prev => {
          const newStates = [...prev];
          newStates[activeWordIdx] = [...newStates[activeWordIdx]];
          newStates[activeWordIdx].push('extra');
          return newStates;
        });
      }
      
      // Log keystroke
      const keystrokeData: KeystrokeData = {
        key: char,
        keyId: char,
        correct: char === currentWord[activeCharIdx],
        timestamp,
        position: currentPosition
      };
      setKeystrokeLog(prev => [...prev, keystrokeData]);
      
      // Update WPM timeline
      const elapsedSeconds = Math.floor(timestamp);
      if (elapsedSeconds > 0) {
        const wpm = (analytics_correctCharsSoFar / 5) / (elapsedSeconds / 60);
        setAnalytics_wpmTimeline(prev => {
          const newTimeline = [...prev];
          const existingIndex = newTimeline.findIndex(point => point.second === elapsedSeconds);
          if (existingIndex >= 0) {
            newTimeline[existingIndex] = { second: elapsedSeconds, wpm };
          } else {
            newTimeline.push({ second: elapsedSeconds, wpm });
          }
          return newTimeline;
        });
      }
      
      // Check for test completion based on mode
      checkTestCompletion();
    }
  }, [isTestActive, isCountingDown, isComposing, firstKeystrokeTime, testStartTime, activeWordIdx, activeCharIdx, wordList, currentPosition, analytics_correctCharsSoFar]);

  // Handle space
  const handleSpace = useCallback(() => {
    if (!isTestActive || isCountingDown || isComposing) return;
    
    if (activeWordIdx < wordList.length) {
      const currentWord = wordList[activeWordIdx];
      
      // Mark remaining pending chars as incorrect
      setCharStates(prev => {
        const newStates = [...prev];
        newStates[activeWordIdx] = [...newStates[activeWordIdx]];
        
        // Mark remaining pending characters as incorrect
        for (let i = activeCharIdx; i < currentWord.length; i++) {
          if (newStates[activeWordIdx][i] === 'pending') {
            newStates[activeWordIdx][i] = 'incorrect';
          }
        }
        
        // Mark space as correct if word was completed correctly
        const wordCorrect = newStates[activeWordIdx].slice(0, currentWord.length).every(state => state === 'correct');
        newStates[activeWordIdx][currentWord.length] = wordCorrect ? 'correct' : 'incorrect';
        
        return newStates;
      });
      
      // Move to next word
      if (activeWordIdx < wordList.length - 1) {
        setActiveWordIdx(prev => prev + 1);
        setActiveCharIdx(0);
      }
      
      setTotalTypedCharacters(prev => prev + 1);
      
      // Check for test completion after space
      setTimeout(() => checkTestCompletion(), 0);
    }
  }, [isTestActive, isCountingDown, isComposing, activeWordIdx, activeCharIdx, wordList, checkTestCompletion]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!isTestActive || isCountingDown || isComposing) return;
    
    setBackspaces(prev => prev + 1);
    
    if (activeWordIdx < wordList.length) {
      const currentWord = wordList[activeWordIdx];
      
      // Check if there are extra characters to remove
      const currentStates = charStates[activeWordIdx] || [];
      const extraCount = currentStates.filter(state => state === 'extra').length;
      
      if (extraCount > 0) {
        // Remove last extra character
        setCharStates(prev => {
          const newStates = [...prev];
          newStates[activeWordIdx] = [...newStates[activeWordIdx]];
          newStates[activeWordIdx].pop(); // Remove last extra
          return newStates;
        });
      } else if (activeCharIdx > 0) {
        // Move back one character and reset to pending
        setActiveCharIdx(prev => prev - 1);
        setCharStates(prev => {
          const newStates = [...prev];
          newStates[activeWordIdx] = [...newStates[activeWordIdx]];
          newStates[activeWordIdx][activeCharIdx - 1] = 'pending';
          return newStates;
        });
      }
    }
  }, [isTestActive, isCountingDown, isComposing, activeWordIdx, activeCharIdx, wordList, charStates]);

  // Handle composition events
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  // Handle Zen content changes
  const handleZenContentChange = useCallback((content: string) => {
    setZenContent(content);
    
    if (firstKeystrokeTime === null && testStartTime) {
      setFirstKeystrokeTime(Date.now());
    }
    
    // Calculate live WPM for Zen mode
    if (testStartTime) {
      const elapsedMinutes = (Date.now() - testStartTime) / 60000;
      const wordCount = content.trim().split(' ').length;
      const wpm = elapsedMinutes > 0 ? wordCount / elapsedMinutes : 0;
      setLiveWPM(wpm);
    }
  }, [firstKeystrokeTime, testStartTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 fade-in">
          <h1 
            className="text-3xl font-bold text-cyan-100 cursor-pointer hover:text-cyan-200 transition-all duration-200 btn-hover"
            onClick={() => {
              setCurrentView('main');
              setIsTestActive(false);
              setShowResults(false);
            }}
            title="Click to return to home"
          >
            Typora
          </h1>
          <p className="text-green-200 fade-in stagger-1">Test your typing speed and accuracy</p>
        
          {/* Navigation */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => setCurrentView('main')}
              variant={currentView === 'main' ? 'default' : 'outline'}
              className={`btn-hover btn-active transition-all duration-200 ${
                currentView === 'main'
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500'
                  : 'text-cyan-200 border-cyan-600 hover:bg-cyan-900 hover:text-cyan-100'
              }`}
            >
              🎯 Typing Test
            </Button>
            <Button
              onClick={() => setCurrentView('analytics')}
              variant={currentView === 'analytics' ? 'default' : 'outline'}
              className={`btn-hover btn-active transition-all duration-200 ${
                currentView === 'analytics'
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500'
                  : 'text-cyan-200 border-cyan-600 hover:bg-cyan-900 hover:text-cyan-100'
              }`}
            >
              📊 Analytics
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>
            {!isTestActive && (
              <div className="space-y-6">
                <div className="text-center">
                  <TestConfig settings={testSettings} onSettingsChange={setTestSettings} />
                </div>
                <div className="text-center">
                  <Button 
                    id="start-test"
                    type="button"
                    aria-label="Start Test"
                    disabled={isRunning}
                    onClick={startTest}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-lg shadow-cyan-500/25 px-8 py-3 text-lg btn-hover btn-active disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunning ? 'Starting...' : 'Start Test'}
                  </Button>
                </div>
              </div>
            )}

            {showResults && (
              <div className="text-center mb-6">
                <Button 
                  id="start-test"
                  type="button"
                  aria-label="Start Test"
                  disabled={isRunning}
                  onClick={startTest}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-lg shadow-cyan-500/25 px-8 py-3 text-lg btn-hover btn-active disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Starting...' : 'Start New Test'}
                </Button>
              </div>
            )}

            {isTestActive && (
              <div className="space-y-6">
                {/* Countdown Display */}
                {showCountdown && countdown !== null && (
                  <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 sticky top-0 z-10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h2 className="text-lg font-semibold text-cyan-100 mb-2">Get Ready</h2>
                        <div className="text-6xl font-mono text-cyan-400 animate-pulse">
                          {countdown}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timer Display */}
                {(testSettings.mode === 'time' || (testSettings.mode === 'custom' && testSettings.customUseTime)) && !showCountdown && (
                  <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 sticky top-0 z-10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h2 className="text-lg font-semibold text-cyan-100 mb-2">Time Remaining</h2>
                        <div className="text-3xl font-mono text-cyan-400">
                          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Live WPM Display for Zen Mode */}
                {testSettings.mode === 'zen' && isTestActive && !showCountdown && (
                  <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 sticky top-0 z-10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h2 className="text-lg font-semibold text-cyan-100 mb-2">Live WPM</h2>
                        <div className="text-3xl font-mono text-cyan-400">
                          {Math.round(liveWPM)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Typing Area */}
                <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25">
                  <CardContent className="p-6">
                    {testSettings.mode === 'zen' ? (
                      <textarea
                        value={zenContent}
                        onChange={(e) => handleZenContentChange(e.target.value)}
                        className="w-full min-h-[400px] p-4 text-lg leading-relaxed bg-transparent border-none outline-none resize-none font-mono text-white placeholder-gray-500"
                        placeholder="Start typing here..."
                        disabled={!isTestActive}
                      />
                    ) : (
                      <TypingViewport
                        ref={typingViewportRef}
                        words={wordList}
                        onCharacterInput={handleCharacterInput}
                        onSpace={handleSpace}
                        onBackspace={handleBackspace}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        isActive={isTestActive}
                      />
                    )}
                    
                    {/* End Test button for all modes */}
                    {isTestActive && (
                      <div className="mt-4 text-center">
                        <Button
                          onClick={finalizeTest}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                        >
                          End Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Results */}
            {showResults && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-6 text-cyan-100">Test Results</h2>
                  
                  {/* Main Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25">
                      <CardContent className="text-center p-6">
                        <div className="text-4xl font-bold text-cyan-400 mb-2">
                          {finalWPM}
                        </div>
                        <div className="text-cyan-200 uppercase tracking-wide text-sm font-medium">Words Per Minute</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25">
                      <CardContent className="text-center p-6">
                        <div className="text-4xl font-bold text-cyan-400 mb-2">
                          {finalAccuracy.toFixed(1)}%
                        </div>
                        <div className="text-cyan-200 uppercase tracking-wide text-sm font-medium">Accuracy</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25">
                      <CardContent className="text-center p-6">
                        <div className="text-4xl font-bold text-cyan-400 mb-2">
                          {backspaces}
                        </div>
                        <div className="text-cyan-200 uppercase tracking-wide text-sm font-medium">Backspaces</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Typing Persona */}
                  {typingPersona && (
                    <Card className="bg-gray-900 border border-cyan-600 shadow-lg shadow-cyan-500/25 mb-6">
                      <CardContent className="p-6 text-center">
                        <div className="text-6xl mb-2 bounce-in">{typingPersona.icon}</div>
                        <h3 className="text-2xl font-bold text-cyan-100 mb-2 fade-in">{typingPersona.title}</h3>
                        <p className="text-cyan-200 mb-4">{typingPersona.description}</p>
                        
                        {/* Persona Insights */}
                        {personaInsights.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-lg font-semibold text-cyan-100 mb-3 text-center">💡 Insights for You</h4>
                            <ul className="space-y-2">
                              {personaInsights.map((insight, index) => (
                                <li key={index} className="text-cyan-100 text-left">
                                  <span className="text-cyan-400 mr-2">•</span>
                                  <span className="text-cyan-100">{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Behavioral Insights */}
                  <BehavioralInsights 
                    currentSession={{
                      wpm: finalWPM,
                      accuracy: finalAccuracy,
                      backspaces: backspaces,
                      consistencyScore: behavioralMetrics.typingConsistencyScore,
                      reactionDelay: behavioralMetrics.reactionDelay,
                      errorHotspots: behavioralMetrics.topErrorHotspots,
                      backspaceHotspots: behavioralMetrics.topBackspaceHotspots,
                      missedCharacters: missedCharacters,
                      wpmOverTime: analytics_wpmTimeline.map(item => item.wpm),
                      testDuration: testSettings.duration
                    }}
                    historicalData={{
                      averageWPM: 0,
                      averageAccuracy: 0,
                      averageBackspaces: 0,
                      averageConsistency: 0,
                      averageReactionDelay: 0,
                      totalSessions: 0,
                      recentSessions: []
                    }}
                  />

                  {/* Error Analysis */}
                  <ErrorAnalysis 
                    errorHotspots={behavioralMetrics.topErrorHotspots}
                    backspaceHotspots={behavioralMetrics.topBackspaceHotspots}
                    testDuration={testSettings.duration}
                    totalErrors={totalTypedCharacters - correctCharacters}
                    totalBackspaces={backspaces}
                  />

                  {/* WPM Prediction */}
                  <WPMPrediction />

                  {/* Export Buttons */}
                  <div className="bg-gray-800 p-6 rounded-lg border border-cyan-600 shadow-sm mb-6">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 text-center">Export Session Data</h3>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => exportToCSV({
                          finalWPM: finalWPM || 0,
                          accuracy: finalAccuracy || 0,
                          totalBackspaces: backspaces || 0,
                          testDuration: testSettings.duration,
                          textType: testSettings.textType,
                          totalCharacters: totalTypedCharacters || 0,
                          correctCharacters: correctCharacters || 0,
                          incorrectCharacters: (totalTypedCharacters || 0) - (correctCharacters || 0),
                          wpmOverTime: analytics_wpmTimeline?.map(item => item.wpm) || [],
                          charactersPerSecond: [],
                          commonlyMistypedCharacters: missedCharacters || {},
                          testStartTime: testStartTime || Date.now(),
                          testEndTime: Date.now(),
                          typingConsistencyScore: behavioralMetrics?.typingConsistencyScore || 50,
                          fatigueScore: 0,
                          reactionDelay: behavioralMetrics?.reactionDelay || 0,
                          topErrorHotspots: behavioralMetrics?.topErrorHotspots || [],
                          topBackspaceHotspots: behavioralMetrics?.topBackspaceHotspots || [],
                          typingPersona: typingPersona || { name: '', title: '', description: '', icon: '', color: '', traits: [] },
                          personaInsights: personaInsights || [],
                          keystrokeLog: keystrokeLog || []
                        })}
                        variant="outline"
                        className="border-cyan-500 text-cyan-200 hover:bg-cyan-900 hover:text-cyan-100"
                      >
                        📊 Export as CSV
                      </Button>
                      <Button 
                        onClick={() => exportToJSON({
                          finalWPM: finalWPM || 0,
                          accuracy: finalAccuracy || 0,
                          totalBackspaces: backspaces || 0,
                          testDuration: testSettings.duration,
                          textType: testSettings.textType,
                          totalCharacters: totalTypedCharacters || 0,
                          correctCharacters: correctCharacters || 0,
                          incorrectCharacters: (totalTypedCharacters || 0) - (correctCharacters || 0),
                          wpmOverTime: analytics_wpmTimeline?.map(item => item.wpm) || [],
                          charactersPerSecond: [],
                          commonlyMistypedCharacters: missedCharacters || {},
                          testStartTime: testStartTime || Date.now(),
                          testEndTime: Date.now(),
                          typingConsistencyScore: behavioralMetrics?.typingConsistencyScore || 50,
                          fatigueScore: 0,
                          reactionDelay: behavioralMetrics?.reactionDelay || 0,
                          topErrorHotspots: behavioralMetrics?.topErrorHotspots || [],
                          topBackspaceHotspots: behavioralMetrics?.topBackspaceHotspots || [],
                          typingPersona: typingPersona || { name: '', title: '', description: '', icon: '', color: '', traits: [] },
                          personaInsights: personaInsights || [],
                          keystrokeLog: keystrokeLog || []
                        })}
                        variant="outline"
                        className="border-cyan-500 text-cyan-200 hover:bg-cyan-900 hover:text-cyan-100"
                      >
                        📄 Export as JSON
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button onClick={() => window.location.reload()} className="bg-cyan-600 text-white px-6 py-2 rounded-md hover:bg-cyan-700 transition-colors border border-cyan-500 shadow-lg shadow-cyan-500/25">
                      Take Another Test
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Session History */}
            <div className="mt-8">
              <SessionHistory 
                onSessionSelect={() => {}}
                selectedSessionId={null}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
