import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TypingAreaProps {
  expectedText: string;
  currentPosition: number;
  characterStatus: ('correct' | 'incorrect' | '')[];
  typedCharacters: string[];
  onKeyDown: (e: React.KeyboardEvent) => void;
  isActive: boolean;
  quoteAuthor?: string;
  liveWPM?: number;
  isZenMode?: boolean;
  zenContent?: string;
  onZenContentChange?: (content: string) => void;
  onEndTest?: () => void;
}

export const TypingArea = ({
  expectedText,
  currentPosition,
  characterStatus,
  typedCharacters,
  onKeyDown,
  isActive,
  quoteAuthor,
  liveWPM,
  isZenMode = false,
  zenContent = '',
  onZenContentChange,
  onEndTest
}: TypingAreaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zenTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus management
  useEffect(() => {
    if (isActive) {
      if (isZenMode && zenTextareaRef.current) {
        zenTextareaRef.current.focus({ preventScroll: true });
      } else if (containerRef.current) {
        containerRef.current.focus({ preventScroll: true });
      }
    }
  }, [isActive, isZenMode]);

  const renderText = () => {
    if (isZenMode) {
      return (
        <textarea
          ref={zenTextareaRef}
          value={zenContent}
          onChange={(e) => onZenContentChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full min-h-[400px] p-4 text-lg leading-relaxed bg-transparent border-none outline-none resize-none font-mono text-white placeholder-gray-500"
          placeholder="Start typing here..."
          disabled={!isActive}
        />
      );
    }

    return (
      <div className="relative">
        {expectedText.split('').map((char, index) => {
          const status = characterStatus[index] || '';
          const isCurrent = index === currentPosition;
          
          return (
            <span
              key={index}
              data-position={index}
              className={`
                ${status === 'correct' ? 'text-green-500' : ''}
                ${status === 'incorrect' ? 'text-red-500 bg-red-100' : ''}
                ${isCurrent ? 'text-white bg-blue-600 border-b-2 border-blue-400' : ''}
                ${char === ' ' ? 'whitespace-pre' : ''}
              `}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full border-2 border-gray-200 shadow-sm bg-gray-900">
      <CardContent className="p-6">
        {/* Header with live stats */}
        {(quoteAuthor || liveWPM !== undefined) && (
          <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
            {quoteAuthor && <span>— {quoteAuthor}</span>}
            {liveWPM !== undefined && (
              <span className="font-mono font-semibold">
                WPM: {Math.round(liveWPM)}
              </span>
            )}
          </div>
        )}

        {/* Typing area */}
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className={`
            relative min-h-[200px] p-4 text-lg leading-relaxed font-mono
            ${isActive ? 'cursor-text' : 'cursor-default'}
            ${isZenMode ? 'hidden' : 'block'}
            text-white
          `}
          style={{ outline: 'none' }}
        >
          {renderText()}
        </div>

        {/* End Test button for Zen mode */}
        {isZenMode && isActive && onEndTest && (
          <div className="mt-4 text-center">
            <button
              onClick={onEndTest}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              End Test
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};