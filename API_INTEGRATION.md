# API Integration Guide

## Overview

Type Flow Forge is designed to work with a backend API for enhanced functionality. The application includes fallback mechanisms to work offline when the API is unavailable.

## API Endpoints

### 1. Get Text Content
```
GET /get-text?mode={mode}&duration={duration}
```

**Parameters:**
- `mode`: Text type (`sentences`, `quotes`, `code`)
- `duration`: Test duration in seconds (15, 30, 60, 120)

**Response:**
```json
{
  "words": ["word1", "word2", "word3", ...]
}
```

### 2. Analyze Results
```
POST /analyze
```

**Request Body:**
```json
{
  "wpm": 45,
  "accuracy": 95,
  "backspaces": 12,
  "wpmOverTime": [40, 42, 45, 43],
  "timeIntervals": [5, 10, 15, 20],
  "missedCharacters": {"a": 2, "s": 1},
  "totalKeystrokes": 156,
  "correctKeystrokes": 148,
  "averageLatency": 250,
  "keystrokeData": [...]
}
```

**Response:**
```json
{
  "wpm": 45,
  "accuracy": 95,
  "backspaces": 12,
  "wpmOverTime": [40, 42, 45, 43],
  "timeIntervals": [5, 10, 15, 20],
  "missedCharacters": {"a": 2, "s": 1},
  "suggestions": ["Focus on accuracy", "Practice common combinations"],
  "totalKeystrokes": 156,
  "correctKeystrokes": 148,
  "averageLatency": 250
}
```

### 3. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Configuration

Set the API base URL using environment variables:

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000
```

## Fallback Behavior

When the API is unavailable:
1. Text content falls back to built-in sentences/quotes/code snippets
2. Analysis uses local processing with basic suggestions
3. All core functionality remains available

## Error Handling

The application gracefully handles:
- Network errors
- API timeouts
- Invalid responses
- Missing endpoints

All errors are logged to the console for debugging. 