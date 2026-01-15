# Flight Search Engine - Project Structure

## 📁 Folder Structure

```
flightscanner/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       └── images/
│           └── airlines/          # Airline logos
│
├── src/
│   ├── api/                       # API layer
│   │   ├── clients/
│   │   │   ├── httpClient.ts      # Axios/fetch wrapper
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── flightService.ts   # Flight search API calls
│   │   │   ├── airportService.ts  # Airport data API calls
│   │   │   ├── priceService.ts    # Price tracking/history
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── requests.ts        # API request types
│   │   │   ├── responses.ts       # API response types
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── components/                # Reusable UI components
│   │   ├── common/                # Generic components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Skeleton/
│   │   │   └── index.ts
│   │   │
│   │   ├── forms/                 # Form-related components
│   │   │   ├── SearchForm/
│   │   │   │   ├── SearchForm.tsx
│   │   │   │   ├── SearchForm.schema.ts   # Validation schema
│   │   │   │   ├── SearchForm.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── DateRangePicker/
│   │   │   ├── PassengerSelector/
│   │   │   ├── AirportAutocomplete/
│   │   │   └── index.ts
│   │   │
│   │   ├── flight/                # Flight-specific components
│   │   │   ├── FlightCard/
│   │   │   │   ├── FlightCard.tsx
│   │   │   │   ├── FlightCard.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── FlightList/
│   │   │   ├── FlightDetails/
│   │   │   ├── FlightTimeline/
│   │   │   ├── PriceBreakdown/
│   │   │   └── index.ts
│   │   │
│   │   ├── charts/                # Recharts components
│   │   │   ├── PriceHistoryChart/
│   │   │   ├── PriceTrendChart/
│   │   │   ├── FlightDurationChart/
│   │   │   └── index.ts
│   │   │
│   │   ├── filters/               # Filter components
│   │   │   ├── FilterPanel/
│   │   │   ├── PriceRangeFilter/
│   │   │   ├── AirlineFilter/
│   │   │   ├── StopsFilter/
│   │   │   ├── TimeFilter/
│   │   │   └── index.ts
│   │   │
│   │   └── layout/                # Layout components
│   │       ├── Header/
│   │       ├── Footer/
│   │       ├── Sidebar/
│   │       ├── PageContainer/
│   │       └── index.ts
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── api/                   # API-related hooks
│   │   │   ├── useFlightSearch.ts
│   │   │   ├── useAirports.ts
│   │   │   ├── usePriceHistory.ts
│   │   │   └── index.ts
│   │   ├── ui/                    # UI-related hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   ├── useInfiniteScroll.ts
│   │   │   └── index.ts
│   │   ├── useFilters.ts
│   │   ├── useSearchParams.ts
│   │   └── index.ts
│   │
│   ├── pages/                     # Page components (routes)
│   │   ├── Home/
│   │   │   ├── Home.tsx
│   │   │   ├── Home.styles.ts
│   │   │   └── index.ts
│   │   ├── Search/
│   │   │   ├── Search.tsx
│   │   │   ├── Search.styles.ts
│   │   │   └── index.ts
│   │   ├── FlightDetails/
│   │   │   ├── FlightDetails.tsx
│   │   │   ├── FlightDetails.styles.ts
│   │   │   └── index.ts
│   │   ├── PriceAlerts/
│   │   ├── NotFound/
│   │   └── index.ts
│   │
│   ├── store/                     # State management
│   │   ├── slices/                # Redux slices or Zustand stores
│   │   │   ├── searchSlice.ts
│   │   │   ├── filtersSlice.ts
│   │   │   ├── userPreferencesSlice.ts
│   │   │   └── index.ts
│   │   ├── selectors/
│   │   │   ├── searchSelectors.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── theme/                     # MUI theme configuration
│   │   ├── palette.ts
│   │   ├── typography.ts
│   │   ├── components.ts          # Component overrides
│   │   ├── breakpoints.ts
│   │   └── index.ts
│   │
│   ├── types/                     # Global TypeScript types
│   │   ├── flight.ts
│   │   ├── airport.ts
│   │   ├── search.ts
│   │   ├── filters.ts
│   │   ├── common.ts
│   │   └── index.ts
│   │
│   ├── utils/                     # Utility functions
│   │   ├── formatters/
│   │   │   ├── dateFormatter.ts
│   │   │   ├── priceFormatter.ts
│   │   │   ├── durationFormatter.ts
│   │   │   └── index.ts
│   │   ├── validators/
│   │   │   ├── searchValidators.ts
│   │   │   └── index.ts
│   │   ├── helpers/
│   │   │   ├── flightHelpers.ts
│   │   │   ├── sortHelpers.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── constants/                 # App constants
│   │   ├── routes.ts
│   │   ├── api.ts
│   │   ├── filters.ts
│   │   └── index.ts
│   │
│   ├── config/                    # App configuration
│   │   ├── env.ts                 # Environment variables
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env.example
├── .env.local
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vercel.json
└── README.md
```

---

## 📂 Folder Explanations

### `/src/api/`

**Purpose:** Centralized API communication layer.

| Subfolder   | Description                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| `clients/`  | HTTP client wrappers (Axios/fetch) with interceptors, error handling, and retry logic |
| `services/` | Domain-specific API functions organized by feature (flights, airports, prices)        |
| `types/`    | TypeScript interfaces for API requests and responses                                  |

**Key Principle:** All external API calls go through this layer. Components never call APIs directly.

---

### `/src/components/`

**Purpose:** Reusable UI building blocks.

| Subfolder  | Description                                            |
| ---------- | ------------------------------------------------------ |
| `common/`  | Generic, app-agnostic components (Button, Card, Modal) |
| `forms/`   | Form-related components with validation                |
| `flight/`  | Domain-specific flight display components              |
| `charts/`  | Recharts wrappers for data visualization               |
| `filters/` | Search filter UI components                            |
| `layout/`  | Page structure components (Header, Footer, Sidebar)    |

**Component Structure:**

```
ComponentName/
├── ComponentName.tsx       # Component logic
├── ComponentName.styles.ts # MUI styled components / sx props
├── ComponentName.test.tsx  # Unit tests (optional)
└── index.ts                # Barrel export
```

---

### `/src/hooks/`

**Purpose:** Custom React hooks for logic reuse.

| Subfolder | Description                                              |
| --------- | -------------------------------------------------------- |
| `api/`    | Data fetching hooks using React Query or SWR patterns    |
| `ui/`     | UI utility hooks (debounce, localStorage, media queries) |

**Examples:**

- `useFlightSearch` - Manages flight search API calls with caching
- `useDebounce` - Debounces input for autocomplete
- `useFilters` - Manages filter state and URL sync

---

### `/src/pages/`

**Purpose:** Route-level page components.

Each page:

- Composes multiple components
- Handles route parameters
- Manages page-level state
- Defines page layout

**Note:** Pages are thin orchestrators; business logic lives in hooks.

---

### `/src/store/`

**Purpose:** Global state management (Redux Toolkit / Zustand).

| Subfolder    | Description                          |
| ------------ | ------------------------------------ |
| `slices/`    | State slices organized by feature    |
| `selectors/` | Memoized selectors for derived state |

**When to use:**

- Search parameters that persist across navigation
- User preferences
- Cross-component state

---

### `/src/theme/`

**Purpose:** Material UI v5 theme customization.

| File             | Description                      |
| ---------------- | -------------------------------- |
| `palette.ts`     | Color definitions                |
| `typography.ts`  | Font settings                    |
| `components.ts`  | Default component prop overrides |
| `breakpoints.ts` | Responsive breakpoints           |

---

### `/src/types/`

**Purpose:** Global TypeScript type definitions.

Shared domain types used across multiple modules. API-specific types stay in `/api/types/`.

---

### `/src/utils/`

**Purpose:** Pure utility functions.

| Subfolder     | Description                                |
| ------------- | ------------------------------------------ |
| `formatters/` | Data formatting (dates, prices, durations) |
| `validators/` | Validation logic                           |
| `helpers/`    | Domain-specific helper functions           |

**Rule:** No React dependencies. Pure functions only.

---

### `/src/constants/`

**Purpose:** Application-wide constants.

- Route paths
- API endpoints
- Filter options
- Magic numbers with semantic names

---

### `/src/config/`

**Purpose:** Environment configuration.

Type-safe access to environment variables with defaults.

```typescript
// config/env.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  apiKey: import.meta.env.VITE_API_KEY,
  isDev: import.meta.env.DEV,
} as const;
```

---

## 🏗️ Architectural Principles

### 1. **Separation of Concerns**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Pages     │───▶│ Components  │───▶│   Theme     │
│ (Routing)   │    │    (UI)     │    │  (Styling)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                 │
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│   Hooks     │───▶│    API      │
│  (Logic)    │    │ (Data)      │
└─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│   Store     │
│  (State)    │
└─────────────┘
```

### 2. **Single Responsibility**

- Components: Render UI based on props
- Hooks: Encapsulate reusable logic
- Services: Handle API communication
- Utils: Pure data transformations

### 3. **Dependency Inversion**

- Components depend on abstractions (hooks)
- Hooks depend on services
- Services depend on HTTP client
- Easy to mock at any layer

### 4. **Colocation**

- Styles live with components
- Types live with their consumers
- Tests live with their subjects

### 5. **Barrel Exports**

Every folder has an `index.ts` for clean imports:

```typescript
// ❌ Avoid
import { FlightCard } from "@/components/flight/FlightCard/FlightCard";

// ✅ Prefer
import { FlightCard } from "@/components/flight";
```

### 6. **Container/Presentational Pattern**

- **Pages** = Containers (data fetching, state)
- **Components** = Presentational (pure UI)

### 7. **Type Safety Throughout**

- Strict TypeScript configuration
- API responses are typed
- Props are explicitly defined
- No `any` types allowed

### 8. **Vercel-Optimized**

- Client-side only (no SSR complexity)
- Environment variables via Vercel dashboard
- Automatic deployments from main branch
- Edge caching for static assets

---

## 📋 Key Files

### `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### `tsconfig.json` (paths)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@api/*": ["src/api/*"],
      "@pages/*": ["src/pages/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@theme/*": ["src/theme/*"],
      "@store/*": ["src/store/*"],
      "@constants/*": ["src/constants/*"]
    }
  }
}
```

---

## 🔄 Data Flow Example

```
User clicks "Search"
       │
       ▼
┌──────────────────┐
│  SearchForm      │  Component captures input
│  (component)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ useFlightSearch  │  Hook manages API call + caching
│    (hook)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ flightService    │  Service makes HTTP request
│   (api)          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  httpClient      │  Client handles auth, errors
│   (api)          │
└────────┬─────────┘
         │
         ▼
    External API
```

---

## 📦 Recommended Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "@mui/material": "^5.x",
    "@mui/icons-material": "^5.x",
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "recharts": "^2.x",
    "@tanstack/react-query": "^5.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "date-fns": "^3.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "@types/react": "^18.x"
  }
}
```

---

## ✅ Summary

| Principle       | Implementation                       |
| --------------- | ------------------------------------ |
| Scalability     | Feature-based folder structure       |
| Maintainability | Clear separation of concerns         |
| Reusability     | Component library + custom hooks     |
| Type Safety     | Strict TypeScript + API types        |
| Performance     | React Query caching + code splitting |
| DX              | Path aliases + barrel exports        |
| Deployment      | Vercel-optimized configuration       |
