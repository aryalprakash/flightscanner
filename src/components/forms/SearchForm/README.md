# SearchForm Component

A responsive, accessible flight search form built with Material UI v5.

## Usage

```tsx
import { SearchForm } from "@/components/forms/SearchForm";
import type { SearchFormValues } from "@/components/forms/SearchForm";

function FlightSearchPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (values: SearchFormValues) => {
    setIsLoading(true);
    try {
      const results = await searchFlights({
        originLocationCode: values.origin!.code,
        destinationLocationCode: values.destination!.code,
        departureDate: values.departureDate,
        returnDate: values.returnDate || undefined,
        adults: 1,
      });
      // Handle results...
    } finally {
      setIsLoading(false);
    }
  };

  return <SearchForm onSubmit={handleSearch} isLoading={isLoading} />;
}
```

---

## UX Decisions

### 1. **Progressive Validation (Touched State)**

Errors are only shown _after_ the user has interacted with a field (blur event). This prevents an overwhelming wall of red errors on initial render.

```
Initial load   → No errors shown
User types     → No errors shown
User leaves    → Error shown if invalid
Submit clicked → All errors shown
```

**Why:** Reduces cognitive load and avoids punishing users before they've had a chance to complete the form.

---

### 2. **Swap Button Between Origin/Destination**

The swap icon (↔) sits between the two airport fields, allowing one-click reversal for return trip searches.

- **Desktop:** Horizontal arrow between fields
- **Mobile:** Rotated 90° for vertical layout

**Why:** Frequent use case for round-trip travelers. Saves ~4 interactions (clear + retype × 2 fields).

---

### 3. **Return Date is Optional**

The return date field:

- Has "(optional)" in the label
- Does not block form submission when empty
- Automatically constrains `min` to the departure date

**Why:** Supports both one-way and round-trip searches without requiring a toggle. Less UI complexity.

---

### 4. **Autocomplete with Rich Options**

Airport options display:

```
┌──────────────────────────────────┐
│ JFK  New York, USA               │
│ LAX  Los Angeles, USA            │
│ LHR  London, UK                  │
└──────────────────────────────────┘
```

- **Bold code** (JFK) for quick scanning
- City + country for disambiguation (e.g., multiple "London" airports)

**Why:** Users often know either the city or the airport code—supporting both reduces friction.

---

### 5. **Disabled State During Loading**

When `isLoading={true}`:

- All inputs are disabled
- Button shows "Searching..."
- Prevents duplicate submissions

**Why:** Provides clear feedback that the action is in progress, preventing accidental double-clicks.

---

### 6. **Responsive Layout**

| Breakpoint   | Layout                            |
| ------------ | --------------------------------- |
| < md (900px) | Vertical stack, full-width fields |
| ≥ md         | Horizontal row, grouped fields    |

```
Mobile:                    Desktop:
┌─────────────────┐        ┌───────┬─↔─┬───────┬──────┬──────┬─────────┐
│ From            │        │ From  │   │  To   │ Dep  │ Ret  │ Search  │
├─────────────────┤        └───────┴───┴───────┴──────┴──────┴─────────┘
│      ↕          │
├─────────────────┤
│ To              │
├─────────────────┤
│ Departure       │
├─────────────────┤
│ Return          │
├─────────────────┤
│ [ Search ]      │
└─────────────────┘
```

**Why:** Optimizes for thumb reach on mobile (tall, narrow) and screen real estate on desktop (wide, compact).

---

### 7. **Accessible Labels**

Every input has:

- Visible `label` prop
- `aria-label` for screen readers
- Unique `id` for programmatic association
- `required` attribute where applicable

**Why:** WCAG 2.1 compliance. Screen readers announce field purpose clearly.

---

### 8. **Date Input Constraints**

- `min` on departure = today (no past dates)
- `min` on return = departure date (logical sequence)
- Native date picker for mobile-friendly experience

**Why:** Prevents impossible selections at the browser level, reducing validation errors.

---

### 9. **Clean Separation of Concerns**

| Layer                 | Responsibility                |
| --------------------- | ----------------------------- |
| `SearchForm.tsx`      | UI rendering, local state     |
| `SearchForm.types.ts` | TypeScript interfaces         |
| `onSubmit` prop       | Parent handles API call       |
| `isLoading` prop      | Parent controls loading state |

**Why:** Form doesn't know about API implementation. Can be reused with different backends or in Storybook.

---

### 10. **Default Airport Data**

Ships with 10 popular airports for demo/development. In production, replace with:

```tsx
<SearchForm
  airports={fetchedAirports} // From API
  onSubmit={handleSearch}
/>
```

**Why:** Works out-of-the-box without backend dependency for prototyping.

---

## Props API

| Prop            | Type                                 | Default      | Description                 |
| --------------- | ------------------------------------ | ------------ | --------------------------- |
| `onSubmit`      | `(values: SearchFormValues) => void` | Required     | Called with valid form data |
| `isLoading`     | `boolean`                            | `false`      | Disables form during search |
| `airports`      | `Airport[]`                          | Default list | Autocomplete options        |
| `initialValues` | `Partial<SearchFormValues>`          | `{}`         | Pre-fill form fields        |

---

## Form Values Shape

```typescript
interface SearchFormValues {
  origin: Airport | null;
  destination: Airport | null;
  departureDate: string; // "YYYY-MM-DD"
  returnDate: string; // "YYYY-MM-DD" or ""
}

interface Airport {
  code: string; // "JFK"
  name: string; // "John F. Kennedy International"
  city: string; // "New York"
  country: string; // "USA"
}
```
