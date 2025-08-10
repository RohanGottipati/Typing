import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

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

export interface TypingViewportRef {
  focus: () => void;
}

export const TypingViewport = forwardRef<TypingViewportRef, TypingViewportProps>(({
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
}, ref) => {
  // Core refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  
  // Performance-critical refs (avoid setState in hot path)
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const spaceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  
  // Line virtualization refs (no setState during typing)
  const lineOfWordRef = useRef<number[]>([]);
  const currentLineRef = useRef(0);
  const lineHeightRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  
  // ResizeObserver with throttling
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const pendingResizeRef = useRef(false);
  const lastLineHeightRef = useRef(0);

  // Expose focus method
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (trapRef.current) {
        trapRef.current.focus();
      }
    }
  }));

  // Calculate line indices (throttled)
  const calculateLineIndices = useCallback(() => {
    if (!flowRef.current || wordRefs.current.size === 0) return;

    const flow = flowRef.current;
    const computedStyle = window.getComputedStyle(flow);
    const newLineHeight = parseFloat(computedStyle.lineHeight);
    
    // Only update if line height actually changed
    if (newLineHeight !== lastLineHeightRef.current) {
      lastLineHeightRef.current = newLineHeight;
      lineHeightRef.current = newLineHeight;
    }

    const firstWord = wordRefs.current.get(0);
    if (!firstWord) return;

    const top0 = firstWord.offsetTop;
    const newLineOfWord: number[] = [];

    for (let i = 0; i < words.length; i++) {
      const wordEl = wordRefs.current.get(i);
      if (wordEl) {
        const lineIndex = Math.round((wordEl.offsetTop - top0) / lineHeightRef.current);
        newLineOfWord[i] = lineIndex;
      }
    }

    lineOfWordRef.current = newLineOfWord;
  }, [words.length]);

  // Single rAF for all layout operations
  const scheduleLayoutUpdate = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!isActive) return;
      
      // Update caret position
      updateCaretPosition();
      
      // Update line translation if needed
      updateLineTranslation();
    });
  }, [isActive]);

  // Update caret position (DOM reads)
  const updateCaretPosition = useCallback(() => {
    if (!flowRef.current || !caretRef.current) return;

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
      const flowRect = flowRef.current!.getBoundingClientRect();
      
      const left = rect.left - flowRect.left;
      const top = rect.top - flowRect.top;
      const height = rect.height;
      
      const caret = caretRef.current!;
      caret.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      caret.style.height = `${height}px`;
    }
  }, [activeWord, activeChar, words]);

  // Update line translation (DOM writes)
  const updateLineTranslation = useCallback(() => {
    if (!flowRef.current || activeWord >= lineOfWordRef.current.length) return;
    
    const wordLine = lineOfWordRef.current[activeWord];
    if (wordLine === undefined || wordLine === currentLineRef.current) return;

    currentLineRef.current = wordLine;
    const translateY = -wordLine * lineHeightRef.current;
    flowRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
  }, [activeWord]);

  // Get opacity for line virtualization
  const getLineOpacity = useCallback((wordIdx: number) => {
    if (wordIdx >= lineOfWordRef.current.length) return 1;
    
    const wordLine = lineOfWordRef.current[wordIdx];
    const distance = Math.abs(wordLine - currentLineRef.current);
    
    if (distance <= 1) return 1; // Current, previous, and next line
    return 0.35; // Dimmed for other lines
  }, []);

  // Initialize line indices after mount
  useEffect(() => {
    if (isActive && wordRefs.current.size > 0) {
      calculateLineIndices();
      scheduleLayoutUpdate();
    }
  }, [isActive, calculateLineIndices, scheduleLayoutUpdate]);

  // Handle font loading once
  useEffect(() => {
    if (!isActive) return;
    
    const handleFontsReady = () => {
      if (isActive) {
        calculateLineIndices();
        scheduleLayoutUpdate();
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(handleFontsReady).catch(() => {});
    }
  }, [isActive, calculateLineIndices, scheduleLayoutUpdate]);

  // ResizeObserver with throttling
  useEffect(() => {
    const flow = flowRef.current;
    if (!flow) return;

    const ro = new ResizeObserver(() => {
      if (pendingResizeRef.current) return;
      pendingResizeRef.current = true;
      
      requestAnimationFrame(() => {
        pendingResizeRef.current = false;
        if (isActive) {
          calculateLineIndices();
          scheduleLayoutUpdate();
        }
      });
    });
    
    ro.observe(flow);
    resizeObserver.current = ro;
    
    return () => {
      ro.disconnect();
      resizeObserver.current = null;
    };
  }, [isActive, calculateLineIndices, scheduleLayoutUpdate]);

  // Update layout on active word/char changes
  useEffect(() => {
    if (isActive) {
      scheduleLayoutUpdate();
    }
  }, [activeWord, activeChar, isActive, scheduleLayoutUpdate]);

  // Handle pointer events to refocus (no blur loop)
  useEffect(() => {
    const el = trapRef.current;
    if (!el) return;
    
    const refocus = () => isActive && el.focus({ preventScroll: true });
    viewportRef.current?.addEventListener('pointerdown', refocus);
    
    return () => viewportRef.current?.removeEventListener('pointerdown', refocus);
  }, [isActive]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Input event handlers (minimal, no setState)
  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    if (!isActive || isComposingRef.current) return;
    
    e.preventDefault();
    
    const target = e.target as HTMLInputElement;
    if (target.value) {
      onCharacterInput(target.value);
      target.value = ''; // Clear the input
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
    isComposingRef.current = true;
    onCompositionStart();
  }, [onCompositionStart]);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    onCompositionEnd();
  }, [onCompositionEnd]);

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
      <div 
        className="viewport" 
        ref={viewportRef} 
        aria-label="typing test"
        style={{
          position: 'relative',
          height: '9.5rem',
          overflow: 'hidden'
        }}
      >
        <div 
          className="flow" 
          ref={flowRef}
          style={{
            position: 'relative',
            willChange: 'transform',
            transition: 'transform 160ms ease'
          }}
        >
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
          <span 
            id="caret" 
            ref={caretRef} 
            aria-hidden
            style={{
              position: 'absolute',
              width: '2px',
              backgroundColor: 'rgb(34 197 94)',
              transition: 'none',
              pointerEvents: 'none'
            }}
          />
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
        onChange={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          padding: 0,
          border: 'none',
          outline: 'none'
        }}
      />
    </section>
  );
});
