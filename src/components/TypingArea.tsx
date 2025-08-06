import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TypingAreaProps {
  words: string[];
  currentWordIndex: number;
  userInput: string;
  onTyping: (input: string, isBackspace: boolean) => void;
  onWordComplete: () => void;
  isActive: boolean;
}

export const TypingArea = ({
  words,
  currentWordIndex,
  userInput,
  onTyping,
  onWordComplete,
  isActive
}: TypingAreaProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    const input = e.currentTarget as HTMLInputElement;
    
    if (key === ' ') {
      e.preventDefault();
      if (userInput.trim()) {
        onWordComplete();
      }
      return;
    }
    
    if (key === 'Backspace') {
      onTyping(userInput.slice(0, -1), true);
      return;
    }
    
    if (key.length === 1) {
      const newInput = userInput + key;
      onTyping(newInput, false);
    }
  };

  const renderWords = () => {
    const visibleWords = words.slice(currentWordIndex, currentWordIndex + 20);
    
    return visibleWords.map((word, index) => {
      const absoluteIndex = currentWordIndex + index;
      const isCurrentWord = absoluteIndex === currentWordIndex;
      
      return (
        <span key={absoluteIndex} className="inline-block mr-4 mb-2">
          {word.split('').map((char, charIndex) => {
            let className = 'typing-font text-2xl ';
            
            if (isCurrentWord) {
              if (charIndex < userInput.length) {
                className += userInput[charIndex] === char 
                  ? 'text-typing-correct' 
                  : 'text-typing-incorrect bg-typing-incorrect bg-opacity-20';
              } else if (charIndex === userInput.length) {
                className += 'text-typing-current bg-typing-current bg-opacity-20 cursor-blink';
              } else {
                className += 'text-typing-text';
              }
            } else if (absoluteIndex < currentWordIndex) {
              className += 'text-typing-correct opacity-50';
            } else {
              className += 'text-typing-text';
            }
            
            return (
              <span key={charIndex} className={className}>
                {char}
              </span>
            );
          })}
          
          {/* Show cursor at end of current word if input matches word length */}
          {isCurrentWord && userInput.length === word.length && (
            <span className="text-typing-cursor cursor-blink typing-font text-2xl">|</span>
          )}
        </span>
      );
    });
  };

  return (
    <Card className="bg-typing-bg border-border">
      <CardContent className="p-8">
        <div className="min-h-[200px] relative">
          {/* Hidden input for capturing keystrokes */}
          <input
            ref={inputRef}
            className="absolute opacity-0 pointer-events-none"
            value={userInput}
            onChange={() => {}} // Handled by onKeyDown
            onKeyDown={handleKeyDown}
            disabled={!isActive}
          />
          
          {/* Typing text display */}
          <div 
            className="leading-relaxed cursor-pointer"
            onClick={() => inputRef.current?.focus()}
          >
            {words.length > 0 ? renderWords() : (
              <p className="text-typing-text typing-font text-2xl">
                Loading words...
              </p>
            )}
          </div>
          
          {/* Focus indicator */}
          {isActive && (
            <div className="absolute bottom-4 left-4 text-typing-text text-sm opacity-70">
              Click here or start typing to focus
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};