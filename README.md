# Typing Test

A MonkeyType-inspired typing test built with React, TypeScript and Tailwind CSS that records every keystroke and turns it into post-test analytics, a typing "persona" and a history of your sessions — all in the browser.

## Features

- **Test modes**: `time` (15 / 30 / 60 / 120 s), `words` (custom word count), `quote` (random famous quote), `zen` (free typing) and `custom` (paste your own text, with optional time or word limit).
- **Text options**: toggle punctuation and numbers in generated text.
- **Live feedback**: 3-second countdown before timed tests, remaining time and live WPM while typing.
- **Results**: WPM, accuracy and backspace stats, behavioral insights, error & correction analysis, a typing persona (e.g. "The Sprinter", "The Perfectionist") with personalised tips, and a next-session WPM prediction from a simple linear regression over past sessions.
- **Export**: download a session as CSV or JSON.
- **Session history**: the last 50 sessions are stored in `localStorage` and can be reviewed or cleared.
- **Analytics dashboard**: filter saved sessions by mode, date and WPM range and chart WPM / accuracy over time (Recharts).

There is no backend: all data stays in the browser's `localStorage` (`typing-sessions` for sessions, `typing-test-settings` for the last-used settings).

## Tech stack

- React 18 + TypeScript, built with Vite 5 (`@vitejs/plugin-react-swc`)
- Tailwind CSS with a small set of shadcn/ui components (Radix UI)
- Recharts for charts
- React Router and TanStack Query (app shell)
- ESLint 9 (`typescript-eslint`)

## Project structure

```
src/
├── main.tsx / App.tsx       # Entry point, providers and routes (/ and a 404 page)
├── pages/                   # Index (renders TypingTest) and NotFound
├── components/
│   ├── TypingTest.tsx       # Main test flow: config, typing, results, navigation
│   ├── TestConfig.tsx       # Mode / duration / toggle selector
│   ├── TypingBox.tsx        # Typing surface and keystroke capture
│   ├── AnalyticsDashboard.tsx
│   ├── SessionHistory.tsx
│   ├── BehavioralInsights.tsx, ErrorAnalysis.tsx, WPMPrediction.tsx
│   ├── ErrorBoundary.tsx
│   └── ui/                  # shadcn/ui primitives in use
├── hooks/use-toast.ts
└── lib/
    ├── textGenerator.ts     # Sentence/word generation with punctuation & numbers
    ├── quotesData.ts        # Quotes for quote mode
    ├── behavioralMetrics.ts # Keystroke-derived metrics
    ├── typingPersonas.ts    # Persona classification and insights
    ├── wpmPredictor.ts      # Linear-regression WPM prediction
    ├── sessionStorage.ts    # localStorage persistence
    ├── exportUtils.ts       # CSV / JSON export
    └── utils.ts             # `cn` class-name helper
```

## Prerequisites

- Node.js 18 (see `.nvmrc`; `nvm use` picks it up)
- npm (the repo ships a `package-lock.json`)

## Getting started

```bash
git clone https://github.com/RohanGottipati/Typing.git
cd Typing
npm ci
npm run dev
```

The dev server listens on `http://localhost:5173`.

## Environment variables

None. The app does not read any environment variables.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Build using Vite's development mode |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint over the project |

## Deployment

`vercel.json` configures Vercel to install with `npm install --legacy-peer-deps`, build with `npm run build` and serve the static `dist/` output.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security issues: [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
