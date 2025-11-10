A typing test application built with React, TypeScript, and Tailwind CSS Inspired by MonkeyType. Test your typing speed and accuracy with customizable test modes and real-time analytics.

> Tip: Use Node 18+ and npm/yarn.

## Features

- **Multiple Test Durations**: 15s, 30s, 60s, 120s
- **Text Modes**: Natural Sentences, Famous Quotes, Code Snippets
- **Real-time Analytics**: Live WPM, accuracy, and backspace tracking
- **Detailed Results**: Post-test analysis with charts and insights
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/RohanGottipati/Typing_Test.git

# Navigate to the project directory
cd Typing_Test

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── TypingTest.tsx  # Main typing test component
│   ├── TypingArea.tsx  # Typing interface
│   ├── LiveMetrics.tsx # Real-time statistics
│   ├── ResultDashboard.tsx # Post-test results
│   └── TestConfig.tsx  # Test configuration
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── App.tsx            # Main application component
```

## API Integration

The application is prepared for backend integration with the following endpoints:

- `GET /get-text?mode=...&duration=...` - Fetch test text based on mode and duration
- `POST /analyze` - Send keystroke data for analysis

Currently using stub data for development.

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **Recharts** - Data visualization
- **React Query** - Data fetching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Notes
- Documented by housekeeping updates.
