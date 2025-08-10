import { useEffect, useRef, useState, useCallback } from 'react';

interface TypingViewportProps {
  words: string[];
  activeWord: number;
  activeChar: number;
  charState: Array<Array<'pending' | 'correct' | 'incorrect' | 'extra'>>;
  onCharacterInput: (char: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  isActive: boolean;
}

export const TypingViewport = ({
  words,
  activeWord,
  activeChar,
  charState,
  onCharacterInput,
  onSpace,
  onBackspace,
  onCompositionStart,
  onCompositionEnd,
  isActive
}: TypingViewportProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  
  // Refs for O(1) access to all chars and spaces
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const spaceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  
  // Line virtualization state
  const [lineOfWord, setLineOfWord] = useState<number[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [lineHeight, setLineHeight] = useState(0);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Calculate line indices for each word
  const calculateLineIndices = useCallback(() => {
    if (!flowRef.current || wordRefs.current.size === 0) return;

    const flow = flowRef.current;
    const computedStyle = window.getComputedStyle(flow);
    const newLineHeight = parseFloat(computedStyle.lineHeight);
    setLineHeight(newLineHeight);

    const firstWord = wordRefs.current.get(0);
    if (!firstWord) return;

    const top0 = firstWord.offsetTop;
    const newLineOfWord: number[] = [];

    for (let i = 0; i < words.length; i++) {
      const wordEl = wordRefs.current.get(i);
      if (wordEl) {
        const lineIndex = Math.round((wordEl.offsetTop - top0) / newLineHeight);
        newLineOfWord[i] = lineIndex;
      }
    }

    setLineOfWord(newLineOfWord);
  }, [words.length]);

  // Update current line and translate flow
  const updateCurrentLine = useCallback((newLine: number) => {
    if (!flowRef.current || newLine === currentLine) return;

    setCurrentLine(newLine);
    const translateY = -newLine * lineHeight;
    flowRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
  }, [currentLine, lineHeight]);

  // Update caret position using requestAnimationFrame
  const updateCaretPosition = useCallback(() => {
    if (!flowRef.current || !caretRef.current) return;

    const flow = flowRef.current;
    const caret = caretRef.current;
    let targetElement: HTMLElement | null = null;

    if (activeWord < words.length) {
      const word = words[activeWord];
      
      if (activeChar < word.length) {
        // Inside a word - target the character
        const charKey = `${activeWord}-${activeChar}`;
        targetElement = charRefs.current.get(charKey) || null;
      } else {
        // At end of word - target the space
        targetElement = spaceRefs.current.get(activeWord) || null;
      }
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const flowRect = flow.getBoundingClientRect();
      
      const x = rect.left - flowRect.left;
      const y = rect.top - flowRect.top;
      const height = rect.height;

      caret.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      caret.style.height = `${height}px`;
    }
  }, [activeWord, activeChar, words.length]);

  // Batch all updates in requestAnimationFrame
  const batchUpdates = useCallback(() => {
    if (!isActive) return;

    requestAnimationFrame(() => {
      // Update current line if needed
      if (activeWord < lineOfWord.length) {
        const wordLine = lineOfWord[activeWord];
        if (wordLine !== undefined && wordLine !== currentLine) {
          updateCurrentLine(wordLine);
        }
      }

      // Update caret position
      updateCaretPosition();
    });
  }, [isActive, activeWord, lineOfWord, currentLine, updateCurrentLine, updateCaretPosition]);

  // Setup resize observer
  useEffect(() => {
    if (!viewportRef.current) return;

    resizeObserver.current = new ResizeObserver(() => {
      calculateLineIndices();
      batchUpdates();
    });

    resizeObserver.current.observe(viewportRef.current);

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [calculateLineIndices, batchUpdates]);

  // Calculate line indices after initial render
  useEffect(() => {
    if (wordRefs.current.size > 0) {
      calculateLineIndices();
    }
  }, [calculateLineIndices]);

  // Handle font loading
  useEffect(() => {
    const handleFontsReady = () => {
      calculateLineIndices();
      batchUpdates();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(handleFontsReady);
    } else {
      // Fallback for older browsers
      setTimeout(handleFontsReady, 100);
    }
  }, [calculateLineIndices, batchUpdates]);

  // Update on active word/char changes
  useEffect(() => {
    batchUpdates();
  }, [activeWord, activeChar, batchUpdates]);

  // Focus management
  useEffect(() => {
    if (isActive && trapRef.current) {
      trapRef.current.focus();
    }
  }, [isActive]);

  // Handle clicks to refocus
  const handleViewportClick = useCallback(() => {
    if (isActive && trapRef.current) {
      trapRef.current.focus();
    }
  }, [isActive]);

  // Input event handlers
  const handleBeforeInput = useCallback((e: InputEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    if (e.data) {
      onCharacterInput(e.data);
    }
  }, [isActive, onCharacterInput]);

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

    // Allow Ctrl+C for copy
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

  // Get opacity for line virtualization
  const getLineOpacity = useCallback((wordIdx: number) => {
    if (wordIdx >= lineOfWord.length) return 1;
    
    const wordLine = lineOfWord[wordIdx];
    const distance = Math.abs(wordLine - currentLine);
    
    if (distance <= 1) return 1; // Current, previous, and next line
    return 0.35; // Dimmed for other lines
  }, [lineOfWord, currentLine]);

  return (
    <section className="test-root">
      <div 
        className="viewport" 
        ref={viewportRef} 
        aria-label="typing test"
        onClick={handleViewportClick}
      >
        <div className="flow" ref={flowRef}>
          {words.map((word, wordIdx) => (
            <span 
              key={wordIdx}
              className="word" 
              data-w={wordIdx}
              ref={(el) => setWordRef(wordIdx, el)}
              style={{ opacity: getLineOpacity(wordIdx) }}
            >
              {word.split('').map((char, charIdx) => {
                const state = charState[wordIdx]?.[charIdx] || 'pending';
                return (
                  <span
                    key={charIdx}
                    className={`char ${state}`}
                    data-c={charIdx}
                    ref={(el) => setCharRef(wordIdx, charIdx, el)}
                  >
                    {char}
                  </span>
                );
              })}
              <span 
                className={`space ${charState[wordIdx]?.[word.length] || 'pending'}`}
                ref={(el) => setSpaceRef(wordIdx, el)}
              >
                {' '}
              </span>
            </span>
          ))}
          <span id="caret" ref={caretRef} aria-hidden />
        </div>
      </div>

      <input
        ref={trapRef}
        className="input-trap"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="none"
        aria-hidden="true"
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
      />
    </section>
  );
};
