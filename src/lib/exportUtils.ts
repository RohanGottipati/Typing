export interface ExportData {
  finalWPM: number;
  accuracy: number;
  totalBackspaces: number;
  wpmOverTime: number[];
  charactersPerSecond: number[];
  commonlyMistypedCharacters: { [key: string]: number };
  testStartTime: number;
  testEndTime: number;
  testDuration: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  textType: string;
  keystrokeLog: Array<{
    key: string;
    correct: boolean;
    timestamp: number;
    position: number;
  }>;
  // Behavioral metrics
  typingConsistencyScore: number;
  fatigueScore: number;
  reactionDelay: number;
  topErrorHotspots: { second: number; count: number }[];
  topBackspaceHotspots: { second: number; count: number }[];
  // Typing persona
  typingPersona: {
    name: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    traits: string[];
  };
  personaInsights: string[];
}

export const generateTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

export const exportToCSV = (data: ExportData): void => {
  const timestamp = generateTimestamp();
  const filename = `typing-session-${timestamp}.csv`;
  
  // Create CSV content
  let csvContent = 'Metric,Value\n';
  csvContent += `Final WPM,${data.finalWPM}\n`;
  csvContent += `Accuracy,${data.accuracy.toFixed(2)}%\n`;
  csvContent += `Total Backspaces,${data.totalBackspaces}\n`;
  csvContent += `Test Duration,${data.testDuration}s\n`;
  csvContent += `Total Characters,${data.totalCharacters}\n`;
  csvContent += `Correct Characters,${data.correctCharacters}\n`;
  csvContent += `Incorrect Characters,${data.incorrectCharacters}\n`;
  csvContent += `Text Type,${data.textType}\n`;
  csvContent += `Test Start Time,${new Date(data.testStartTime).toISOString()}\n`;
  csvContent += `Test End Time,${new Date(data.testEndTime).toISOString()}\n`;
  csvContent += `Typing Consistency Score,${data.typingConsistencyScore}\n`;
  csvContent += `Fatigue Score,${data.fatigueScore}\n`;
  csvContent += `Reaction Delay,${data.reactionDelay.toFixed(2)}s\n`;
  csvContent += `Typing Persona,${data.typingPersona.title}\n`;
  csvContent += `Persona Description,${data.typingPersona.description}\n`;
  csvContent += '\n';
  
  // WPM over time
  csvContent += 'Second,WPM\n';
  data.wpmOverTime.forEach((wpm, index) => {
    csvContent += `${index + 1},${wpm.toFixed(2)}\n`;
  });
  csvContent += '\n';
  
  // Characters per second (if available)
  if (data.charactersPerSecond.length > 0) {
    csvContent += 'Second,Characters Per Second\n';
    data.charactersPerSecond.forEach((cps, index) => {
      csvContent += `${index + 1},${cps.toFixed(2)}\n`;
    });
    csvContent += '\n';
  }
  
  // Commonly mistyped characters
  csvContent += 'Character,Mistake Count\n';
  Object.entries(data.commonlyMistypedCharacters)
    .sort(([,a], [,b]) => b - a)
    .forEach(([char, count]) => {
      csvContent += `"${char}",${count}\n`;
    });
  csvContent += '\n';
  
  // Error hotspots
  csvContent += 'Second,Error Count\n';
  data.topErrorHotspots.forEach(({ second, count }) => {
    csvContent += `${second},${count}\n`;
  });
  csvContent += '\n';
  
  // Backspace hotspots
  csvContent += 'Second,Backspace Count\n';
  data.topBackspaceHotspots.forEach(({ second, count }) => {
    csvContent += `${second},${count}\n`;
  });
  csvContent += '\n';
  
  // Persona traits
  csvContent += 'Persona Trait\n';
  data.typingPersona.traits.forEach(trait => {
    csvContent += `"${trait}"\n`;
  });
  csvContent += '\n';
  
  // Persona insights
  csvContent += 'Persona Insight\n';
  data.personaInsights.forEach(insight => {
    csvContent += `"${insight}"\n`;
  });
  csvContent += '\n';
  
  // Keystroke log
  csvContent += 'Timestamp,Key,Correct,Position\n';
  data.keystrokeLog.forEach(keystroke => {
    csvContent += `${keystroke.timestamp.toFixed(2)},"${keystroke.key}",${keystroke.correct},${keystroke.position}\n`;
  });
  
  // Download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: ExportData): void => {
  const timestamp = generateTimestamp();
  const filename = `typing-session-${timestamp}.json`;
  
  const jsonData = {
    sessionInfo: {
      timestamp: timestamp,
      testStartTime: new Date(data.testStartTime).toISOString(),
      testEndTime: new Date(data.testEndTime).toISOString(),
      testDuration: data.testDuration,
      textType: data.textType
    },
    results: {
      finalWPM: data.finalWPM,
      accuracy: data.accuracy,
      totalBackspaces: data.totalBackspaces,
      totalCharacters: data.totalCharacters,
      correctCharacters: data.correctCharacters,
      incorrectCharacters: data.incorrectCharacters
    },
    behavioralMetrics: {
      typingConsistencyScore: data.typingConsistencyScore,
      fatigueScore: data.fatigueScore,
      reactionDelay: data.reactionDelay,
      topErrorHotspots: data.topErrorHotspots,
      topBackspaceHotspots: data.topBackspaceHotspots
    },
    typingPersona: {
      name: data.typingPersona.name,
      title: data.typingPersona.title,
      description: data.typingPersona.description,
      icon: data.typingPersona.icon,
      color: data.typingPersona.color,
      traits: data.typingPersona.traits
    },
    personaInsights: data.personaInsights,
    wpmOverTime: data.wpmOverTime.map((wpm, index) => ({
      second: index + 1,
      wpm: parseFloat(wpm.toFixed(2))
    })),
    charactersPerSecond: data.charactersPerSecond.length > 0 ? 
      data.charactersPerSecond.map((cps, index) => ({
        second: index + 1,
        charactersPerSecond: parseFloat(cps.toFixed(2))
      })) : [],
    commonlyMistypedCharacters: data.commonlyMistypedCharacters,
    keystrokeLog: data.keystrokeLog
  };
  
  // Download the file
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const calculateCharactersPerSecond = (keystrokeLog: Array<{ timestamp: number; key: string }>, testDuration: number): number[] => {
  const charactersPerSecond: number[] = [];
  const testDurationSeconds = Math.floor(testDuration);
  
  for (let second = 1; second <= testDurationSeconds; second++) {
    const charactersInSecond = keystrokeLog.filter(
      keystroke => keystroke.key !== 'Backspace' && 
      keystroke.timestamp >= second - 1 && 
      keystroke.timestamp < second
    ).length;
    charactersPerSecond.push(charactersInSecond);
  }
  
  return charactersPerSecond;
};
