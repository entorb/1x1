# 1x1 Learning App "Vyvit's 1x1"

A progressive web app (PWA) designed to help primary school students master multiplication tables (3x3 to 9x9) through gamification and adaptive learning.

## Features

- **Adaptive Learning**: Cards adjust difficulty based on performance (5 levels)
- **Smart Card Selection**: Focus on weak, strong, or slow cards
- **Progress Tracking**: Detailed statistics and performance history
- **Time-based Scoring**: Faster correct answers earn bonus points
- **PWA Support**: Install as a native app on smartphones
- **Offline Ready**: Works without internet connection
- **Visual Progress**: Color-coded card grid showing level and speed
- **Game Mechanics**:
  - Auto-submit after 2 digits entered
  - Auto-close correct answers after 3s (skip with Enter)
  - 3-second safety delay on wrong answers to prevent accidents
  - Visual feedback with color-coded backgrounds

## Technical

- Frontend only
- Vue.js with Quasar Framework
- Stores data in local storage
- Optimized for SmartPhone with PWA support to install as app on smartphone
- Tools
  - pnpm
  - Vite
  - Typescript (strict) `pnpm run type-check`
  - Prettier `pnpm run format`
  - ESLint `pnpm run lint`
  - Vitest `pnpm run test` or `pnpm run test:unit` or `pnpm run test:cov`
  - Cypress `pnpm run cy:run` or `pnpm run cy:open`
  - [SonarQube](https://sonarcloud.io/summary/overall?id=entorb_1x1&branch=main)

## Quick Start

```sh
# Install dependencies
pnpm install

# Run development server (with hot reload)
pnpm run dev

# Build for production
pnpm run build

# Preview production build locally
pnpm run preview
```

## Development Workflow

```sh
# Update all packages to latest versions
pnpm up

# Run all quality checks (format, lint, type-check, spell-check, test)
pnpm run check

# Individual checks
pnpm run format        # Format code with Prettier
pnpm run lint          # Lint code with ESLint
pnpm run type-check    # TypeScript strict type checking
pnpm run test          # Run unit tests with Vitest
pnpm run test:unit     # Run unit tests in watch mode

# E2E testing with Cypress
pnpm run cy:open       # Open Cypress interactive mode
pnpm run cy:run        # Run Cypress tests headlessly
```

## UI

- German language
- Prefer icons over text, to make it easier

## Card System

The app uses a flashcard-like approach with **28 unique cards** covering multiplication tables from 3x3 to 9x9.

### Card Properties

Each card tracks:

- **Question**: Format `XxY` (e.g., `3x4`)
- **Answer**: Correct result (e.g., `12`)
- **Level**: Difficulty level 1-5 (starts at 1)
  - Increases by 1 on correct answer (max 5)
  - Decreases by 1 on wrong answer (min 1)
- **Time**: Seconds for last correct answer (0.1-60s, default 60)

### Card Generation

Cards are generated for 3x3 to 9x9 where **y ≤ x** to avoid duplicates (3x4 = 4x3):

```python
for x in range(3, 10):
    for y in range(3, x + 1):
        print(f"{y}x{x} = {x*y}")
```

**Total: 28 cards** (3x3-3x9: 7, 4x4-4x9: 6, 5x5-5x9: 5, 6x6-6x9: 4, 7x7-7x9: 3, 8x8-8x9: 2, 9x9: 1)

## Game Mechanics

### Card Selection

1. **Select**: Choose multiplication tables (3-9, x², or combinations)
   - Uses OR logic: selecting `[6]` returns all cards where x=6 OR y=6 (7 cards)
2. **Focus**: Prioritize cards by strategy
   - **Weak**: Practice low-level cards (level 1=5x weight, level 5=1x weight)
   - **Strong**: Practice high-level cards (level 1=1x weight, level 5=5x weight)
   - **Slow**: Practice cards with highest time
3. **Random Selection**: Pick up to 10 cards using weighted probability

### Scoring System

Points awarded for correct answers:

- **Base points**: Smaller number (e.g., 5x8 → 5 points)
- **Level bonus**: Higher levels give fewer points (level 2 → +4)
- **Time bonus**: Beat previous time (<60s) → +5 points

```text
points = min(x, y) + (6 - level) + time_bonus
```

### Bonus Points

- **First game of the day**: +5 points
- **Every 5th game of the day**: +5 points

## Application Pages

### [HomePage](src/pages/HomePage.vue) (`/`)

- Display overall statistics (games played, total points, correct answers)
- Configure game settings:
  - **Select**: Choose multiplication tables (3-9, x², or multiple)
  - **Focus**: Choose strategy (weak/strong/slow)
- Start game button

### [GamePage](src/pages/GamePage.vue) (`/game`)

- Display current card question
- Auto-submit after 2 digits
- Timer with progress bar (capped at 60s)
- Feedback dialog with color-coded backgrounds
- Track correct/wrong answers and update card levels

### [GameOverPage](src/pages/GameOverPage.vue) (`/game-over`)

- Show total points earned
- Display correct answer count
- List selected multiplication tables
- Apply daily bonus points

### [HistoryPage](src/pages/HistoryPage.vue) (`/history`)

- Table of all completed games
- Shows date, points, correct answers, and selected tables
- Navigate back with Escape key

### [StatsPage](src/pages/StatsPage.vue) (`/stats`)

- Card distribution by level
- Visual grid (3x3 to 9x9)
  - Background color = level
  - Font color = speed (time)
- Navigate back with Escape key

## Architecture

### Project Structure

```text
src/
├── __tests__/              # Unit tests (Vitest)
├── components/             # Reusable Vue components
│   ├── GroundhogMascot.vue
│   └── GameFeedbackDialog.vue
├── pages/                  # Main page components
│   ├── HomePage.vue
│   ├── GamePage.vue
│   ├── GameOverPage.vue
│   ├── HistoryPage.vue
│   └── StatsPage.vue
├── services/
│   └── storage.ts          # localStorage/sessionStorage service
├── types/
│   └── index.ts           # TypeScript type definitions
├── config/
│   ├── constants.ts       # App constants
│   └── text-de.ts         # German text strings (i18n ready)
├── util/
│   └── helpers.ts         # Reusable helper functions
└── router.ts              # Vue Router configuration
```

### Key Services

- **StorageService** (`services/storage.ts`): Handles all data persistence
  - localStorage: Card progress, game history, statistics
  - sessionStorage: Current game config, game results
- **Router** (`router.ts`): Route definitions with base path `/1x1/`

### State Management

Simple service-based approach without Vuex/Pinia (sufficient for this app size).

---

## TODOs/Ideas

- Display scoring rules to the user
- 10er, 12er, 20er -> local storage, respect in stats

Additional Code Improvement Proposals

### High Priority

#### Add Dark Mode Support

- Leverage Quasar's dark mode plugin
- Add theme toggle in settings
- Use CSS variables for better theme switching
- Adjust color constants to support dark theme

#### Progressive Enhancement

- Add loading states with skeletons for better perceived performance
- Implement service worker caching strategies for faster subsequent loads
- Add offline mode indicator

#### Accessibility Improvements

- Add ARIA labels to interactive elements
- Improve keyboard navigation (tab order, focus indicators)
- Add screen reader announcements for game feedback
- Ensure color contrast meets WCAG AA standards
- Add skip navigation links

#### Performance Optimization

- Lazy load route components
- Add virtual scrolling for history list when it grows large
- Debounce localStorage writes
- Use shallowRef where deep reactivity isn't needed

#### Error Handling

- Add error boundaries for graceful failure
- Add retry logic for failed web stats API calls
- Validate localStorage data with schema validation (e.g., Zod)
- Handle quota exceeded errors for localStorage

### Medium Priority

#### Enhanced Statistics

- Add charts/graphs for progress over time (using Chart.js or similar)
- Show average time per level
- Display success rate trends
- Add weekly/monthly statistics views

#### Gamification

- Add achievements/badges system
- Implement streaks (days played consecutively)
- Add sound effects for correct/wrong answers (with mute toggle)
- Celebrate milestones (100 correct answers, all level 5, etc.)

#### Settings Page

- Add dedicated settings page
- Allow customization of auto-submit behavior
- Configurable timer settings
- Theme selection
- Sound effects toggle

#### Internationalization (i18n)

- Set up Vue I18n plugin
- Extract all TEXT constants to translation files
- Support German (current) and English
- Add language switcher

#### Testing Improvements

- Add E2E tests for all critical paths
- Increase unit test coverage for edge cases
- Add visual regression tests
- Test accessibility with axe-core

### Low Priority

#### Analytics & Insights

- Add privacy-friendly analytics (e.g., Plausible)
- Track common mistakes
- Identify problematic multiplication pairs
- Export statistics as CSV

#### Social Features

- Add share functionality for results
- Allow exporting progress as image
- Create shareable achievements

#### Advanced Game Modes

- Timed challenge mode (60 seconds, max points)
- Endless mode
- Multiplayer mode (local)
- Practice mode for specific cards

#### Code Quality

- Add JSDoc comments for complex functions
- Set up automated dependency updates (Dependabot)
- Add commit message linting (commitlint)
- Implement pre-commit hooks for linting

#### Developer Experience

- Add Storybook for component development
- Create component documentation
- Add development mode with mock data
- Set up automatic changelog generation
