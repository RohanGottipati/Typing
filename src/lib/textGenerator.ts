// Text generation system with support for numbers and punctuation
export interface TextGeneratorOptions {
  includeNumbers: boolean;
  includePunctuation: boolean;
  targetWordCount?: number;
  streaming?: boolean;
}

// Number patterns for natural integration
const numberPatterns = [
  // Counts and quantities
  { pattern: "There were {num} {item} today", items: ["goals", "files", "messages", "tasks", "projects", "meetings"] },
  { pattern: "We finished {num} {item} in {num} minutes", items: ["levels", "chapters", "sections", "rounds", "games"] },
  { pattern: "I saved {num} files and deleted {num}", items: [] },
  { pattern: "The team won {num}–{num}", items: [] },
  { pattern: "Room {num} is on floor {num}", items: [] },
  { pattern: "The score ended {num}–{num}", items: [] },
  { pattern: "Prices jumped from ${num} to ${num}", items: [] },
  { pattern: "The project took {num} months with {num} people", items: [] },
  { pattern: "She scored {num}% on the test", items: [] },
  { pattern: "The company grew from {num} to {num} employees", items: [] },
  { pattern: "The recipe calls for {num} cups of flour", items: [] },
  { pattern: "We processed {num} requests in {num} seconds", items: [] },
  { pattern: "The game lasted {num} hours and {num} minutes", items: [] },
  { pattern: "There are {num} days left until the deadline", items: [] },
  { pattern: "The building has {num} floors and {num} elevators", items: [] }
];

// Regular sentences without numbers
const regularSentences = [
  "The quick brown fox jumps over the lazy dog",
  "Programming is the art of telling another human being what one wants the computer to do",
  "Success is not final failure is not fatal it is the courage to continue that counts",
  "The only way to do great work is to love what you do",
  "Innovation distinguishes between a leader and a follower",
  "Life is what happens when you are busy making other plans",
  "The future belongs to those who believe in the beauty of their dreams",
  "Education is the most powerful weapon which you can use to change the world",
  "The best way to predict the future is to invent it",
  "Simplicity is the ultimate sophistication",
  "Quality is not an act it is a habit",
  "The journey of a thousand miles begins with one step",
  "Knowledge is power but enthusiasm pulls the switch",
  "Creativity is intelligence having fun",
  "The only limit to our realization of tomorrow is our doubts of today",
  "Technology continues to evolve rapidly",
  "The project was completed successfully with team collaboration",
  "She performed exceptionally well and finished in first place",
  "The company experienced significant growth over the years",
  "The recipe calls for flour sugar and eggs",
  "We processed many requests efficiently",
  "The game lasted several hours",
  "There are many days left until the deadline",
  "The building has multiple floors and elevators"
];

// Number generation functions
const generateNumber = (): string => {
  const types = [
    // Simple integers (most common)
    () => Math.floor(Math.random() * 100 + 1).toString(),
    // Small integers
    () => Math.floor(Math.random() * 20 + 1).toString(),
    // Decimal numbers
    () => (Math.random() * 10 + 1).toFixed(1),
    // Formatted prices
    () => `$${(Math.random() * 50 + 5).toFixed(2)}`,
    // Percentages
    () => `${Math.floor(Math.random() * 40 + 60)}%`,
    // Time formats
    () => `${Math.floor(Math.random() * 12 + 1)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    // Years
    () => `${Math.floor(Math.random() * 10 + 2020)}`,
    // Room numbers
    () => `${Math.floor(Math.random() * 9 + 1)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
  ];
  
  const typeIndex = Math.floor(Math.random() * types.length);
  return types[typeIndex]();
};

const generateNumberPattern = (): string => {
  const pattern = numberPatterns[Math.floor(Math.random() * numberPatterns.length)];
  let text = pattern.pattern;
  
  // Replace {num} placeholders with actual numbers
  const numMatches = text.match(/\{num\}/g);
  if (numMatches) {
    numMatches.forEach(() => {
      text = text.replace('{num}', generateNumber());
    });
  }
  
  // Replace {item} placeholder if present
  if (text.includes('{item}') && pattern.items.length > 0) {
    const item = pattern.items[Math.floor(Math.random() * pattern.items.length)];
    text = text.replace('{item}', item);
  }
  
  return text;
};

// Punctuation and casing functions
const addPunctuation = (text: string): string => {
  const sentences = text.split(/\s+/);
  const punctuatedSentences: string[] = [];
  
  sentences.forEach((sentence, index) => {
    let processed = sentence.trim();
    if (processed.length === 0) return;
    
    // Capitalize first letter
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    
    // Add ending punctuation
    const punctuationChoices = ['.', '!', '?'];
    const punctuation = punctuationChoices[Math.floor(Math.random() * punctuationChoices.length)];
    processed += punctuation;
    
    // Occasionally add commas or semicolons in the middle
    if (processed.length > 20 && Math.random() < 0.3) {
      const words = processed.split(' ');
      if (words.length > 5) {
        const insertIndex = Math.floor(words.length / 2);
        words.splice(insertIndex, 0, ',');
        processed = words.join(' ');
      }
    }
    
    punctuatedSentences.push(processed);
  });
  
  return punctuatedSentences.join(' ');
};

// Main text generation function
export const generateText = (options: TextGeneratorOptions): string => {
  console.log('🔧 generateText called with options:', options);
  
  const { includeNumbers, includePunctuation, targetWordCount, streaming } = options;
  
  let sentences: string[] = [];
  
  if (includeNumbers) {
    // Generate sentences with numbers (at least 30% should have numbers)
    const numWithNumbers = Math.max(1, Math.floor((targetWordCount || 25) * 0.3));
    const numRegular = (targetWordCount || 25) - numWithNumbers;
    
    console.log('🔧 Generating sentences with numbers:', { numWithNumbers, numRegular });
    
    // Add number sentences
    for (let i = 0; i < numWithNumbers; i++) {
      const numberSentence = generateNumberPattern();
      console.log(`🔧 Generated number sentence ${i + 1}:`, numberSentence);
      sentences.push(numberSentence);
    }
    
    // Add regular sentences
    for (let i = 0; i < numRegular; i++) {
      const sentence = regularSentences[Math.floor(Math.random() * regularSentences.length)];
      console.log(`🔧 Generated regular sentence ${i + 1}:`, sentence);
      sentences.push(sentence);
    }
  } else {
    // Generate only regular sentences
    console.log('🔧 Generating only regular sentences, count:', targetWordCount || 25);
    for (let i = 0; i < (targetWordCount || 25); i++) {
      const sentence = regularSentences[Math.floor(Math.random() * regularSentences.length)];
      console.log(`🔧 Generated sentence ${i + 1}:`, sentence);
      sentences.push(sentence);
    }
  }
  
  // Shuffle sentences for variety
  sentences = sentences.sort(() => Math.random() - 0.5);
  
  // Join sentences
  let text = sentences.join(' ');
  
  console.log('🔧 Joined text before punctuation:', text);
  
  // Apply punctuation if requested
  if (includePunctuation) {
    text = addPunctuation(text);
    console.log('🔧 Text after punctuation:', text);
  }
  
  // For streaming mode, ensure we have enough text
  if (streaming) {
    console.log('🔧 Streaming mode: Ensuring minimum text length');
    while (text.length < 500) {
      const additionalSentence = includeNumbers ? 
        generateNumberPattern() : 
        regularSentences[Math.floor(Math.random() * regularSentences.length)];
      
      if (includePunctuation) {
        text += ' ' + addPunctuation(additionalSentence);
      } else {
        text += ' ' + additionalSentence;
      }
    }
    console.log('🔧 Streaming mode: Final text length:', text.length);
  }
  
  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  // Ensure we have some content
  if (!text || text.length === 0) {
    console.warn('⚠️ generateText: Empty text generated, using fallback');
    text = "The quick brown fox jumps over the lazy dog";
    if (includePunctuation) {
      text = addPunctuation(text);
    }
  }
  
  console.log('🔧 generateText final result:', { text, length: text.length });
  return text;
};

// Function to generate exactly N words
export const generateExactWordCount = (wordCount: number, options: TextGeneratorOptions): string => {
  console.log('🔧 generateExactWordCount called:', { wordCount, options });
  
  const { includeNumbers, includePunctuation } = options;
  
  let words: string[] = [];
  
  if (includeNumbers) {
    // Mix number patterns and regular sentences
    const numWithNumbers = Math.max(1, Math.floor(wordCount * 0.3));
    const numRegular = wordCount - numWithNumbers;
    
    console.log('🔧 Generating words with numbers:', { numWithNumbers, numRegular });
    
    // Generate number sentences
    for (let i = 0; i < numWithNumbers; i++) {
      const pattern = generateNumberPattern();
      const patternWords = pattern.split(/\s+/).filter(word => word.length > 0);
      console.log(`🔧 Number pattern ${i + 1}:`, pattern, 'Words:', patternWords);
      words.push(...patternWords);
    }
    
    // Generate regular sentences
    for (let i = 0; i < numRegular; i++) {
      const sentence = regularSentences[Math.floor(Math.random() * regularSentences.length)];
      const sentenceWords = sentence.split(/\s+/).filter(word => word.length > 0);
      console.log(`🔧 Regular sentence ${i + 1}:`, sentence, 'Words:', sentenceWords);
      words.push(...sentenceWords);
    }
  } else {
    // Generate only regular sentences
    console.log('🔧 Generating only regular sentences for words');
    for (let i = 0; i < wordCount; i++) {
      const sentence = regularSentences[Math.floor(Math.random() * regularSentences.length)];
      const sentenceWords = sentence.split(/\s+/).filter(word => word.length > 0);
      console.log(`🔧 Sentence ${i + 1}:`, sentence, 'Words:', sentenceWords);
      words.push(...sentenceWords);
    }
  }
  
  console.log('🔧 All collected words:', words);
  
  // Take exactly the requested number of words
  const finalWords = words.slice(0, wordCount);
  console.log('🔧 Final words (truncated to', wordCount, '):', finalWords);
  
  // Join words into text
  let text = finalWords.join(' ');
  
  console.log('🔧 Joined text before punctuation:', text);
  
  // Apply punctuation if requested
  if (includePunctuation) {
    text = addPunctuation(text);
    console.log('🔧 Text after punctuation:', text);
  }
  
  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  // Ensure we have some content
  if (!text || text.length === 0) {
    console.warn('⚠️ generateExactWordCount: Empty text generated, using fallback');
    text = "The quick brown fox jumps over the lazy dog";
    if (includePunctuation) {
      text = addPunctuation(text);
    }
  }
  
  console.log('🔧 generateExactWordCount final result:', { text, length: text.length, wordCount: text.split(/\s+/).length });
  return text;
};

// Function to process existing text based on toggles
export const processExistingText = (text: string, options: TextGeneratorOptions): string => {
  const { includeNumbers, includePunctuation } = options;
  let processedText = text;
  
  if (!includePunctuation) {
    // Remove punctuation but keep basic structure
    processedText = processedText.replace(/[.,!?;:'"()]/g, '');
  }
  
  if (!includeNumbers) {
    // Remove numbers
    processedText = processedText.replace(/\d+/g, '');
  }
  
  // Clean up extra spaces
  processedText = processedText.replace(/\s+/g, ' ').trim();
  
  return processedText;
};
