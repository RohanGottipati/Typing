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
  // DOM refs for direct manipulation
  const viewportRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  
  // Performance-critical refs (no setState during typing)
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const spaceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  
  // Hot-path data in refs (avoid setState)
  const activeWordIndexRef = useRef(0);
  const activeCharIndexRef = useRef(0);
  const charStatesRef = useRef<Array<Array<'pending' | 'correct' | 'incorrect' | 'extra'>>>([]);
  const lineHeightRef = useRef(0);
  const currentLineRef = useRef(0);
  
  // Animation and timing refs
  const rafIdRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const pendingCaretUpdateRef = useRef(false);
  
  // ResizeObserver with throttling
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const pendingResizeRef = useRef(false);

  // Expose focus method
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (trapRef.current) {
        trapRef.current.focus();
      }
    }
  }));

  // Initialize refs and render text block
  const initializeTextBlock = useCallback(() => {
    if (!flowRef.current || words.length === 0) return;

    // Clear existing content
    flowRef.current.innerHTML = '';
    
    // Clear refs
    charRefs.current.clear();
    spaceRefs.current.clear();
    wordRefs.current.clear();
    
    // Initialize char states
    charStatesRef.current = words.map(word => 
      new Array(word.length + 1).fill('pending') // +1 for space
    );
    
    // Reset indices
    activeWordIndexRef.current = 0;
    activeCharIndexRef.current = 0;
    currentLineRef.current = 0;
    
    // Get line height
    const flow = flowRef.current;
    const computedStyle = window.getComputedStyle(flow);
    lineHeightRef.current = parseFloat(computedStyle.lineHeight);
    
    // Render all words and characters
    words.forEach((word, wordIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.dataset.wordIndex = wordIdx.toString();
      wordRefs.current.set(wordIdx, wordSpan);
      
      // Add characters
      word.split('').forEach((char, charIdx) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char pending';
        charSpan.textContent = char;
        charSpan.dataset.charIndex = charIdx.toString();
        
        const key = `${wordIdx}-${charIdx}`;
        charRefs.current.set(key, charSpan);
        wordSpan.appendChild(charSpan);
      });
      
      // Add space
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'space pending';
      spaceSpan.textContent = ' ';
      spaceRefs.current.set(wordIdx, spaceSpan);
      wordSpan.appendChild(spaceSpan);
      
      flow.appendChild(wordSpan);
    });
    
    // Position caret at start
    scheduleCaretUpdate();
  }, [words]);

  // Update caret position using rAF
  const updateCaretPosition = useCallback(() => {
    if (!caretRef.current || !flowRef.current) return;

    const wordIdx = activeWordIndexRef.current;
    const charIdx = activeCharIndexRef.current;
    
    let targetElement: HTMLElement | null = null;
    
    if (wordIdx < words.length) {
      const word = words[wordIdx];
      
      if (charIdx < word.length) {
        // Inside a word - target the character
        const key = `${wordIdx}-${charIdx}`;
        targetElement = charRefs.current.get(key) || null;
      } else {
        // At end of word - target the space
        targetElement = spaceRefs.current.get(wordIdx) || null;
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
  }, [words]);

  // Schedule caret update with rAF
  const scheduleCaretUpdate = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateCaretPosition();
      pendingCaretUpdateRef.current = false;
    });
  }, [updateCaretPosition]);

  // Update line translation when moving to new line
  const updateLineTranslation = useCallback(() => {
    if (!flowRef.current) return;
    
    const wordIdx = activeWordIndexRef.current;
    if (wordIdx >= words.length) return;
    
    const wordElement = wordRefs.current.get(wordIdx);
    if (!wordElement) return;
    
    const wordRect = wordElement.getBoundingClientRect();
    const flowRect = flowRef.current.getBoundingClientRect();
    
    const wordLine = Math.floor((wordRect.top - flowRect.top) / lineHeightRef.current);
    
    if (wordLine !== currentLineRef.current) {
      currentLineRef.current = wordLine;
      const translateY = -wordLine * lineHeightRef.current;
      flowRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }
  }, [words]);

  // Initialize text block when test starts
  useEffect(() => {
    if (isActive && words.length > 0) {
      initializeTextBlock();
    }
  }, [isActive, words, initializeTextBlock]);

  // Update caret when active word/char changes
  useEffect(() => {
    if (isActive) {
      activeWordIndexRef.current = activeWord;
      activeCharIndexRef.current = activeChar;
      
      if (!pendingCaretUpdateRef.current) {
        pendingCaretUpdateRef.current = true;
        scheduleCaretUpdate();
      }
      
      updateLineTranslation();
    }
  }, [isActive, activeWord, activeChar, scheduleCaretUpdate, updateLineTranslation]);

  // Update char states when they change
  useEffect(() => {
    if (!isActive || charState.length === 0) return;
    
    // Update char states ref
    charStatesRef.current = charState;
    
    // Update DOM directly for changed characters
    charState.forEach((wordStates, wordIdx) => {
      wordStates.forEach((state, charIdx) => {
        if (charIdx < words[wordIdx].length) {
          const key = `${wordIdx}-${charIdx}`;
          const charElement = charRefs.current.get(key);
          if (charElement) {
            charElement.className = `char ${state}`;
          }
        }
      });
      
      // Update space state
      const spaceElement = spaceRefs.current.get(wordIdx);
      if (spaceElement) {
        const spaceState = wordStates[words[wordIdx].length] || 'pending';
        spaceElement.className = `space ${spaceState}`;
      }
    });
  }, [isActive, charState, words]);

  // ResizeObserver with throttling
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const ro = new ResizeObserver(() => {
      if (pendingResizeRef.current) return;
      pendingResizeRef.current = true;
      
      requestAnimationFrame(() => {
        pendingResizeRef.current = false;
        if (isActive) {
          scheduleCaretUpdate();
        }
      });
    });
    
    ro.observe(viewport);
    resizeObserver.current = ro;
    
    return () => {
      ro.disconnect();
      resizeObserver.current = null;
    };
  }, [isActive, scheduleCaretUpdate]);

  // Handle pointer events to refocus
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

  // Input event handlers
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    if (!isActive || isComposingRef.current) return;
    
    const target = e.target as HTMLInputElement;
    if (target.value) {
      onCharacterInput(target.value);
      target.value = '';
    }
  }, [isActive, onCharacterInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive) return;

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      onSpace();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      onBackspace();
      return;
    }

    if (e.ctrlKey && e.key === 'c') {
      return;
    }

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

  return (
    <section className="test-root">
      <div 
        className="viewport" 
        ref={viewportRef} 
        aria-label="typing test"
        style={{
          position: 'relative',
          width: '100%',
          height: '9.5rem',
          overflow: 'hidden',
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          padding: '1rem'
        }}
      >
        <div 
          className="flow" 
          ref={flowRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            willChange: 'transform',
            transition: 'transform 160ms ease',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
            fontSize: '1.125rem',
            lineHeight: '1.75',
            color: '#e5e7eb',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word'
          }}
        >
          {/* Text will be rendered here via DOM manipulation */}
        </div>
        
        <span 
          id="caret" 
          ref={caretRef} 
          aria-hidden
          style={{
            position: 'absolute',
            width: '2px',
            backgroundColor: '#10b981',
            transition: 'none',
            pointerEvents: 'none',
            zIndex: 10,
            willChange: 'transform'
          }}
        />
      </div>

      <input
        ref={trapRef}
        className="input-trap"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="none"
        aria-hidden="true"
        onChange={handleInput}
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
          outline: 'none',
          background: 'transparent'
        }}
      />
    </section>
  );
});
