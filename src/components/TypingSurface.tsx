import { useEffect, useRef, useState, useCallback } from 'react';

interface TypingSurfaceProps {
  words: string[];
  activeWordIdx: number;
  activeCharIdx: number;
  charStates: Array<Array<'pending' | 'correct' | 'incorrect' | 'extra'>>;
  isComposing: boolean;
  onCharacterInput: (char: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  isActive: boolean;
}

export const TypingSurface = ({
  words,
  activeWordIdx,
  activeCharIdx,
  charStates,
  isComposing,
  onCharacterInput,
  onSpace,
  onBackspace,
  onCompositionStart,
  onCompositionEnd,
  isActive
}: TypingSurfaceProps) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const spaceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Update caret position using requestAnimationFrame
  const updateCaretPosition = useCallback(() => {
    if (!fieldRef.current || !caretRef.current) return;

    const field = fieldRef.current;
    const caret = caretRef.current;
    let targetElement: HTMLElement | null = null;

    // Find the target character or space element
    if (activeWordIdx < words.length) {
      const word = words[activeWordIdx];
      if (activeCharIdx < word.length) {
        // Inside a word - target the character
        const charKey = `${activeWordIdx}-${activeCharIdx}`;
        targetElement = charRefs.current.get(charKey) || null;
      } else {
        // At end of word - target the space
        targetElement = spaceRefs.current.get(activeWordIdx) || null;
      }
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      
      const x = rect.left - fieldRect.left;
      const y = rect.top - fieldRect.top;
      const height = rect.height;

      caret.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      caret.style.height = `${height}px`;
    }
  }, [activeWordIdx, activeCharIdx, words.length]);

  // Batch caret updates
  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(updateCaretPosition);
    }
  }, [activeWordIdx, activeCharIdx, isActive, updateCaretPosition]);

  // Handle font loading
  useEffect(() => {
    const handleFontsReady = () => {
      if (isActive) {
        requestAnimationFrame(updateCaretPosition);
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(handleFontsReady);
    } else {
      // Fallback for older browsers
      setTimeout(handleFontsReady, 100);
    }
  }, [isActive, updateCaretPosition]);

  // Setup resize observer
  useEffect(() => {
    if (!fieldRef.current) return;

    resizeObserver.current = new ResizeObserver(() => {
      if (isActive) {
        requestAnimationFrame(updateCaretPosition);
      }
    });

    resizeObserver.current.observe(fieldRef.current);

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [isActive, updateCaretPosition]);

  // Focus management
  useEffect(() => {
    if (isActive && trapRef.current) {
      trapRef.current.focus();
    }
  }, [isActive]);

  // Handle clicks to refocus
  const handleFieldClick = useCallback(() => {
    if (isActive && trapRef.current) {
      trapRef.current.focus();
    }
  }, [isActive]);

  // Input event handlers
  const handleBeforeInput = useCallback((e: InputEvent) => {
    if (!isActive || isComposing) return;
    
    e.preventDefault();
    
    if (e.data) {
      onCharacterInput(e.data);
    }
  }, [isActive, isComposing, onCharacterInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive) return;

    // Prevent default for control keys
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    // Handle Space
    if (e.key === ' ') {
      e.preventDefault();
      onSpace();
      return;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      onBackspace();
      return;
    }

    // Allow Ctrl+C for copy (if selection is implemented)
    if (e.ctrlKey && e.key === 'c') {
      return;
    }

    // Prevent other Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }, [isActive, onSpace, onBackspace]);

  const handleCompositionStart = useCallback(() => {
    onCompositionStart();
  }, [onCompositionStart]);

  const handleCompositionEnd = useCallback(() => {
    onCompositionEnd();
  }, [onCompositionEnd]);

  // Prevent blur unless test is ended
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (isActive) {
      e.preventDefault();
      e.target.focus();
    }
  }, [isActive]);

  // Store refs for performance
  const setWordRef = useCallback((wordIdx: number, element: HTMLSpanElement | null) => {
    if (element) {
      wordRefs.current.set(wordIdx, element);
    }
  }, []);

  const setCharRef = useCallback((wordIdx: number, charIdx: number, element: HTMLSpanElement | null) => {
    if (element) {
      const key = `${wordIdx}-${charIdx}`;
      charRefs.current.set(key, element);
    }
  }, []);

  const setSpaceRef = useCallback((wordIdx: number, element: HTMLSpanElement | null) => {
    if (element) {
      spaceRefs.current.set(wordIdx, element);
    }
  }, []);

  return (
    <section className="test-root">
      <div className="typing-wrap" onClick={handleFieldClick}>
        <div 
          className="typing-field" 
          ref={fieldRef} 
          role="region" 
          aria-label="typing test"
        >
          {words.map((word, wordIdx) => (
            <span 
              key={wordIdx}
              className="word" 
              ref={(el) => setWordRef(wordIdx, el)}
            >
              {word.split('').map((char, charIdx) => {
                const state = charStates[wordIdx]?.[charIdx] || 'pending';
                return (
                  <span
                    key={charIdx}
                    className={`char ${state}`}
                    ref={(el) => setCharRef(wordIdx, charIdx, el)}
                  >
                    {char}
                  </span>
                );
              })}
              <span 
                className={`space ${charStates[wordIdx]?.[word.length] || 'pending'}`}
                ref={(el) => setSpaceRef(wordIdx, el)}
              >
                {' '}
              </span>
            </span>
          ))}
          <span id="caret" ref={caretRef} aria-hidden />
        </div>

        <input
          ref={trapRef}
          className="input-trap"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="none"
          autoComplete="off"
          aria-hidden="true"
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onBlur={handleBlur}
        />
      </div>
    </section>
  );
};
