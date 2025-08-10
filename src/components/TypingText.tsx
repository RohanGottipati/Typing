import { useEffect, useRef, useState } from 'react';

interface TypingTextProps {
  text: string;
  currentPosition: number;
  characterStatus: ('pending' | 'correct' | 'incorrect' | 'extra')[];
  typedCharacters: string[];
  onKeyDown: (e: React.KeyboardEvent) => void;
  isActive: boolean;
}

export const TypingText = ({
  text,
  currentPosition,
  characterStatus,
  typedCharacters,
  onKeyDown,
  isActive
}: TypingTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const [caretStyle, setCaretStyle] = useState<React.CSSProperties>({});

  // Split text into words for Monkeytype-style rendering
  const words = text.split(' ');
  let globalCharIndex = 0;

  const getCharClass = (wordIdx: number, charIdx: number) => {
    const charIndex = globalCharIndex;
    globalCharIndex++;
    
    if (charIndex >= characterStatus.length) return 'char pending';
    
    const status = characterStatus[charIndex];
    return `char ${status}`;
  };

  const getSpaceClass = (wordIdx: number) => {
    const charIndex = globalCharIndex;
    globalCharIndex++;
    
    if (charIndex >= characterStatus.length) return 'char pending';
    
    const status = characterStatus[charIndex];
    return `char ${status}`;
  };

  const updateCaretPosition = () => {
    if (!containerRef.current || !caretRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let targetElement: HTMLElement | null = null;

    // Find the target character element
    if (currentPosition < text.length) {
      targetElement = containerRef.current.querySelector(`[data-char-index="${currentPosition}"]`) as HTMLElement;
    }

    if (targetElement) {
      const charRect = targetElement.getBoundingClientRect();
      const left = charRect.left - containerRect.left;
      const top = charRect.top - containerRect.top;
      
      setCaretStyle({
        left: `${left}px`,
        top: `${top}px`,
        height: `${charRect.height}px`,
        transform: 'translateY(0.15em)'
      });
    } else {
      // Position caret at the end if beyond text length
      const lastChar = containerRef.current.querySelector('[data-char-index]') as HTMLElement;
      if (lastChar) {
        const lastRect = lastChar.getBoundingClientRect();
        const left = lastRect.right - containerRect.left;
        const top = lastRect.top - containerRect.top;
        
        setCaretStyle({
          left: `${left}px`,
          top: `${top}px`,
          height: `${lastRect.height}px`,
          transform: 'translateY(0.15em)'
        });
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(updateCaretPosition);
    }
  }, [currentPosition, characterStatus, isActive]);

  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="typing-field"
      role="region"
      aria-label="typing test"
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ outline: 'none' }}
    >
      {words.map((word, wIdx) => (
        <span className="word" data-word-idx={wIdx} key={wIdx}>
          {word.split('').map((ch, cIdx) => {
            const charIndex = globalCharIndex;
            globalCharIndex++;
            return (
              <span 
                className={getCharClass(wIdx, cIdx)} 
                data-char-index={charIndex}
                key={cIdx}
              >
                {ch}
              </span>
            );
          })}
          {/* Render trailing space as its own hitbox for correct/incorrect space */}
          <span className={getSpaceClass(wIdx)} data-char-index={globalCharIndex}> </span>
        </span>
      ))}
      <span ref={caretRef} id="caret" style={caretStyle} />
    </div>
  );
};
