import { KeystrokeData } from '@/components/TypingTest';

interface BehavioralMetrics {
  typingConsistencyScore: number;
  fatigueScore: number; // Keep for backward compatibility but always return 0
  reactionDelay: number;
  topErrorHotspots: { second: number; count: number }[];
  topBackspaceHotspots: { second: number; count: number }[];
}

export function calculateBehavioralMetrics(
  keystrokes: KeystrokeData[],
  wpmOverTime: number[],
  testDuration: number,
  reactionDelay?: number
): BehavioralMetrics {
  // Calculate typing consistency (standard deviation of WPM)
  let typingConsistencyScore = 50; // Default fallback
  if (wpmOverTime.length > 1) {
    const avgWPM = wpmOverTime.reduce((sum, wpm) => sum + wpm, 0) / wpmOverTime.length;
    if (avgWPM > 0) {
      const variance = wpmOverTime.reduce((sum, wpm) => sum + Math.pow(wpm - avgWPM, 2), 0) / wpmOverTime.length;
      const stdDev = Math.sqrt(variance);
      // Improved consistency calculation: lower stdDev relative to average WPM = higher consistency
      const consistencyRatio = stdDev / avgWPM;
      // Convert to 0-100 score where higher is better consistency
      typingConsistencyScore = Math.max(0, Math.min(100, 100 - (consistencyRatio * 50)));
    }
  }

  // Fatigue score removed entirely - always return 0
  const fatigueScore = 0;

  // Use provided reaction delay or calculate from keystrokes
  let finalReactionDelay = reactionDelay || 0;
  if (!reactionDelay && keystrokes.length > 0) {
    const firstKeystroke = keystrokes.find(k => k.key !== 'Backspace');
    if (firstKeystroke) {
      // Convert timestamp to seconds and ensure it's reasonable
      finalReactionDelay = Math.min(firstKeystroke.timestamp, 10); // Cap at 10 seconds
    }
  }

  // Calculate error and backspace hotspots
  const errorsBySecond = new Map<number, number>();
  const backspacesBySecond = new Map<number, number>();

  keystrokes.forEach(keystroke => {
    const second = Math.floor(keystroke.timestamp / 1000); // Convert to seconds
    if (keystroke.key === 'Backspace') {
      backspacesBySecond.set(second, (backspacesBySecond.get(second) || 0) + 1);
    } else if (!keystroke.correct) {
      errorsBySecond.set(second, (errorsBySecond.get(second) || 0) + 1);
    }
  });

  // Convert to sorted arrays of hotspots
  const topErrorHotspots = Array.from(errorsBySecond.entries())
    .map(([second, count]) => ({ second, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topBackspaceHotspots = Array.from(backspacesBySecond.entries())
    .map(([second, count]) => ({ second, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Ensure all values are valid numbers
  const finalConsistencyScore = isNaN(typingConsistencyScore) || !isFinite(typingConsistencyScore) ? 50 : typingConsistencyScore;
  const validatedReactionDelay = isNaN(finalReactionDelay) || !isFinite(finalReactionDelay) ? 0 : finalReactionDelay;

  return {
    typingConsistencyScore: finalConsistencyScore,
    fatigueScore: 0, // Always return 0
    reactionDelay: validatedReactionDelay,
    topErrorHotspots,
    topBackspaceHotspots
  };
}