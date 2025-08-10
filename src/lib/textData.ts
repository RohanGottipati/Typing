// Typing test paragraphs categorized by type
export interface TextParagraph {
  id: string;
  text: string;
  category: 'sentences' | 'quotes' | 'code';
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Natural sentences for typing practice
export const sentenceParagraphs: TextParagraph[] = [
  {
    id: 'sentences-1',
    category: 'sentences',
    text: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. Pangrams are often used to display font samples and test keyboards. They provide a comprehensive way to showcase typography and ensure all characters are working properly."
  },
  {
    id: 'sentences-2',
    category: 'sentences',
    text: "All work and no play makes Jack a dull boy. This famous phrase emphasizes the importance of balance in life. Too much focus on work without recreation can lead to burnout and decreased productivity. Finding the right balance between work and leisure is essential for maintaining mental health and overall well-being."
  },
  {
    id: 'sentences-3',
    category: 'sentences',
    text: "A journey of a thousand miles begins with a single step. This ancient proverb reminds us that every great achievement starts with a small action. Whether you're learning a new skill, starting a business, or pursuing a dream, the key is to take that first step. Progress comes from consistent effort over time."
  },
  {
    id: 'sentences-4',
    category: 'sentences',
    text: "Practice makes perfect when it comes to typing skills. Regular practice helps develop muscle memory and improves accuracy. The more you type, the more comfortable and efficient you become. Consistent practice is the foundation of mastery in any skill, including typing."
  },
  {
    id: 'sentences-5',
    category: 'sentences',
    text: "The early bird catches the worm in the morning. This saying highlights the benefits of starting your day early and being proactive. Early risers often have more time to plan, exercise, and accomplish their goals. Developing good morning habits can significantly improve productivity and life satisfaction."
  },
  {
    id: 'sentences-6',
    category: 'sentences',
    text: "Actions speak louder than words in most situations. What people do is more important than what they say. This principle applies to relationships, business, and personal development. Demonstrating your values through actions builds trust and credibility more effectively than promises alone."
  },
  {
    id: 'sentences-7',
    category: 'sentences',
    text: "Beauty is in the eye of the beholder they say. This phrase reminds us that perceptions of beauty are subjective and personal. What one person finds beautiful, another might not. This concept applies not just to physical appearance, but to art, music, literature, and all forms of creative expression."
  },
  {
    id: 'sentences-8',
    category: 'sentences',
    text: "Curiosity killed the cat but satisfaction brought it back. This playful variation on the original saying emphasizes that while curiosity can lead to trouble, the satisfaction of learning and discovery makes it worthwhile. Curiosity drives innovation, learning, and personal growth throughout our lives."
  }
];

// Famous quotes for typing practice
export const quoteParagraphs: TextParagraph[] = [
  {
    id: 'quotes-1',
    category: 'quotes',
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. As with all matters of the heart, you'll know when you find it. And, like any great relationship, it just gets better and better as the years roll on."
  },
  {
    id: 'quotes-2',
    category: 'quotes',
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts. The important thing is not to stop questioning. Curiosity has its own reason for existence. One cannot help but be in awe when he contemplates the mysteries of eternity, of life, of the marvelous structure of reality."
  },
  {
    id: 'quotes-3',
    category: 'quotes',
    text: "The future belongs to those who believe in the beauty of their dreams. Eleanor Roosevelt once said that the future belongs to those who believe in the beauty of their dreams. This powerful statement encourages us to hold onto our aspirations and work towards making them a reality."
  },
  {
    id: 'quotes-4',
    category: 'quotes',
    text: "In the middle of difficulty lies opportunity. Albert Einstein understood that challenges often present the best chances for growth and innovation. When faced with obstacles, we have the opportunity to develop new skills, find creative solutions, and emerge stronger than before."
  },
  {
    id: 'quotes-5',
    category: 'quotes',
    text: "The best way to predict the future is to invent it. Alan Kay's famous words remind us that we have the power to shape our own destiny through our actions and decisions. Rather than waiting for things to happen, we can take initiative and create the future we want to see."
  },
  {
    id: 'quotes-6',
    category: 'quotes',
    text: "Life is what happens when you're busy making plans. John Lennon captured the essence of how life often unfolds differently than we expect. While planning is important, we must also remain flexible and open to the unexpected opportunities and challenges that come our way."
  }
];

// Programming code snippets for typing practice
export const codeParagraphs: TextParagraph[] = [
  {
    id: 'code-1',
    category: 'code',
    text: "function calculateFibonacci(n) { if (n <= 1) return n; return calculateFibonacci(n - 1) + calculateFibonacci(n - 2); } const result = calculateFibonacci(10); console.log('Fibonacci number:', result);"
  },
  {
    id: 'code-2',
    category: 'code',
    text: "const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; const doubled = numbers.map(x => x * 2); const evenNumbers = numbers.filter(x => x % 2 === 0); const sum = numbers.reduce((total, num) => total + num, 0);"
  },
  {
    id: 'code-3',
    category: 'code',
    text: "class User { constructor(name, email) { this.name = name; this.email = email; } getInfo() { return `${this.name} (${this.email})`; } } const user = new User('John Doe', 'john@example.com');"
  },
  {
    id: 'code-4',
    category: 'code',
    text: "async function fetchUserData(userId) { try { const response = await fetch(`/api/users/${userId}`); const userData = await response.json(); return userData; } catch (error) { console.error('Error fetching user:', error); throw error; } }"
  },
  {
    id: 'code-5',
    category: 'code',
    text: "const fruits = ['apple', 'banana', 'orange', 'grape']; fruits.push('mango'); fruits.splice(1, 1); const fruitString = fruits.join(', '); const hasApple = fruits.includes('apple');"
  },
  {
    id: 'code-6',
    category: 'code',
    text: "const timeout = setTimeout(() => { console.log('Operation completed'); }, 1000); const interval = setInterval(() => { counter++; if (counter >= 10) clearInterval(interval); }, 100);"
  }
];

// Combined array of all paragraphs
export const allParagraphs: TextParagraph[] = [
  ...sentenceParagraphs,
  ...quoteParagraphs,
  ...codeParagraphs
];

// Paragraph rotation management
class ParagraphRotator {
  private usedParagraphs: Set<string> = new Set();
  private currentIndex: number = 0;

  getNextParagraph(category: 'sentences' | 'quotes' | 'code'): TextParagraph {
    console.log('📚 getNextParagraph called with category:', category);
    
    let paragraphs: TextParagraph[];
    
    switch (category) {
      case 'sentences':
        paragraphs = sentenceParagraphs;
        break;
      case 'quotes':
        paragraphs = quoteParagraphs;
        break;
      case 'code':
        paragraphs = codeParagraphs;
        break;
      default:
        paragraphs = sentenceParagraphs;
    }

    console.log('📚 Available paragraphs for category:', {
      category,
      count: paragraphs.length,
      usedCount: this.usedParagraphs.size
    });

    // If all paragraphs of this category have been used, reset
    if (this.usedParagraphs.size >= paragraphs.length) {
      console.log('📚 All paragraphs used, resetting');
      this.usedParagraphs.clear();
    }

    // Find the next unused paragraph
    let selectedParagraph: TextParagraph;
    let attempts = 0;
    do {
      selectedParagraph = paragraphs[this.currentIndex % paragraphs.length];
      this.currentIndex = (this.currentIndex + 1) % paragraphs.length;
      attempts++;
      
      if (attempts > paragraphs.length) {
        console.warn('⚠️ getNextParagraph: Infinite loop detected, using first paragraph');
        selectedParagraph = paragraphs[0];
        break;
      }
    } while (this.usedParagraphs.has(selectedParagraph.id));

    // Mark as used
    this.usedParagraphs.add(selectedParagraph.id);
    
    console.log('📚 Selected paragraph:', {
      id: selectedParagraph.id,
      text: selectedParagraph.text,
      textLength: selectedParagraph.text?.length || 0,
      category: selectedParagraph.category,
      attempts
    });
    
    // Guard against invalid paragraphs
    if (!selectedParagraph || !selectedParagraph.text || selectedParagraph.text.trim().length === 0) {
      console.warn('⚠️ getNextParagraph: Invalid paragraph selected, using fallback');
      return {
        id: 'fallback-paragraph',
        category: 'sentences',
        text: 'The quick brown fox jumps over the lazy dog. This is a fallback paragraph.'
      };
    }
    
    return selectedParagraph;
  }

  reset(): void {
    this.usedParagraphs.clear();
    this.currentIndex = 0;
  }
}

// Export singleton instance
export const paragraphRotator = new ParagraphRotator(); 