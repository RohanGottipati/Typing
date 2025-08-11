import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypingBox, TypingBoxRef } from './TypingBox';
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
  const typingBoxRef = useRef<TypingBoxRef>(null);

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

  // Unified restart function - handles both initial start and restart from results
  const handleRestartTest = useCallback(() => {
    // Re-entrancy guard
    if (isStartingRef.current || isRunning) return;
    isStartingRef.current = true;
    
    // Clear any existing timers and intervals
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Immediate UI feedback - disable button and show loading state
    setIsRunning(true);
    setIsTestActive(false);
    setShowResults(false);
    setIsEnded(false);
    testEndedRef.current = false;
    
    // Reset all state completely
    setShowCountdown(false);
    setIsCountingDown(false);
    setTimeRemaining(0);
    setTestStartTime(null);
    setCountdown(null);
    setCurrentPosition(0);
    setTypedCharacters([]);
    setCharacterStatus([]);
    setActiveWordIdx(0);
    setActiveCharIdx(0);
    setWordList([]);
    setCharStates([]);
    setIsComposing(false);
    setCorrectCharacters(0);
    setTotalTypedCharacters(0);
    setBackspaces(0);
    setMissedCharacters({});
    setWordsCompleted(0);
    setQuoteAuthor('');
    setLiveWPM(0);
    setFirstKeystrokeTime(null);
    setAnalytics_wpmTimeline([]);
    setAnalytics_correctCharsSoFar(0);
    setKeystrokeLog([]);
    setZenContent('');
    setExpectedText('');
    
    // Reset new engine state
    setRes_hasEnded(false);
    setRes_startedAtMs(null);
    setRes_firstKeyAtMs(null);
    setRes_endedAtMs(null);
    setRes_totalCharsTyped(0);
    setRes_correctChars(0);
    setRes_incorrectChars(0);
    setRes_backspaces(0);
    setRes_charsCorrectBySecond([]);
    setRes_keystrokes([]);
    setRes_wpmTimeline([]);
    
    // Reset results state
    testEndedRef.current = false;
    setShowResults(false);
    setFinalWPM(0);
    setFinalAccuracy(0);
    setBehavioralMetrics({
      typingConsistencyScore: 0,
      fatigueScore: 0,
      reactionDelay: 0,
      topErrorHotspots: [],
      topBackspaceHotspots: []
    });
    setTypingPersona(null);
    setPersonaInsights([]);
    
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
                setRes_startedAtMs(Date.now());
                
                // Start the actual test timer
                timerRef.current = setInterval(() => {
                  setTimeRemaining(prev => {
                    if (prev <= 1) {
                      // End test when timer reaches 0 - use unified end function
                      if (res_hasEnded) return 0;
                      
                      // Clear intervals and flush final metrics
                      const endedAtMs = Date.now();
                      const currentMetrics = res_currentMetrics.current;
                      const startedAtMs = currentMetrics.startedAtMs || endedAtMs;
                      
                      // Debug: Log timer end metrics
                      console.log('Timer end - current metrics:', {
                        totalCharsTyped: currentMetrics.totalCharsTyped,
                        correctChars: currentMetrics.correctChars,
                        incorrectChars: currentMetrics.incorrectChars,
                        backspaces: currentMetrics.backspaces,
                        elapsedMs: endedAtMs - startedAtMs,
                        keystrokesCount: currentMetrics.keystrokes.length
                      });
                      
                      // Package the same metrics as manual end using current ref values
                      endSessionOnce({
                        totalCharsTyped: currentMetrics.totalCharsTyped,
                        correctChars: currentMetrics.correctChars,
                        incorrectChars: currentMetrics.incorrectChars,
                        backspaces: currentMetrics.backspaces,
                        firstKeyAtMs: currentMetrics.firstKeyAtMs,
                        startedAtMs: startedAtMs,
                        endedAtMs: endedAtMs,
                        charsCorrectBySecond: currentMetrics.charsCorrectBySecond,
                        wpmTimeline: currentMetrics.wpmTimeline,
                        keystrokes: currentMetrics.keystrokes
                      });
                      
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                
                // Activate test and start typing box imperatively
                setIsTestActive(true);
                setTimeout(() => {
                  if (typingBoxRef.current) {
                    typingBoxRef.current.startTest();
                    // Focus the typing box with preventScroll
                    typingBoxRef.current.focus();
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
          setRes_startedAtMs(Date.now());
          setIsTestActive(true);
          
          // Start typing box imperatively after a short delay
          setTimeout(() => {
            if (typingBoxRef.current) {
              typingBoxRef.current.startTest();
              // Focus the typing box with preventScroll
              typingBoxRef.current.focus();
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

  // Unified results engine state with unique names
  const [res_hasEnded, setRes_hasEnded] = useState(false);
  const [res_startedAtMs, setRes_startedAtMs] = useState<number | null>(null);
  const [res_firstKeyAtMs, setRes_firstKeyAtMs] = useState<number | null>(null);
  const [res_endedAtMs, setRes_endedAtMs] = useState<number | null>(null);
  const [res_totalCharsTyped, setRes_totalCharsTyped] = useState(0);
  const [res_correctChars, setRes_correctChars] = useState(0);
  const [res_incorrectChars, setRes_incorrectChars] = useState(0);
  const [res_backspaces, setRes_backspaces] = useState(0);
  const [res_charsCorrectBySecond, setRes_charsCorrectBySecond] = useState<number[]>([]);
  const [res_keystrokes, setRes_keystrokes] = useState<Array<{ts: number, key: string, correct: boolean}>>([]);
  const [res_wpmTimeline, setRes_wpmTimeline] = useState<Array<{second: number, wpm: number}>>([]);
  
  // Refs to track current state values for timer callbacks
  const res_currentMetrics = useRef({
    totalCharsTyped: 0,
    correctChars: 0,
    incorrectChars: 0,
    backspaces: 0,
    firstKeyAtMs: null as number | null,
    startedAtMs: null as number | null,
    charsCorrectBySecond: [] as number[],
    wpmTimeline: [] as Array<{second: number, wpm: number}>,
    keystrokes: [] as Array<{ts: number, key: string, correct: boolean}>
  });

  // Unified end session function - one-shot guarded with proper metrics collection
  const endSessionOnce = useCallback((resultsInput: {
    totalCharsTyped: number;
    correctChars: number;
    incorrectChars: number;
    backspaces: number;
    firstKeyAtMs: number | null;
    startedAtMs: number;
    endedAtMs: number;
    charsCorrectBySecond: number[];
    wpmTimeline: Array<{second: number, wpm: number}>;
    keystrokes: Array<{ts: number, key: string, correct: boolean}>;
  }) => {
    if (res_hasEnded) return;
    setRes_hasEnded(true);
    
    // Debug: Log the metrics being processed
    console.log('endSessionOnce called with metrics:', {
      totalCharsTyped: resultsInput.totalCharsTyped,
      correctChars: resultsInput.correctChars,
      incorrectChars: resultsInput.incorrectChars,
      backspaces: resultsInput.backspaces,
      elapsedMs: resultsInput.endedAtMs - resultsInput.startedAtMs,
      keystrokesCount: resultsInput.keystrokes.length,
      charsCorrectBySecondLength: resultsInput.charsCorrectBySecond.length
    });
    
    // Stop all intervals/tickers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // End the typing box imperatively
    if (typingBoxRef.current) {
      typingBoxRef.current.endTest();
    }
    
    // Extract metrics from input
    const {
      totalCharsTyped,
      correctChars,
      incorrectChars,
      backspaces,
      firstKeyAtMs,
      startedAtMs,
      endedAtMs,
      charsCorrectBySecond,
      wpmTimeline,
      keystrokes
    } = resultsInput;
    
    // Compute elapsed time
    const elapsedSeconds = Math.max(1, Math.floor((endedAtMs - startedAtMs) / 1000));
    
    // Build final WPM timeline from charsCorrectBySecond (skip second 0 to avoid divide-by-zero)
    const finalWpmTimeline = charsCorrectBySecond.map((cumulativeCorrect, second) => {
      if (second === 0) return null; // Skip second 0
      const wpm = (cumulativeCorrect / 5) / (second / 60);
      return { second, wpm: isFinite(wpm) ? wpm : 0 };
    }).filter(Boolean) as Array<{second: number, wpm: number}>;
    
    // Add final partial second if needed
    if (elapsedSeconds > 0 && correctChars > 0) {
      const finalWpm = (correctChars / 5) / (elapsedSeconds / 60);
      const existingIndex = finalWpmTimeline.findIndex(point => point.second === elapsedSeconds);
      if (existingIndex >= 0) {
        finalWpmTimeline[existingIndex] = { second: elapsedSeconds, wpm: finalWpm };
      } else {
        finalWpmTimeline.push({ second: elapsedSeconds, wpm: finalWpm });
      }
    }
    
    // Calculate final WPM and accuracy with NaN guards
    const finalWPMValue = elapsedSeconds > 0 ? 
      ((correctChars / 5) / (elapsedSeconds / 60)) : 0;
    const finalAccuracyValue = totalCharsTyped > 0 ? 
      (correctChars / totalCharsTyped) * 100 : 0;
    
    // Round to 1 decimal and guard against NaN
    const finalWPM = Math.round(finalWPMValue * 10) / 10 || 0;
    const finalAccuracy = Math.round(finalAccuracyValue * 10) / 10 || 0;
    
    setFinalWPM(finalWPM);
    setFinalAccuracy(finalAccuracy);
    
    // Calculate behavioral metrics
    const metrics = calculateBehavioralMetrics(
      keystrokes, 
      finalWpmTimeline.map(item => item.wpm),
      testSettings.duration,
      firstKeyAtMs ? (firstKeyAtMs - startedAtMs) / 1000 : 0
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
      wpmOverTime: finalWpmTimeline.map(item => item.wpm)
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
      totalCharsTyped,
      correctChars,
      incorrectChars,
      testSettings.duration,
      testSettings.textType,
      finalWpmTimeline.map(item => item.wpm),
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
  }, [res_hasEnded, testSettings, missedCharacters]);
  
  // Update refs whenever state changes
  useEffect(() => {
    res_currentMetrics.current = {
      totalCharsTyped: res_totalCharsTyped,
      correctChars: res_correctChars,
      incorrectChars: res_incorrectChars,
      backspaces: res_backspaces,
      firstKeyAtMs: res_firstKeyAtMs,
      startedAtMs: res_startedAtMs,
      charsCorrectBySecond: res_charsCorrectBySecond,
      wpmTimeline: res_wpmTimeline,
      keystrokes: res_keystrokes
    };
  }, [res_totalCharsTyped, res_correctChars, res_incorrectChars, res_backspaces, res_firstKeyAtMs, res_startedAtMs, res_charsCorrectBySecond, res_wpmTimeline, res_keystrokes]);

  // Check for test completion based on mode
  const checkTestCompletion = useCallback(() => {
    if (!isTestActive || testEndedRef.current) return;
    
    let shouldEnd = false;
    
    switch (testSettings.mode) {
      case 'words':
        // Words mode: End when last character of target word count is typed
        if (testSettings.wordCount) {
          const words = expectedText.split(' ');
          if (words.length >= testSettings.wordCount) {
            // Calculate the character position of the end of the target word
            let charCount = 0;
            for (let i = 0; i < testSettings.wordCount; i++) {
              charCount += words[i].length;
              if (i < testSettings.wordCount - 1) {
                charCount += 1; // Add space
              }
            }
            if (currentPosition >= charCount - 1) {
              shouldEnd = true;
            }
          }
        }
        break;
        
      case 'custom':
        // Custom mode: End when last character of target word count is typed
        if (testSettings.customUseWords && testSettings.customWordLimit) {
          const words = expectedText.split(' ');
          if (words.length >= testSettings.customWordLimit) {
            // Calculate the character position of the end of the target word
            let charCount = 0;
            for (let i = 0; i < testSettings.customWordLimit; i++) {
              charCount += words[i].length;
              if (i < testSettings.customWordLimit - 1) {
                charCount += 1; // Add space
              }
            }
            if (currentPosition >= charCount - 1) {
              shouldEnd = true;
            }
          }
        }
        break;
        
      case 'quote':
        // Quote mode: End when last character of quote is typed
        if (currentPosition >= expectedText.length - 1) {
          shouldEnd = true;
        }
        break;
        
      case 'time':
      case 'zen':
        // Time mode: Timer handles ending, Zen mode: Manual end only
        break;
    }
    
    if (shouldEnd) {
      const endedAtMs = Date.now();
      const currentMetrics = res_currentMetrics.current;
      const startedAtMs = currentMetrics.startedAtMs || endedAtMs;
      
      // Package the same metrics for completion end using current ref values
      endSessionOnce({
        totalCharsTyped: currentMetrics.totalCharsTyped,
        correctChars: currentMetrics.correctChars,
        incorrectChars: currentMetrics.incorrectChars,
        backspaces: currentMetrics.backspaces,
        firstKeyAtMs: currentMetrics.firstKeyAtMs,
        startedAtMs: startedAtMs,
        endedAtMs: endedAtMs,
        charsCorrectBySecond: currentMetrics.charsCorrectBySecond,
        wpmTimeline: currentMetrics.wpmTimeline,
        keystrokes: currentMetrics.keystrokes
      });
    }
  }, [isTestActive, testSettings, currentPosition, expectedText, endSessionOnce]);

  // Unified character input handler with non-blocking mistakes
  const engine_handleCharacterInput = useCallback((char: string, index: number) => {
    if (!isTestActive || isCountingDown || isComposing) return;
    
    // Record first keystroke time
    if (res_firstKeyAtMs === null && res_startedAtMs) {
      setRes_firstKeyAtMs(Date.now());
    }
    
    const timestamp = res_startedAtMs ? (Date.now() - res_startedAtMs) / 1000 : 0;
    
    // Update position tracking
    setCurrentPosition(index);
    
    // Check if character is correct (exact comparison including space, punctuation, numbers)
    const expectedChar = expectedText[index];
    const isCorrect = char === expectedChar;
    
    // Always increment total characters typed
    setRes_totalCharsTyped(prev => prev + 1);
    
    if (isCorrect) {
      setRes_correctChars(prev => prev + 1);
    } else {
      setRes_incorrectChars(prev => prev + 1);
      // Track missed characters for analytics
      setMissedCharacters(prev => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1
      }));
    }
    
    // Update typed characters array
    setTypedCharacters(prev => {
      const newArray = [...prev];
      newArray[index] = char;
      return newArray;
    });
    
    // Update character status - mark as correct or incorrect
    setCharacterStatus(prev => {
      const newStatus = [...prev];
      newStatus[index] = isCorrect ? 'correct' : 'incorrect';
      return newStatus;
    });
    
    // Log keystroke with new format
    const keystrokeData = {
      ts: timestamp,
      key: char,
      correct: isCorrect
    };
    setRes_keystrokes(prev => [...prev, keystrokeData]);
    
    // Update WPM timeline per second
    const elapsedSeconds = Math.floor(timestamp);
    if (elapsedSeconds > 0) {
      setRes_wpmTimeline(prev => {
        const newTimeline = [...prev];
        const existingIndex = newTimeline.findIndex(point => point.second === elapsedSeconds);
        
        // Calculate current correct chars for this second
        const currentCorrectChars = res_correctChars + (isCorrect ? 1 : 0);
        const wpm = (currentCorrectChars / 5) / (elapsedSeconds / 60);
        
        if (existingIndex >= 0) {
          newTimeline[existingIndex] = { second: elapsedSeconds, wpm };
        } else {
          newTimeline.push({ second: elapsedSeconds, wpm });
        }
        return newTimeline;
      });
      
      // Update chars correct by second (cumulative)
      setRes_charsCorrectBySecond(prev => {
        const newArray = [...prev];
        const currentCorrectChars = res_correctChars + (isCorrect ? 1 : 0);
        newArray[elapsedSeconds] = currentCorrectChars;
        return newArray;
      });
    }
    
    // Check for test completion based on mode
    checkTestCompletion();
  }, [isTestActive, isCountingDown, isComposing, res_firstKeyAtMs, res_startedAtMs, expectedText, res_correctChars]);

  // Handle space
  const handleSpace = useCallback(() => {
    if (!isTestActive || isCountingDown || isComposing) return;
    
    // In the new character-based approach, spaces are handled automatically
    // by the TypingBox component when the user types a space character
    // This function is kept for compatibility but doesn't need to do anything
    // as the space handling is now done in handleCharacterInput
  }, [isTestActive, isCountingDown, isComposing]);

  // Handle backspace with new engine
  const engine_handleBackspace = useCallback(() => {
    if (!isTestActive || isCountingDown || isComposing) return;
    
    // Increment backspace count
    setRes_backspaces(prev => prev + 1);
    
    // Move back one position (do not go below 0)
    if (currentPosition > 0) {
      const newPosition = currentPosition - 1;
      setCurrentPosition(newPosition);
      
      // Reset character status to pending
      setCharacterStatus(prev => {
        const newStatus = [...prev];
        newStatus[newPosition] = 'pending';
        return newStatus;
      });
      
      // Clear typed character
      setTypedCharacters(prev => {
        const newArray = [...prev];
        newArray[newPosition] = '';
        return newArray;
      });
      
      // Decrement counters based on what was at that position
      const wasCorrect = characterStatus[newPosition] === 'correct';
      if (wasCorrect) {
        setRes_correctChars(prev => prev - 1);
      } else if (characterStatus[newPosition] === 'incorrect') {
        setRes_incorrectChars(prev => prev - 1);
      }
      setRes_totalCharsTyped(prev => prev - 1);
    }
  }, [isTestActive, isCountingDown, isComposing, currentPosition, characterStatus]);

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
            {!isTestActive && !showResults && (
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
                    onClick={handleRestartTest}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-lg shadow-cyan-500/25 px-8 py-3 text-lg btn-hover btn-active disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunning ? 'Starting...' : 'Start Test'}
                  </Button>
                </div>
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
                    <TypingBox
                      ref={typingBoxRef}
                      text={expectedText}
                      onCharacterInput={engine_handleCharacterInput}
                      onSpace={handleSpace}
                      onBackspace={engine_handleBackspace}
                      onCompositionStart={handleCompositionStart}
                      onCompositionEnd={handleCompositionEnd}
                      isActive={isTestActive}
                      mode={testSettings.mode}
                      zenContent={zenContent}
                      onZenContentChange={handleZenContentChange}
                    />
                    
                    {/* End Test button for all modes */}
                    {isTestActive && (
                      <div className="mt-4 text-center">
                        <Button
                          onClick={() => {
                            const endedAtMs = Date.now();
                            const currentMetrics = res_currentMetrics.current;
                            const startedAtMs = currentMetrics.startedAtMs || endedAtMs;
                            
                            // Debug: Log manual end metrics
                            console.log('Manual end - current metrics:', {
                              totalCharsTyped: currentMetrics.totalCharsTyped,
                              correctChars: currentMetrics.correctChars,
                              incorrectChars: currentMetrics.incorrectChars,
                              backspaces: currentMetrics.backspaces,
                              elapsedMs: endedAtMs - startedAtMs,
                              keystrokesCount: currentMetrics.keystrokes.length
                            });
                            
                            // Package the same metrics for manual end using current ref values
                            endSessionOnce({
                              totalCharsTyped: currentMetrics.totalCharsTyped,
                              correctChars: currentMetrics.correctChars,
                              incorrectChars: currentMetrics.incorrectChars,
                              backspaces: currentMetrics.backspaces,
                              firstKeyAtMs: currentMetrics.firstKeyAtMs,
                              startedAtMs: startedAtMs,
                              endedAtMs: endedAtMs,
                              charsCorrectBySecond: currentMetrics.charsCorrectBySecond,
                              wpmTimeline: currentMetrics.wpmTimeline,
                              keystrokes: currentMetrics.keystrokes
                            });
                          }}
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

                  {/* Single Start New Test Button */}
                  <div className="text-center mt-8">
                    <Button 
                      id="start-new-test"
                      type="button"
                      aria-label="Start New Test"
                      disabled={isRunning}
                      onClick={handleRestartTest}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-lg shadow-cyan-500/25 px-8 py-3 text-lg btn-hover btn-active disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRunning ? 'Starting...' : 'Start New Test'}
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
