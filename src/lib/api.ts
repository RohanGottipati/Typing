// API service for Type Flow Forge
// This file contains all API calls for backend integration

export interface TextRequest {
  mode: 'sentences' | 'quotes' | 'code';
  duration: number;
}

export interface AnalysisRequest {
  wpm: number;
  accuracy: number;
  backspaces: number;
  wpmOverTime: number[];
  timeIntervals: number[];
  missedCharacters: { [key: string]: number };
  totalKeystrokes: number;
  correctKeystrokes: number;
  averageLatency: number;
  keystrokeData: unknown[];
}

export interface AnalysisResponse {
  wpm: number;
  accuracy: number;
  backspaces: number;
  wpmOverTime: number[];
  timeIntervals: number[];
  missedCharacters: { [key: string]: number };
  suggestions: string[];
  totalKeystrokes: number;
  correctKeystrokes: number;
  averageLatency: number;
}

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Fetch text content from backend
export const fetchText = async (request: TextRequest): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-text?mode=${request.mode}&duration=${request.duration}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.words || [];
  } catch (error) {
    console.error('Failed to fetch text from API:', error);
    throw error;
  }
};

// Send analysis data to backend
export const analyzeResults = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to analyze results:', error);
    throw error;
  }
};

// Health check endpoint
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}; 