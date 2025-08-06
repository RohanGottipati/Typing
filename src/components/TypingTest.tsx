import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypingArea } from './TypingArea';
import { TestConfig } from './TestConfig';
import { LiveMetrics } from './LiveMetrics';
import { ResultDashboard } from './ResultDashboard';

export interface TestSettings {
  duration: number;
  textType: 'random' | 'quotes' | 'code';
}

export interface TestStats {
  wpm: number;
  accuracy: number;
  backspaces: number;
  wpmOverTime: number[];
  missedCharacters: { [key: string]: number };
}

export interface TestResult extends TestStats {
  suggestions: string[];
}

const SAMPLE_WORDS = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "and", "runs", "through", "forest",
  "while", "birds", "sing", "beautiful", "songs", "in", "tall", "trees", "under", "bright", "blue", "sky",
  "with", "white", "clouds", "floating", "gently", "across", "vast", "horizon", "where", "mountains", "meet",
  "ocean", "waves", "that", "crash", "against", "rocky", "shore", "creating", "magnificent", "spray",
  "of", "water", "droplets", "catching", "sunlight", "like", "tiny", "diamonds", "sparkling", "air"
];

export const TypingTest = () => {
  const [testSettings, setTestSettings] = useState<TestSettings>({ duration: 60, textType: 'random' });
  const [isTestActive, setIsTestActive] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [testWords, setTestWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [missedChars, setMissedChars] = useState<{ [key: string]: number }>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Generate test words
  const generateWords = useCallback((count: number = 100) => {
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)]);
    }
    return words;
  }, []);

  // Start test
  const startTest = () => {
    const words = generateWords();
    setTestWords(words);
    setIsTestActive(true);
    setIsTestComplete(false);
    setCurrentWordIndex(0);
    setUserInput('');
    setCorrectChars(0);
    setTotalChars(0);
    setBackspaces(0);
    setTimeRemaining(testSettings.duration);
    setWpmHistory([]);
    setMissedChars({});
    setTestResult(null);
  };

  // End test
  const endTest = useCallback(() => {
    setIsTestActive(false);
    setIsTestComplete(true);
    
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
    const wpm = correctChars / 5 / (testSettings.duration / 60);
    
    // Simulate API call for analysis
    const result: TestResult = {
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      backspaces,
      wpmOverTime: wpmHistory,
      missedCharacters: missedChars,
      suggestions: [
        "Focus on accuracy over speed",
        "Practice common letter combinations",
        "Keep your wrists straight while typing"
      ]
    };
    
    setTestResult(result);
  }, [correctChars, totalChars, testSettings.duration, wpmHistory, backspaces, missedChars]);

  // Timer effect
  useEffect(() => {
    if (isTestActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
        
        // Update WPM history every 5 seconds
        if ((testSettings.duration - timeRemaining) % 5 === 0) {
          const currentWpm = correctChars / 5 / ((testSettings.duration - timeRemaining) / 60);
          setWpmHistory(prev => [...prev, Math.round(currentWpm)]);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isTestActive && timeRemaining === 0) {
      endTest();
    }
  }, [isTestActive, timeRemaining, testSettings.duration, correctChars, endTest]);

  // Handle typing
  const handleTyping = (input: string, isBackspace: boolean) => {
    if (!isTestActive) return;
    
    if (isBackspace) {
      setBackspaces(prev => prev + 1);
    }
    
    setUserInput(input);
    
    const currentWord = testWords[currentWordIndex];
    if (!currentWord) return;
    
    // Calculate stats
    let correct = 0;
    let total = 0;
    
    for (let i = 0; i < Math.min(input.length, currentWord.length); i++) {
      total++;
      if (input[i] === currentWord[i]) {
        correct++;
      } else {
        // Track missed characters
        setMissedChars(prev => ({
          ...prev,
          [currentWord[i]]: (prev[currentWord[i]] || 0) + 1
        }));
      }
    }
    
    setCorrectChars(prev => prev - (prev - Math.floor(prev / currentWord.length) * currentWord.length) + correct);
    setTotalChars(prev => prev - (prev - Math.floor(prev / currentWord.length) * currentWord.length) + total);
  };

  // Move to next word
  const moveToNextWord = () => {
    if (currentWordIndex < testWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setUserInput('');
    }
  };

  const currentStats: TestStats = {
    wpm: Math.round(correctChars / 5 / ((testSettings.duration - timeRemaining) / 60)) || 0,
    accuracy: totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100,
    backspaces,
    wpmOverTime: wpmHistory,
    missedCharacters: missedChars
  };

  if (isTestComplete && testResult) {
    return <ResultDashboard result={testResult} onRestart={startTest} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">MonkeyType Clone</h1>
          <p className="text-muted-foreground">Test your typing speed and accuracy</p>
        </div>

        {!isTestActive ? (
          /* Test Configuration */
          <Card className="mx-auto max-w-md">
            <CardContent className="p-6 space-y-6">
              <TestConfig settings={testSettings} onSettingsChange={setTestSettings} />
              <Button onClick={startTest} className="w-full" size="lg">
                Start Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Active Test */
          <div className="space-y-6 fade-up">
            <LiveMetrics 
              stats={currentStats} 
              timeRemaining={timeRemaining}
              totalTime={testSettings.duration}
            />
            
            <TypingArea
              words={testWords}
              currentWordIndex={currentWordIndex}
              userInput={userInput}
              onTyping={handleTyping}
              onWordComplete={moveToNextWord}
              isActive={isTestActive}
            />
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={endTest}
                className="text-muted-foreground hover:text-foreground"
              >
                End Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};