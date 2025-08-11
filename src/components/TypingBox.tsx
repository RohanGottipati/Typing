import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';

interface TypingBoxProps {
  text: string;
  onCharacterInput: (char: string, index: number) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  isActive: boolean;
  mode: 'time' | 'words' | 'quote' | 'zen' | 'custom';
  zenContent?: string;
  onZenContentChange?: (content: string) => void;
}

export interface TypingBoxRef {
  focus: () => void;
  startTest: () => void;
  endTest: () => void;
}

export const TypingBox = forwardRef<TypingBoxRef, TypingBoxProps>(({
  text,
  onCharacterInput,
  onBackspace,
  onSpace,
  onCompositionStart,
  onCompositionEnd,
  isActive,
  mode,
  zenContent = '',
  onZenContentChange
}, ref) => {
  // Container refs
  const typingBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  // Performance-critical state in refs
  const typingBox_chars = useRef<string[]>([]);
  const typingBox_index = useRef(0);
  const typingBox_charElements = useRef<HTMLSpanElement[]>([]);
  const typingBox_isRunning = useRef(false);
  const typingBox_isComposing = useRef(false);
  const typingBox_updateFrame = useRef<number | null>(null);
  
  // State for zen mode
  const [zenModeContent, setZenModeContent] = useState(zenContent);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    },
    startTest: () => {
      if (mode === 'zen') {
        setZenModeContent('');
        if (onZenContentChange) {
          onZenContentChange('');
        }
      } else {
        // Initialize character array and elements
        typingBox_chars.current = text ? text.split('') : [];
        typingBox_index.current = 0;
        typingBox_isRunning.current = true;
        
        // Render initial text
        typingBox_renderSpans();
        
        // Focus input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    },
    endTest: () => {
      typingBox_isRunning.current = false;
      
      // Cancel any pending animation frame
      if (typingBox_updateFrame.current) {
        cancelAnimationFrame(typingBox_updateFrame.current);
        typingBox_updateFrame.current = null;
      }
    }
  }));

  // Render character spans with proper classes
  const typingBox_renderSpans = useCallback(() => {
    if (!textContainerRef.current || mode === 'zen') return;
    
    const container = textContainerRef.current;
    container.innerHTML = '';
    
    typingBox_charElements.current = [];
    
    if (!text || text.length === 0) return;
    
    typingBox_chars.current.forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.dataset.idx = index.toString();
      
      // Apply appropriate class based on position
      if (index < typingBox_index.current) {
        span.className = 'typingBox_char-correct';
      } else if (index === typingBox_index.current) {
        span.className = 'typingBox_char-current';
      } else {
        span.className = 'typingBox_char-pending';
      }
      
      container.appendChild(span);
      typingBox_charElements.current[index] = span;
    });
  }, [text, mode]);

  // Update character states efficiently
  const typingBox_updateCharStates = useCallback(() => {
    if (typingBox_updateFrame.current) {
      cancelAnimationFrame(typingBox_updateFrame.current);
    }
    
    typingBox_updateFrame.current = requestAnimationFrame(() => {
      typingBox_charElements.current.forEach((element, index) => {
        if (!element) return;
        
        if (index < typingBox_index.current) {
          element.className = 'typingBox_char-correct';
        } else if (index === typingBox_index.current) {
          element.className = 'typingBox_char-current';
        } else {
          element.className = 'typingBox_char-pending';
        }
      });
      
      typingBox_updateFrame.current = null;
    });
  }, []);

  // Handle character input - non-blocking mistakes
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    if (!typingBox_isRunning.current || typingBox_isComposing.current || mode === 'zen') return;
    
    const input = e.target as HTMLInputElement;
    const typedChar = input.value;
    input.value = '';
    
    if (typedChar.length === 0) return;
    
    const currentChar = typedChar[0];
    const currentIndex = typingBox_index.current;
    
    if (currentIndex < typingBox_chars.current.length && typingBox_chars.current.length > 0) {
      const expectedChar = typingBox_chars.current[currentIndex];
      const isCorrect = currentChar === expectedChar;
      
      // Always call onCharacterInput with the typed character and current index
      onCharacterInput(currentChar, currentIndex);
      
      // ALWAYS advance the index - mistakes don't block typing
      typingBox_index.current++;
      
      // Check if we need to handle space (only if we're at a space character)
      if (currentIndex + 1 < typingBox_chars.current.length && typingBox_chars.current[currentIndex + 1] === ' ') {
        onSpace();
      }
      
      // Update visual states
      typingBox_updateCharStates();
    }
  }, [onCharacterInput, onSpace, mode, typingBox_updateCharStates]);

  // Handle backspace
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!typingBox_isRunning.current || typingBox_isComposing.current || mode === 'zen') return;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (typingBox_index.current > 0) {
        typingBox_index.current--;
        onBackspace();
        typingBox_updateCharStates();
      }
    }
    
    // Prevent other keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }, [onBackspace, mode, typingBox_updateCharStates]);

  // Handle composition events
  const handleCompositionStart = useCallback(() => {
    typingBox_isComposing.current = true;
    onCompositionStart();
  }, [onCompositionStart]);

  const handleCompositionEnd = useCallback(() => {
    typingBox_isComposing.current = false;
    onCompositionEnd();
  }, [onCompositionEnd]);

  // Handle zen mode content changes
  const handleZenContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setZenModeContent(newContent);
    if (onZenContentChange) {
      onZenContentChange(newContent);
    }
  }, [onZenContentChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingBox_updateFrame.current) {
        cancelAnimationFrame(typingBox_updateFrame.current);
      }
    };
  }, []);

  // Update zen content when prop changes
  useEffect(() => {
    if (mode === 'zen' && zenContent !== zenModeContent) {
      setZenModeContent(zenContent);
    }
  }, [zenContent, mode, zenModeContent]);

  return (
    <div 
      id="typing-box"
      ref={typingBoxRef}
      className="typing-box-container"
    >
      {mode === 'zen' ? (
        <textarea
          ref={inputRef as any}
          value={zenModeContent}
          onChange={handleZenContentChange}
          className="typing-box-zen-textarea"
          placeholder="Start typing here..."
          disabled={!isActive}
          autoFocus={isActive}
        />
      ) : (
        <>
          <div 
            ref={textContainerRef}
            className="typing-box-text-container"
          >
            {!text || text.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Loading text...
              </div>
            ) : null}
          </div>
          
          <input
            ref={inputRef}
            className="typing-box-input-trap"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="none"
            aria-hidden="true"
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
        </>
      )}
    </div>
  );
});
