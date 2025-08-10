import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SimpleTest = () => {
  const [isActive, setIsActive] = useState(false);
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog.');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  const startTest = () => {
    setIsActive(true);
    setCurrentPosition(0);
    setTypedChars(new Array(text.length).fill(''));
    setShowResults(false);
    setWpm(0);
    setAccuracy(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = e.key;
    
    if (key === 'Backspace') {
      if (currentPosition > 0) {
        setCurrentPosition(prev => prev - 1);
        setTypedChars(prev => {
          const newChars = [...prev];
          newChars[currentPosition - 1] = '';
          return newChars;
        });
      }
      return;
    }

    if (key.length === 1 && currentPosition < text.length) {
      const isCorrect = key === text[currentPosition];
      setTypedChars(prev => {
        const newChars = [...prev];
        newChars[currentPosition] = key;
        return newChars;
      });
      setCurrentPosition(prev => prev + 1);

      // Check if test is complete
      if (currentPosition + 1 >= text.length) {
        endTest();
      }
    }
  };

  const endTest = () => {
    setIsActive(false);
    
    // Calculate results
    const correctChars = typedChars.filter((char, index) => char === text[index]).length;
    const totalTyped = typedChars.filter(char => char !== '').length;
    
    const accuracyValue = totalTyped > 0 ? (correctChars / totalTyped) * 100 : 0;
    const wpmValue = totalTyped > 0 ? Math.round((correctChars / 5) / (1 / 60)) : 0; // Assuming 1 minute test
    
    setAccuracy(accuracyValue);
    setWpm(wpmValue);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Simple Typing Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isActive && !showResults && (
              <div className="text-center">
                <Button onClick={startTest} className="w-full">
                  Start Test
                </Button>
              </div>
            )}

            {isActive && (
              <div
                tabIndex={0}
                onKeyDown={handleKeyDown}
                className="min-h-[200px] p-4 text-lg leading-relaxed font-mono border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ outline: 'none' }}
              >
                {text.split('').map((char, index) => {
                  const typedChar = typedChars[index];
                  const isCurrent = index === currentPosition;
                  const isCorrect = typedChar === char;
                  const isIncorrect = typedChar && typedChar !== char;
                  
                  return (
                    <span
                      key={index}
                      className={`
                        ${isCorrect ? 'text-green-600' : ''}
                        ${isIncorrect ? 'text-red-600 bg-red-100' : ''}
                        ${isCurrent ? 'bg-blue-100' : ''}
                        ${char === ' ' ? 'whitespace-pre' : ''}
                      `}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            )}

            {showResults && (
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{wpm}</div>
                    <div className="text-sm text-muted-foreground">WPM</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </div>
                <Button onClick={startTest} className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
