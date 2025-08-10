export interface TypingPersona {
  name: string;
  title: string;
  description: string;
  icon: string;
  traits: string[];
}

interface PersonaAnalysisData {
  finalWPM: number;
  accuracy: number;
  consistencyScore: number;
  fatigueScore: number;
  backspaceCount: number;
  reactionDelay: number;
  wpmOverTime: number[];
}

const PERSONAS: TypingPersona[] = [
  {
    name: 'sprinter',
    title: 'The Sprinter',
    description: 'Blazing fast but sometimes sacrifices precision for speed. You start strong but might lose steam.',
    icon: '🏃',
    traits: ['Fast Start', 'High Initial Speed', 'Variable Accuracy', 'Speed Over Precision']
  },
  {
    name: 'perfectionist',
    title: 'The Perfectionist',
    description: 'Methodical and precise. You prioritize accuracy over raw speed, making very few mistakes.',
    icon: '✨',
    traits: ['High Accuracy', 'Few Backspaces', 'Steady Pace', 'Quality Focus']
  },
  {
    name: 'recoverer',
    title: 'The Recoverer',
    description: 'Like a fine wine, you get better with time. Your speed and accuracy improve as you warm up.',
    icon: '📈',
    traits: ['Improving Speed', 'Learning Pattern', 'Strong Finish', 'Adaptable']
  },
  {
    name: 'hacker',
    title: 'The Hacker',
    description: 'Fast and furious! You type rapidly, make quick corrections, and keep pushing forward.',
    icon: '⚡',
    traits: ['Quick Corrections', 'High WPM', 'Aggressive Style', 'Recovery Speed']
  },
  {
    name: 'steady',
    title: 'The Steady Hand',
    description: 'Consistent and reliable. You maintain a stable pace with good accuracy throughout.',
    icon: '🎯',
    traits: ['High Consistency', 'Balanced Speed', 'Stable Performance', 'Reliable Pace']
  },
  {
    name: 'tactician',
    title: 'The Tactician',
    description: 'Strategic and methodical. You carefully plan each keystroke and learn from mistakes.',
    icon: '🧠',
    traits: ['Calculated Pace', 'Strategic Pauses', 'Learning Mindset', 'Thoughtful Approach']
  }
];

export function analyzeTypingPersona(data: PersonaAnalysisData): TypingPersona {
  // Calculate improvement ratio (end vs start)
  const firstQuarter = data.wpmOverTime.slice(0, Math.floor(data.wpmOverTime.length / 4));
  const lastQuarter = data.wpmOverTime.slice(Math.floor(data.wpmOverTime.length * 3 / 4));
  const startAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
  const endAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
  const improvementRatio = endAvg / startAvg;

  // Calculate backspace ratio
  const backspaceRatio = data.backspaceCount / (data.finalWPM * 5); // backspaces per word

  // Determine persona based on metrics
  if (data.accuracy >= 98 && data.consistencyScore >= 85 && backspaceRatio < 0.1) {
    return PERSONAS.find(p => p.name === 'perfectionist')!;
  }
  
  if (improvementRatio >= 1.2 && data.fatigueScore < 30) {
    return PERSONAS.find(p => p.name === 'recoverer')!;
  }
  
  if (backspaceRatio >= 0.2 && data.finalWPM >= 60 && improvementRatio >= 1) {
    return PERSONAS.find(p => p.name === 'hacker')!;
  }
  
  if (data.reactionDelay < 1 && data.fatigueScore >= 40 && data.finalWPM >= 70) {
    return PERSONAS.find(p => p.name === 'sprinter')!;
  }
  
  if (data.consistencyScore >= 80 && Math.abs(improvementRatio - 1) < 0.1) {
    return PERSONAS.find(p => p.name === 'steady')!;
  }
  
  // Default to tactician if no other clear pattern
  return PERSONAS.find(p => p.name === 'tactician')!;
}

export function getPersonaInsights(persona: TypingPersona, data: PersonaAnalysisData): string[] {
  const insights: string[] = [];
  
  switch (persona.name) {
    case 'sprinter':
      insights.push('Try to maintain your initial speed throughout the test');
      insights.push('Focus on consistency over raw speed');
      if (data.accuracy < 95) {
        insights.push('Consider slowing down slightly to improve accuracy');
      }
      break;
      
    case 'perfectionist':
      insights.push('Your accuracy is impressive - now try gradually increasing your speed');
      insights.push('Practice with slightly faster typing to find your speed sweet spot');
      break;
      
    case 'recoverer':
      insights.push('Try some warm-up exercises before important typing tasks');
      insights.push('Your ability to improve during the test shows great potential');
      break;
      
    case 'hacker':
      insights.push('Your quick correction style is effective but may be costing you time');
      insights.push('Try to reduce initial errors while maintaining your quick recovery');
      break;
      
    case 'steady':
      insights.push('Your consistent performance is a great foundation');
      insights.push('Try pushing your speed in short bursts to find your limits');
      break;
      
    case 'tactician':
      insights.push('Your methodical approach shows good potential');
      insights.push('Try to balance planning with more fluid typing');
      break;
  }
  
  // Add general insights based on metrics
  if (data.fatigueScore > 40) {
    insights.push('Consider taking short breaks between long typing sessions');
  }
  if (data.consistencyScore < 60) {
    insights.push('Focus on maintaining a steady rhythm while typing');
  }
  
  return insights;
}