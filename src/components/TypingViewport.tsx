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

interface GlyphPosition {
  x: number;
  y: number;
  line: number;
  width: number;
  height: number;
}

interface WordLayout {
  startX: number;
  endX: number;
  line: number;
  glyphs: GlyphPosition[];
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
  // Canvas and rendering refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  
  // Performance-critical refs (no setState during typing)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const devicePixelRatioRef = useRef(1);
  const fontMetricsRef = useRef({
    fontSize: 30,
    lineHeight: 48, // 1.6 * fontSize
    letterSpacing: 0.6, // 0.02em * fontSize
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace"
  });
  
  // Layout and positioning refs
  const viewportWidthRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const wordLayoutsRef = useRef<WordLayout[]>([]);
  const currentLineRef = useRef(0);
  const verticalOffsetRef = useRef(0);
  
  // Animation and timing refs
  const rafIdRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const pendingRenderRef = useRef(false);
  const caretBlinkRef = useRef(0);
  
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

  // Initialize canvas and context
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    const dpr = window.devicePixelRatio || 1;
    devicePixelRatioRef.current = dpr;
    
    const rect = viewport.getBoundingClientRect();
    viewportWidthRef.current = rect.width;
    viewportHeightRef.current = rect.height;
    
    // Set canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
    
    // Set font
    const { fontSize, fontFamily } = fontMetricsRef.current;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';
  }, []);

  // Calculate word layouts with wrapping
  const calculateWordLayouts = useCallback(() => {
    if (!ctxRef.current || words.length === 0) return;

    const ctx = ctxRef.current;
    const { fontSize, lineHeight, letterSpacing } = fontMetricsRef.current;
    const viewportWidth = viewportWidthRef.current - 32; // Account for padding
    
    ctx.font = `${fontSize}px ${fontMetricsRef.current.fontFamily}`;
    
    const layouts: WordLayout[] = [];
    let currentX = 0;
    let currentY = 0;
    let currentLine = 0;
    
    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      const wordWidth = ctx.measureText(word).width;
      const spaceWidth = ctx.measureText(' ').width;
      const totalWidth = wordWidth + spaceWidth;
      
      // Check if word would overflow
      if (currentX + totalWidth > viewportWidth && currentX > 0) {
        currentX = 0;
        currentY += lineHeight;
        currentLine++;
      }
      
      const startX = currentX;
      const glyphs: GlyphPosition[] = [];
      
      // Calculate glyph positions for each character
      for (let charIdx = 0; charIdx < word.length; charIdx++) {
        const char = word[charIdx];
        const charWidth = ctx.measureText(char).width;
        
        glyphs.push({
          x: currentX,
          y: currentY,
          line: currentLine,
          width: charWidth,
          height: lineHeight
        });
        
        currentX += charWidth + letterSpacing;
      }
      
      // Add space after word
      glyphs.push({
        x: currentX,
        y: currentY,
        line: currentLine,
        width: spaceWidth,
        height: lineHeight
      });
      
      layouts.push({
        startX,
        endX: currentX + spaceWidth,
        line: currentLine,
        glyphs
      });
      
      currentX += spaceWidth;
    }
    
    wordLayoutsRef.current = layouts;
  }, [words]);

  // Render the typing area
  const render = useCallback(() => {
    if (!ctxRef.current || !isActive) return;

    const ctx = ctxRef.current;
    const { fontSize, lineHeight } = fontMetricsRef.current;
    const viewportHeight = viewportHeightRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, viewportWidthRef.current, viewportHeight);
    
    // Apply vertical offset for line transitions
    ctx.save();
    ctx.translate(0, verticalOffsetRef.current);
    
    // Draw words and characters
    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      const layout = wordLayoutsRef.current[wordIdx];
      const states = charState[wordIdx] || [];
      
      if (!layout) continue;
      
      // Draw each character
      for (let charIdx = 0; charIdx < word.length; charIdx++) {
        const char = word[charIdx];
        const glyph = layout.glyphs[charIdx];
        const state = states[charIdx] || 'pending';
        
        if (!glyph) continue;
        
        // Set color based on state
        switch (state) {
          case 'pending':
            ctx.fillStyle = '#6b7280'; // dimmed
            break;
          case 'correct':
            ctx.fillStyle = '#10b981'; // green
            break;
          case 'incorrect':
            ctx.fillStyle = '#ef4444'; // red
            break;
          case 'extra':
            ctx.fillStyle = '#f59e0b'; // amber
            break;
        }
        
        // Draw character
        ctx.fillText(char, glyph.x, glyph.y);
        
        // Draw red background for extras
        if (state === 'extra') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(glyph.x, glyph.y, glyph.width, glyph.height);
        }
      }
      
      // Draw space after word
      const spaceGlyph = layout.glyphs[word.length];
      const spaceState = states[word.length] || 'pending';
      
      if (spaceGlyph) {
        // Draw underline for space
        const isWordCorrect = states.slice(0, word.length).every(s => s === 'correct');
        ctx.strokeStyle = isWordCorrect ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spaceGlyph.x, spaceGlyph.y + fontSize + 2);
        ctx.lineTo(spaceGlyph.x + spaceGlyph.width, spaceGlyph.y + fontSize + 2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    // Draw caret
    if (activeWord < wordLayoutsRef.current.length) {
      const layout = wordLayoutsRef.current[activeWord];
      if (layout && activeChar < layout.glyphs.length) {
        const glyph = layout.glyphs[activeChar];
        
        // Blinking caret
        const blinkAlpha = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
        ctx.fillStyle = `rgba(16, 185, 129, ${blinkAlpha})`;
        ctx.fillRect(glyph.x, glyph.y, 2, glyph.height);
      }
    }
  }, [isActive, words, charState, activeWord, activeChar]);

  // Schedule render with rAF
  const scheduleRender = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      render();
      pendingRenderRef.current = false;
    });
  }, [render]);

  // Animate line transition
  const animateLineTransition = useCallback((targetLine: number) => {
    if (targetLine === currentLineRef.current) return;
    
    const { lineHeight } = fontMetricsRef.current;
    const targetOffset = -targetLine * lineHeight;
    const startOffset = verticalOffsetRef.current;
    const startTime = Date.now();
    const duration = 160; // 160ms transition
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      verticalOffsetRef.current = startOffset + (targetOffset - startOffset) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        currentLineRef.current = targetLine;
        verticalOffsetRef.current = targetOffset;
      }
      
      render();
    };
    
    animate();
  }, [render]);

  // Initialize canvas and layout
  useEffect(() => {
    if (isActive) {
      initializeCanvas();
      calculateWordLayouts();
      scheduleRender();
    }
  }, [isActive, initializeCanvas, calculateWordLayouts, scheduleRender]);

  // Update layout when words change
  useEffect(() => {
    if (isActive && words.length > 0) {
      calculateWordLayouts();
      if (!pendingRenderRef.current) {
        pendingRenderRef.current = true;
        scheduleRender();
      }
    }
  }, [isActive, words, calculateWordLayouts, scheduleRender]);

  // Handle active word/char changes
  useEffect(() => {
    if (isActive && activeWord < wordLayoutsRef.current.length) {
      const layout = wordLayoutsRef.current[activeWord];
      if (layout) {
        animateLineTransition(layout.line);
      }
      
      if (!pendingRenderRef.current) {
        pendingRenderRef.current = true;
        scheduleRender();
      }
    }
  }, [isActive, activeWord, activeChar, animateLineTransition, scheduleRender]);

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
          initializeCanvas();
          calculateWordLayouts();
          scheduleRender();
        }
      });
    });
    
    ro.observe(viewport);
    resizeObserver.current = ro;
    
    return () => {
      ro.disconnect();
      resizeObserver.current = null;
    };
  }, [isActive, initializeCanvas, calculateWordLayouts, scheduleRender]);

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
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
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
