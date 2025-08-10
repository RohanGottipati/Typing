interface SummaryData {
  wpm: number;
  accuracy: number;
  backspaces: number;
  wpmOverTime: number[];
  consistencyScore: number;
  fatigueScore?: number;
  reactionDelay?: number;
}

export function generateResultsSummary(data: SummaryData): string {
  const { wpm, accuracy, backspaces, wpmOverTime, consistencyScore, fatigueScore = 0, reactionDelay = 0 } = data;
  
  // Calculate additional metrics
  const totalCharacters = wpm * 5 * (wpmOverTime.length / 60); // Approximate
  const backspaceRate = totalCharacters > 0 ? (backspaces / totalCharacters) * 100 : 0;
  const hasWpmData = wpmOverTime.length >= 3;
  
  // Determine performance level
  const getPerformanceLevel = () => {
    if (wpm >= 80 && accuracy >= 95) return 'elite';
    if (wpm >= 60 && accuracy >= 90) return 'advanced';
    if (wpm >= 40 && accuracy >= 85) return 'intermediate';
    if (wpm >= 20 && accuracy >= 80) return 'beginner';
    return 'developing';
  };
  
  const performanceLevel = getPerformanceLevel();
  
  // Generate personalized feedback
  let feedback = '';
  
  // Opening statement based on performance level
  switch (performanceLevel) {
    case 'elite':
      feedback += `🔥 Outstanding performance! You're typing at an elite level with ${wpm} WPM and ${accuracy.toFixed(1)}% accuracy. `;
      break;
    case 'advanced':
      feedback += `🚀 Excellent work! Your ${wpm} WPM and ${accuracy.toFixed(1)}% accuracy show advanced typing skills. `;
      break;
    case 'intermediate':
      feedback += `✨ Solid performance! At ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy, you're building strong typing fundamentals. `;
      break;
    case 'beginner':
      feedback += `💪 Good start! Your ${wpm} WPM and ${accuracy.toFixed(1)}% accuracy show you're on the right track. `;
      break;
    default:
      feedback += `🌱 Keep practicing! Your ${wpm} WPM and ${accuracy.toFixed(1)}% accuracy indicate areas for growth. `;
  }
  
  // Speed-specific feedback
  if (wpm >= 80) {
    feedback += `Your speed is exceptional - you're typing faster than 95% of people! `;
  } else if (wpm >= 60) {
    feedback += `Your speed is above average and shows good typing proficiency. `;
  } else if (wpm >= 40) {
    feedback += `Your speed is solid for regular typing tasks. `;
  } else if (wpm >= 20) {
    feedback += `Focus on building speed gradually while maintaining accuracy. `;
  } else {
    feedback += `Speed will come with practice - focus on accuracy first. `;
  }
  
  // Accuracy-specific feedback
  if (accuracy >= 98) {
    feedback += `Your accuracy is nearly perfect - outstanding precision! `;
  } else if (accuracy >= 95) {
    feedback += `Your accuracy is excellent and shows great attention to detail. `;
  } else if (accuracy >= 90) {
    feedback += `Your accuracy is good, with room for improvement. `;
  } else if (accuracy >= 80) {
    feedback += `Your accuracy needs work - try typing slower to build precision. `;
  } else {
    feedback += `Your accuracy requires significant improvement - prioritize precision over speed. `;
  }
  
  // Backspace analysis
  if (backspaceRate <= 2) {
    feedback += `Your minimal backspace usage (${backspaces} times) shows confident, deliberate typing. `;
  } else if (backspaceRate <= 5) {
    feedback += `Your reasonable backspace usage (${backspaces} times) indicates good self-correction habits. `;
  } else if (backspaceRate <= 10) {
    feedback += `Your frequent backspace usage (${backspaces} times) suggests you could benefit from thinking before typing. `;
  } else {
    feedback += `Your high backspace usage (${backspaces} times) indicates a need to slow down and focus on accuracy. `;
  }
  
  // Consistency analysis
  if (consistencyScore >= 85) {
    feedback += `Your typing rhythm is remarkably consistent - excellent pacing! `;
  } else if (consistencyScore >= 70) {
    feedback += `Your typing shows good consistency with minor variations. `;
  } else if (consistencyScore >= 50) {
    feedback += `Your typing rhythm varies somewhat - work on maintaining steady pace. `;
  } else {
    feedback += `Your typing rhythm is inconsistent - practice maintaining steady speed. `;
  }
  
  // Fatigue analysis removed - no longer relevant
  
  // WPM progression analysis
  if (hasWpmData) {
    const firstThird = wpmOverTime.slice(0, Math.floor(wpmOverTime.length / 3));
    const lastThird = wpmOverTime.slice(Math.floor(wpmOverTime.length * 2 / 3));
    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    
    if (lastAvg > firstAvg * 1.15) {
      feedback += `You warmed up beautifully and improved significantly as the test progressed. `;
    } else if (lastAvg > firstAvg * 1.05) {
      feedback += `You showed steady improvement throughout the session. `;
    } else if (lastAvg < firstAvg * 0.85) {
      feedback += `Your speed declined in the latter half - focus on maintaining pace. `;
    } else {
      feedback += `You maintained consistent speed throughout the test. `;
    }
  }
  
  // Reaction time analysis
  if (reactionDelay <= 0.5) {
    feedback += `You started typing immediately - excellent readiness! `;
  } else if (reactionDelay <= 1.5) {
    feedback += `You started typing quickly - good responsiveness. `;
  } else if (reactionDelay <= 3) {
    feedback += `You took a moment to start - try to begin typing immediately. `;
  } else {
    feedback += `You had a slow start - work on beginning to type right away. `;
  }
  
  // Closing motivational statement
  if (performanceLevel === 'elite') {
    feedback += `You're already at an elite level - keep pushing your limits!`;
  } else if (performanceLevel === 'advanced') {
    feedback += `You're very close to elite level - focus on those final improvements!`;
  } else if (performanceLevel === 'intermediate') {
    feedback += `You're making great progress - keep practicing to reach advanced levels!`;
  } else if (performanceLevel === 'beginner') {
    feedback += `You're building a solid foundation - consistency will lead to improvement!`;
  } else {
    feedback += `Every practice session brings improvement - keep going!`;
  }
  
  return feedback;
}
