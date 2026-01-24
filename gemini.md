# Project Analysis: MCQ Companion App

## Overview
This is a React-based Single Page Application (SPA) designed as a study companion for Multiple Choice Questions (MCQ). It allows users to simulate quiz sessions, track their answers and confidence levels, grade themselves, and view historical statistics.

## Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Persistence:** LocalStorage (custom wrapper)

## Architecture

### Entry Point
- `src/main.jsx`: Mounts the React app.
- `src/App.jsx`: The main container component. It manages the global state of the application, including the current view, active session data, and navigation logic.

### State Management
The application uses local React state (`useState`, `useReducer` concepts) within `App.jsx` to manage:
- **Navigation:** `view` state ('quiz', 'grading', 'stats', 'history').
- **Session:** `answers`, `flags`, `confidenceMap`, `currentQuestion`, `timeSpent`.
- **Persistence:** `useEffect` hooks sync the active session to `localStorage` ('active-session') to prevent data loss on refresh.

### Data Persistence (`src/lib/db.js`)
- A custom `LocalDB` class wraps `localStorage`.
- **Key:** `study-sessions-v2`.
- **Features:** Provides an async-like API (`add`, `bulkAdd`, `where`, `orderBy`) mimicking a database query builder, but operates purely on a serialized JSON array in LocalStorage.

## Key Components (`src/components/`)

| Component | Description |
|-----------|-------------|
| **SetupView** | Initial screen to configure a new session (number of questions, start index). |
| **QuestionCard** | Displays the current question, options, and confidence selectors. Handles answer input and timing. |
| **Sidebar** | Navigation menu and the "Question Grid" navigator, showing the status of all questions (answered, flagged, visited). |
| **GradingView** | Allows the user to mark their answers as Correct/Wrong after a session. Saves the final result to the DB. |
| **StatsView** | Displays analytics (accuracy, progress over time) using data from the DB. |
| **HistoryView** | A logbook of past sessions with export/import functionality. |

## Data Model

### Session Object
Stored in `study-sessions-v2` (LocalStorage):
```javascript
{
  id: Number,             // Timestamp + Random
  timestamp: String,      // ISO Date
  totalQuestions: Number,
  answers: Object,        // Map { questionId: "A"|"B"... }
  confidenceMap: Object,  // Map { questionId: "confident"|"unsure"|"guessing" }
  results: Object,        // Map { questionId: "correct"|"wrong"|"skipped" }
  tags: Array<String>,    // e.g., ["Biology", "Ch1"]
  stats: {
    correct: Number,
    wrong: Number,
    skipped: Number,
    accuracy: Number      // 0-1
  },
  timeSpent: Object       // Map { questionId: ms }
}
```

## Observations
- `src/BookCompanionApp.jsx` appears to be a monolithic precursor or backup file. The active logic resides in `src/App.jsx` and the individual files in `src/components/`.
- The app supports "Active Time Tracking" using the Page Visibility API to pause timers when the user switches tabs.
