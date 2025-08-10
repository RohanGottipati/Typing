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
  startTest: () => void;
  endTest: () => void;
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
  // Container refs - React only mounts these once
  const viewportRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  
  // Hot-path data in refs (never trigger re-renders)
  const charRefs = useRef<HTMLSpanElement[][]>([]);
  const spaceRefs = useRef<HTMLSpanElement[]>([]);
  
  // Performance-critical state in refs
  const activeWordIndex = useRef(0);
  const activeCharIndex = useRef(0);
  const charStates = useRef<Array<Array<'pending' | 'correct' | 'incorrect' | 'extra'>>>([]);
  const wordList = useRef<string[]>([]);
  const isRunning = useRef(false);
  const lineHeight = useRef(0);
  const currentLine = useRef(0);
  
  // Animation and timing refs
  const rafId = useRef<number | null>(null);
  const isComposing = useRef(false);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (trapRef.current) {
        trapRef.current.focus();
      }
    },
    startTest: () => {
      if (!flowRef.current || words.length === 0) return;
      
      // Reset all refs
      activeWordIndex.current = 0;
      activeCharIndex.current = 0;
      currentLine.current = 0;
      isRunning.current = true;
      charRefs.current = [];
      spaceRefs.current = [];
      
      // Store word list
      wordList.current = [...words];
      
      // Initialize char states
      charStates.current = words.map(word => 
        new Array(word.length + 1).fill('pending') // +1 for space
      );
      
      // Clear container
      if (flowRef.current) {
        flowRef.current.innerHTML = '';
      }
      
      // Get line height once
      if (flowRef.current) {
        const computedStyle = window.getComputedStyle(flowRef.current);
        lineHeight.current = parseFloat(computedStyle.lineHeight);
      }
      
      // Render text once - create all spans imperatively
      renderTextOnce();
      
      // Position caret at start
      scheduleCaretUpdate();
      
      // Focus input
      if (trapRef.current) {
        trapRef.current.focus();
      }
    },
    endTest: () => {
      isRunning.current = false;
      
      // Mark all pending as incorrect
      for (let wordIdx = 0; wordIdx < charStates.current.length; wordIdx++) {
        const wordStates = charStates.current[wordIdx];
        for (let charIdx = 0; charIdx < wordStates.length; charIdx++) {
          if (wordStates[charIdx] === 'pending') {
            wordStates[charIdx] = 'incorrect';
            const charElement = charRefs.current[wordIdx]?.[charIdx];
            if (charElement) {
              charElement.className = 'char incorrect';
            }
          }
        }
      }
      
      // Cancel any pending rAF
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    }
  }));

  // One-time text rendering - React never touches this again
  const renderTextOnce = useCallback(() => {
    if (!flowRef.current) return;
    
    const flow = flowRef.current;
    
    // Create all character and space spans
    words.forEach((word, wordIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      
      // Create character spans
      const wordCharRefs: HTMLSpanElement[] = [];
      word.split('').forEach((char, charIdx) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char pending';
        charSpan.textContent = char;
        charSpan.dataset.wordIndex = wordIdx.toString();
        charSpan.dataset.charIndex = charIdx.toString();
        wordSpan.appendChild(charSpan);
        wordCharRefs.push(charSpan);
      });
      charRefs.current[wordIdx] = wordCharRefs;
      
      // Create space span
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'space pending';
      spaceSpan.textContent = ' ';
      spaceSpan.dataset.wordIndex = wordIdx.toString();
      wordSpan.appendChild(spaceSpan);
      spaceRefs.current[wordIdx] = spaceSpan;
      
      flow.appendChild(wordSpan);
    });
  }, [words]);

  // Schedule single rAF for caret positioning
  const scheduleCaretUpdate = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      updateCaretPosition();
      rafId.current = null;
    });
  }, []);

  // Update caret position imperatively
  const updateCaretPosition = useCallback(() => {
    if (!caretRef.current) return;
    
    const wordIdx = activeWordIndex.current;
    const charIdx = activeCharIndex.current;
    
    let targetElement: HTMLElement | null = null;
    
    if (wordIdx < wordList.current.length) {
      const word = wordList.current[wordIdx];
      if (charIdx < word.length) {
        // Inside a word
        targetElement = charRefs.current[wordIdx]?.[charIdx] || null;
      } else {
        // At end of word - position at space
        targetElement = spaceRefs.current[wordIdx] || null;
      }
    }
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const containerRect = flowRef.current?.getBoundingClientRect();
      
      if (containerRect) {
        const left = rect.left - containerRect.left;
        const top = rect.top - containerRect.top;
        const height = rect.height;
        
        caretRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        caretRef.current.style.height = `${height}px`;
      }
    }
  }, []);

  // Update line translation when moving to new line
  const updateLineTranslation = useCallback(() => {
    if (!flowRef.current) return;
    
    const wordIdx = activeWordIndex.current;
    const charIdx = activeCharIndex.current;
    
    if (wordIdx < wordList.current.length) {
      const word = wordList.current[wordIdx];
      let targetElement: HTMLElement | null = null;
      
      if (charIdx < word.length) {
        targetElement = charRefs.current[wordIdx]?.[charIdx] || null;
      } else {
        targetElement = spaceRefs.current[wordIdx] || null;
      }
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = flowRef.current.getBoundingClientRect();
        
        if (rect.top > containerRect.top + lineHeight.current) {
          // Moved to new line - translate up
          const newLine = Math.floor((rect.top - containerRect.top) / lineHeight.current);
          if (newLine !== currentLine.current) {
            currentLine.current = newLine;
            const translateY = -newLine * lineHeight.current;
            flowRef.current.style.transform = `translateY(${translateY}px)`;
          }
        }
      }
    }
  }, []);

  // Input handling - direct DOM updates only
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    if (!isRunning.current || isComposing.current) return;
    
    const typedChar = (e.target as HTMLInputElement).value;
    (e.target as HTMLInputElement).value = '';
    
    const wordIdx = activeWordIndex.current;
    const charIdx = activeCharIndex.current;
    
    if (wordIdx < wordList.current.length) {
      const word = wordList.current[wordIdx];
      
      if (charIdx < word.length) {
        // Inside a word
        const isCorrect = typedChar === word[charIdx];
        const charElement = charRefs.current[wordIdx]?.[charIdx];
        
        if (charElement) {
          charElement.className = `char ${isCorrect ? 'correct' : 'incorrect'}`;
        }
        
        charStates.current[wordIdx][charIdx] = isCorrect ? 'correct' : 'incorrect';
        activeCharIndex.current = charIdx + 1;
        
        onCharacterInput(typedChar);
      } else {
        // At end of word - handle space
        if (typedChar === ' ') {
          // Mark remaining chars as incorrect
          for (let i = charIdx; i < word.length; i++) {
            charStates.current[wordIdx][i] = 'incorrect';
            const charElement = charRefs.current[wordIdx]?.[i];
            if (charElement) {
              charElement.className = 'char incorrect';
            }
          }
          
          // Mark space correct/incorrect
          const spaceElement = spaceRefs.current[wordIdx];
          if (spaceElement) {
            const isWordPerfect = charStates.current[wordIdx].slice(0, word.length).every(state => state === 'correct');
            spaceElement.className = `space ${isWordPerfect ? 'correct' : 'incorrect'}`;
          }
          
          charStates.current[wordIdx][word.length] = 'correct';
          activeWordIndex.current = wordIdx + 1;
          activeCharIndex.current = 0;
          
          onSpace();
        } else {
          // Extra character
          const extraSpan = document.createElement('span');
          extraSpan.className = 'char extra';
          extraSpan.textContent = typedChar;
          
          const wordSpan = flowRef.current?.children[wordIdx] as HTMLElement;
          if (wordSpan) {
            wordSpan.appendChild(extraSpan);
          }
        }
      }
      
      // Schedule caret update and line translation
      scheduleCaretUpdate();
      updateLineTranslation();
    }
  }, [onCharacterInput, onSpace, scheduleCaretUpdate, updateLineTranslation]);

  // Backspace handling - direct DOM updates only
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRunning.current || isComposing.current) return;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const wordIdx = activeWordIndex.current;
      const charIdx = activeCharIndex.current;
      
      if (wordIdx < wordList.current.length) {
        const word = wordList.current[wordIdx];
        
        if (charIdx > 0) {
          // Within current word
          activeCharIndex.current = charIdx - 1;
          const prevCharElement = charRefs.current[wordIdx]?.[charIdx - 1];
          
          if (prevCharElement) {
            prevCharElement.className = 'char pending';
          }
          
          charStates.current[wordIdx][charIdx - 1] = 'pending';
        } else if (wordIdx > 0) {
          // Move to previous word
          activeWordIndex.current = wordIdx - 1;
          const prevWord = wordList.current[wordIdx - 1];
          activeCharIndex.current = prevWord.length;
        }
        
        onBackspace();
        scheduleCaretUpdate();
        updateLineTranslation();
      }
    }
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }, [onBackspace, scheduleCaretUpdate, updateLineTranslation]);

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true;
    onCompositionStart();
  }, [onCompositionStart]);

  const handleCompositionEnd = useCallback(() => {
    isComposing.current = false;
    onCompositionEnd();
  }, [onCompositionEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // React only mounts this once - no re-renders during typing
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
          {/* Text rendered imperatively via DOM manipulation */}
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
