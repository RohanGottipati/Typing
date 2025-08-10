import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

interface TypingViewportProps {
  words: string[];
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
  
  // Hot path data in refs (never trigger re-renders)
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const spaceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  
  // Performance-critical refs
  const activeWordIndexRef = useRef(0);
  const activeCharIndexRef = useRef(0);
  const charStatesRef = useRef<Array<Array<'pending' | 'correct' | 'incorrect' | 'extra'>>>([]);
  const wordListRef = useRef<string[]>([]);
  const isRunningRef = useRef(false);
  const lineHeightRef = useRef(0);
  const currentLineRef = useRef(0);
  
  // Animation and timing refs
  const rafIdRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const pendingCaretUpdateRef = useRef(false);
  
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

  // Render text once on test start
  const renderTextBlock = useCallback(() => {
    if (!flowRef.current || words.length === 0) return;

    // Clear existing content
    flowRef.current.innerHTML = '';
    
    // Clear refs
    charRefs.current.clear();
    spaceRefs.current.clear();
    wordRefs.current.clear();
    
    // Store word list in ref
    wordListRef.current = [...words];
    
    // Initialize char states
    charStatesRef.current = words.map(word => 
      new Array(word.length + 1).fill('pending') // +1 for space
    );
    
    // Reset indices
    activeWordIndexRef.current = 0;
    activeCharIndexRef.current = 0;
    currentLineRef.current = 0;
    isRunningRef.current = true;
    
    // Get line height once
    const flow = flowRef.current;
    const computedStyle = window.getComputedStyle(flow);
    lineHeightRef.current = parseFloat(computedStyle.lineHeight);
    lastLineHeightRef.current = lineHeightRef.current;
    
    // Render all words and characters
    words.forEach((word, wordIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.dataset.wordIndex = wordIdx.toString();
      wordSpan.style.maxWidth = '100%';
      wordSpan.style.boxSizing = 'border-box';
      wordSpan.style.wordWrap = 'break-word';
      wordSpan.style.wordBreak = 'break-word';
      wordSpan.style.overflowWrap = 'break-word';
      wordRefs.current.set(wordIdx, wordSpan);
      
      // Add characters
      word.split('').forEach((char, charIdx) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char pending';
        charSpan.textContent = char;
        charSpan.dataset.charIndex = charIdx.toString();
        charSpan.style.fontSize = '1.5rem';
        charSpan.style.maxWidth = '100%';
        charSpan.style.boxSizing = 'border-box';
        charSpan.style.whiteSpace = 'pre-wrap';
        
        const key = `${wordIdx}-${charIdx}`;
        charRefs.current.set(key, charSpan);
        wordSpan.appendChild(charSpan);
      });
      
      // Add space
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'space pending';
      spaceSpan.textContent = ' ';
      spaceSpan.style.fontSize = '1.5rem';
      spaceSpan.style.maxWidth = '100%';
      spaceSpan.style.boxSizing = 'border-box';
      spaceSpan.style.whiteSpace = 'pre-wrap';
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
    
    if (wordIdx < wordListRef.current.length) {
      const word = wordListRef.current[wordIdx];
      
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
      // Use offsetLeft/offsetTop for better performance
      const left = targetElement.offsetLeft;
      const top = targetElement.offsetTop;
      const height = targetElement.offsetHeight;
      
      const caret = caretRef.current!;
      caret.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      caret.style.height = `${height}px`;
    }
  }, []);

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
    if (wordIdx >= wordListRef.current.length) return;
    
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
  }, []);

  // Initialize text block when test starts
  useEffect(() => {
    if (isActive && words.length > 0) {
      renderTextBlock();
    }
  }, [isActive, words, renderTextBlock]);

  // ResizeObserver with throttling
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const ro = new ResizeObserver(() => {
      if (pendingResizeRef.current) return;
      pendingResizeRef.current = true;
      
      requestAnimationFrame(() => {
        pendingResizeRef.current = false;
        if (isActive && isRunningRef.current) {
          // Only recalc line height if container size changes
          const flow = flowRef.current;
          if (flow) {
            const computedStyle = window.getComputedStyle(flow);
            const newLineHeight = parseFloat(computedStyle.lineHeight);
            
            if (newLineHeight !== lastLineHeightRef.current) {
              lastLineHeightRef.current = newLineHeight;
              lineHeightRef.current = newLineHeight;
            }
          }
          
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

  // Input event handlers - direct DOM manipulation
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    if (!isActive || !isRunningRef.current || isComposingRef.current) return;
    
    const target = e.target as HTMLInputElement;
    if (target.value) {
      const typedChar = target.value;
      target.value = '';
      
      // Handle character input directly
      const wordIdx = activeWordIndexRef.current;
      const charIdx = activeCharIndexRef.current;
      
      if (wordIdx < wordListRef.current.length) {
        const word = wordListRef.current[wordIdx];
        
        if (charIdx < word.length) {
          // Inside a word
          const expectedChar = word[charIdx];
          const isCorrect = typedChar === expectedChar;
          
          // Update character state directly
          const key = `${wordIdx}-${charIdx}`;
          const charElement = charRefs.current.get(key);
          if (charElement) {
            charElement.className = `char ${isCorrect ? 'correct' : 'incorrect'}`;
          }
          
          // Update internal state
          charStatesRef.current[wordIdx][charIdx] = isCorrect ? 'correct' : 'incorrect';
          
          // Advance to next character
          activeCharIndexRef.current = charIdx + 1;
          
          // Call parent handler for metrics
          onCharacterInput(typedChar);
          
          // Update caret position
          if (!pendingCaretUpdateRef.current) {
            pendingCaretUpdateRef.current = true;
            scheduleCaretUpdate();
          }
          
          updateLineTranslation();
        } else {
          // At end of word - handle space
          if (typedChar === ' ') {
            // Mark remaining pending chars as incorrect
            for (let i = charIdx; i < word.length; i++) {
              const key = `${wordIdx}-${i}`;
              const charElement = charRefs.current.get(key);
              if (charElement) {
                charElement.className = 'char incorrect';
              }
              charStatesRef.current[wordIdx][i] = 'incorrect';
            }
            
            // Mark space based on word accuracy
            const isWordCorrect = charStatesRef.current[wordIdx].slice(0, word.length).every(state => state === 'correct');
            const spaceElement = spaceRefs.current.get(wordIdx);
            if (spaceElement) {
              spaceElement.className = `space ${isWordCorrect ? 'correct' : 'incorrect'}`;
            }
            charStatesRef.current[wordIdx][word.length] = isWordCorrect ? 'correct' : 'incorrect';
            
            // Move to next word
            if (wordIdx < wordListRef.current.length - 1) {
              activeWordIndexRef.current = wordIdx + 1;
              activeCharIndexRef.current = 0;
            }
            
            // Call parent handler
            onSpace();
            
            // Update caret position
            if (!pendingCaretUpdateRef.current) {
              pendingCaretUpdateRef.current = true;
              scheduleCaretUpdate();
            }
            
            updateLineTranslation();
          }
        }
      }
    }
  }, [isActive, onCharacterInput, onSpace, scheduleCaretUpdate, updateLineTranslation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive || !isRunningRef.current) return;

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      
      // Handle backspace directly
      const wordIdx = activeWordIndexRef.current;
      const charIdx = activeCharIndexRef.current;
      
      if (wordIdx < wordListRef.current.length) {
        const word = wordListRef.current[wordIdx];
        
        // Check if there are extra characters to remove
        const currentStates = charStatesRef.current[wordIdx] || [];
        const extraCount = currentStates.filter(state => state === 'extra').length;
        
        if (extraCount > 0) {
          // Remove last extra character
          const lastExtraIndex = currentStates.lastIndexOf('extra');
          if (lastExtraIndex >= 0) {
            currentStates[lastExtraIndex] = 'pending';
            const key = `${wordIdx}-${lastExtraIndex}`;
            const charElement = charRefs.current.get(key);
            if (charElement) {
              charElement.className = 'char pending';
            }
          }
        } else if (charIdx > 0) {
          // Move back one character and reset to pending
          activeCharIndexRef.current = charIdx - 1;
          const key = `${wordIdx}-${charIdx - 1}`;
          const charElement = charRefs.current.get(key);
          if (charElement) {
            charElement.className = 'char pending';
          }
          charStatesRef.current[wordIdx][charIdx - 1] = 'pending';
        }
        
        // Call parent handler
        onBackspace();
        
        // Update caret position
        if (!pendingCaretUpdateRef.current) {
          pendingCaretUpdateRef.current = true;
          scheduleCaretUpdate();
        }
        
        updateLineTranslation();
      }
      
      return;
    }

    if (e.ctrlKey && e.key === 'c') {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }, [isActive, onBackspace, scheduleCaretUpdate, updateLineTranslation]);

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
          height: '200px',
          overflow: 'hidden',
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="flow" 
          ref={flowRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '1.5rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
            fontSize: '1.5rem',
            lineHeight: '1.8',
            color: '#e5e7eb',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            boxSizing: 'border-box',
            willChange: 'transform',
            transition: 'transform 140ms ease',
            maxWidth: '100%',
            overflow: 'hidden'
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
            width: '3px',
            backgroundColor: '#10b981',
            transition: 'none',
            pointerEvents: 'none',
            zIndex: 10,
            willChange: 'transform',
            animation: 'caret-blink 1s infinite'
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
