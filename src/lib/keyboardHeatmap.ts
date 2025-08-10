// Keyboard Heatmap Data Processing and Layout Configuration

// Key mapping rules for shifted symbols -> base keys
// This ensures consistent mapping of shifted characters to their base key IDs
const KEY_MAPPING: { [key: string]: string } = {
  // Shifted symbols mapped to base keys
  '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
  '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
  '_': 'Minus', '+': 'Equal', '{': 'BracketLeft', '}': 'BracketRight',
  '|': 'Backslash', ':': 'Semicolon', '"': 'Quote', '<': 'Comma', '>': 'Period',
  '?': 'Slash', '~': 'Backquote'
};

// ANSI Keyboard Layout Configuration
// Each row contains: [keyId, displayLabel, columnSpan]
export const KEYBOARD_LAYOUT = [
  // Row 1: Function keys and numbers
  [
    ['Escape', 'Esc', 1], ['F1', 'F1', 1], ['F2', 'F2', 1], ['F3', 'F3', 1], ['F4', 'F4', 1],
    ['F5', 'F5', 1], ['F6', 'F6', 1], ['F7', 'F7', 1], ['F8', 'F8', 1], ['F9', 'F9', 1],
    ['F10', 'F10', 1], ['F11', 'F11', 1], ['F12', 'F12', 1]
  ],
  // Row 2: Numbers and symbols
  [
    ['Backquote', '`', 1], ['Digit1', '1', 1], ['Digit2', '2', 1], ['Digit3', '3', 1], ['Digit4', '4', 1],
    ['Digit5', '5', 1], ['Digit6', '6', 1], ['Digit7', '7', 1], ['Digit8', '8', 1], ['Digit9', '9', 1],
    ['Digit0', '0', 1], ['Minus', '-', 1], ['Equal', '=', 1], ['Backspace', '⌫', 2]
  ],
  // Row 3: QWERTY row
  [
    ['Tab', 'Tab', 1.5], ['KeyQ', 'Q', 1], ['KeyW', 'W', 1], ['KeyE', 'E', 1], ['KeyR', 'R', 1],
    ['KeyT', 'T', 1], ['KeyY', 'Y', 1], ['KeyU', 'U', 1], ['KeyI', 'I', 1], ['KeyO', 'O', 1],
    ['KeyP', 'P', 1], ['BracketLeft', '[', 1], ['BracketRight', ']', 1], ['Backslash', '\\', 1.5]
  ],
  // Row 4: ASDF row
  [
    ['CapsLock', 'Caps', 1.75], ['KeyA', 'A', 1], ['KeyS', 'S', 1], ['KeyD', 'D', 1], ['KeyF', 'F', 1],
    ['KeyG', 'G', 1], ['KeyH', 'H', 1], ['KeyJ', 'J', 1], ['KeyK', 'K', 1], ['KeyL', 'L', 1],
    ['Semicolon', ';', 1], ['Quote', "'", 1], ['Enter', '↵', 2.25]
  ],
  // Row 5: ZXCV row
  [
    ['ShiftLeft', '⇧', 2.25], ['KeyZ', 'Z', 1], ['KeyX', 'X', 1], ['KeyC', 'C', 1], ['KeyV', 'V', 1],
    ['KeyB', 'B', 1], ['KeyN', 'N', 1], ['KeyM', 'M', 1], ['Comma', ',', 1], ['Period', '.', 1],
    ['Slash', '/', 1], ['ShiftRight', '⇧', 2.25]
  ],
  // Row 6: Bottom row
  [
    ['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', '⌘', 1.25], ['AltLeft', 'Alt', 1.25], ['Space', 'Space', 6.25],
    ['AltRight', 'Alt', 1.25], ['MetaRight', '⌘', 1.25], ['ControlRight', 'Ctrl', 1.25]
  ]
];

// Get all valid key IDs from the layout
export const VALID_KEY_IDS = new Set(
  KEYBOARD_LAYOUT.flat().map(([keyId]) => keyId)
);

// Normalize a character to its base key ID
export function normalizeToKeyId(char: string): string {
  // Handle shifted symbols
  if (KEY_MAPPING[char]) {
    return KEY_MAPPING[char];
  }
  
  // Handle regular characters
  const lowerChar = char.toLowerCase();
  
  // Map single characters to key IDs
  if (lowerChar >= 'a' && lowerChar <= 'z') {
    return `Key${lowerChar.toUpperCase()}`;
  }
  
  if (lowerChar >= '0' && lowerChar <= '9') {
    return `Digit${lowerChar}`;
  }
  
  // Map common symbols
  const symbolMap: { [key: string]: string } = {
    ' ': 'Space',
    '-': 'Minus',
    '=': 'Equal',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash',
    '`': 'Backquote'
  };
  
  return symbolMap[lowerChar] || 'Unknown';
}

// Interface for keystroke data
export interface KeystrokeData {
  keyId: string;
  timestamp: number;
  correct: boolean;
  latency?: number;
}

// Interface for aggregated key statistics
export interface KeyStats {
  keyId: string;
  presses: number;
  errors: number;
  errorRate: number;
  avgLatency?: number;
}

// Interface for session data
export interface SessionData {
  id: string;
  keystrokeLog: KeystrokeData[];
  timestamp: string;
  mode: string;
}

// Aggregate keystroke data into key statistics
export function aggregateKeyStats(sessions: SessionData[]): KeyStats[] {
  const keyStatsMap: { [keyId: string]: KeyStats } = {};
  
  // Initialize all valid keys with zero stats
  VALID_KEY_IDS.forEach(keyId => {
    keyStatsMap[keyId] = {
      keyId,
      presses: 0,
      errors: 0,
      errorRate: 0,
      avgLatency: 0
    };
  });
  
  // Process all keystrokes from filtered sessions
  sessions.forEach(session => {
    session.keystrokeLog.forEach(keystroke => {
      const normalizedKeyId = normalizeToKeyId(keystroke.keyId);
      
      // Skip if key ID is not in our layout
      if (!VALID_KEY_IDS.has(normalizedKeyId)) {
        console.warn(`Unknown key ID: ${keystroke.keyId} -> ${normalizedKeyId}`);
        return;
      }
      
      const stats = keyStatsMap[normalizedKeyId];
      stats.presses++;
      
      if (!keystroke.correct) {
        stats.errors++;
      }
      
      // Update average latency
      if (keystroke.latency !== undefined) {
        if (stats.avgLatency === 0) {
          stats.avgLatency = keystroke.latency;
        } else {
          stats.avgLatency = (stats.avgLatency * (stats.presses - 1) + keystroke.latency) / stats.presses;
        }
      }
    });
  });
  
  // Calculate error rates and handle edge cases
  Object.values(keyStatsMap).forEach(stats => {
    if (stats.presses === 0) {
      stats.errorRate = 0;
      stats.avgLatency = 0;
    } else {
      stats.errorRate = Math.round((stats.errors / stats.presses) * 1000) / 1000; // Round to 3 decimals
    }
  });
  
  return Object.values(keyStatsMap);
}

// Calculate color scale for error rates
export function getErrorRateColor(errorRate: number): string {
  // Clamp error rate to [0, 0.5] for color scale
  const clampedRate = Math.min(Math.max(errorRate, 0), 0.5);
  
  // Create a continuous color scale from cool to hot
  if (clampedRate === 0) return 'bg-gray-800'; // No errors
  
  // Calculate color intensity (0 = cool, 1 = hot)
  const intensity = clampedRate / 0.5;
  
  if (intensity <= 0.25) return 'bg-blue-500';
  if (intensity <= 0.5) return 'bg-yellow-500';
  if (intensity <= 0.75) return 'bg-orange-500';
  return 'bg-red-600';
}

// Get color scale legend data
export function getColorScaleLegend() {
  return [
    { rate: 0, label: '0%', color: 'bg-gray-800' },
    { rate: 0.125, label: '12.5%', color: 'bg-blue-500' },
    { rate: 0.25, label: '25%', color: 'bg-yellow-500' },
    { rate: 0.375, label: '37.5%', color: 'bg-orange-500' },
    { rate: 0.5, label: '50%+', color: 'bg-red-600' }
  ];
}
