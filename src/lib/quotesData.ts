export interface Quote {
  text: string;
  author: string;
}

export const famousQuotes: Quote[] = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha"
  },
  {
    text: "The best way to predict the future is to invent it.",
    author: "Alan Kay"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown"
  },
  {
    text: "Dream big and dare to fail.",
    author: "Norman Vaughan"
  }
];

export function getRandomQuote(): Quote {
  console.log('💬 getRandomQuote called');
  console.log('💬 Available quotes count:', famousQuotes.length);
  
  const randomIndex = Math.floor(Math.random() * famousQuotes.length);
  const selectedQuote = famousQuotes[randomIndex];
  
  console.log('💬 Selected quote:', {
    index: randomIndex,
    quote: selectedQuote,
    textLength: selectedQuote.text?.length || 0
  });
  
  // Guard against invalid quotes
  if (!selectedQuote || !selectedQuote.text || selectedQuote.text.trim().length === 0) {
    console.warn('⚠️ getRandomQuote: Invalid quote selected, using fallback');
    return {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs"
    };
  }
  
  return selectedQuote;
}
