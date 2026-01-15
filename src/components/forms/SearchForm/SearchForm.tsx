/**
 * SearchForm Component
 *
 * A responsive, accessible flight search form built with Material UI.
 * Supports origin/destination autocomplete, date selection, and validation.
 */

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  Stack,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  FlightTakeoff,
  FlightLand,
  CalendarMonth,
  SwapHoriz,
  Search,
} from "@mui/icons-material";

import type {
  SearchFormProps,
  SearchFormValues,
  SearchFormValidation,
  Airport,
} from "./SearchForm.types";

// ============================================
// DEFAULT DATA
// ============================================

const DEFAULT_AIRPORTS: Airport[] = [
  {
    code: "JFK",
    name: "John F. Kennedy International",
    city: "New York",
    country: "USA",
  },
  {
    code: "LAX",
    name: "Los Angeles International",
    city: "Los Angeles",
    country: "USA",
  },
  {
    code: "ORD",
    name: "O'Hare International",
    city: "Chicago",
    country: "USA",
  },
  { code: "LHR", name: "Heathrow", city: "London", country: "UK" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "UAE" },
  { code: "SIN", name: "Changi", city: "Singapore", country: "Singapore" },
  { code: "HND", name: "Haneda", city: "Tokyo", country: "Japan" },
  {
    code: "SYD",
    name: "Kingsford Smith",
    city: "Sydney",
    country: "Australia",
  },
  {
    code: "FRA",
    name: "Frankfurt Airport",
    city: "Frankfurt",
    country: "Germany",
  },
];

const getMinDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// ============================================
// VALIDATION
// ============================================

function validateForm(values: SearchFormValues): SearchFormValidation {
  const errors: SearchFormValidation["errors"] = {};
  const today = getMinDate();

  // Origin validation
  if (!values.origin) {
    errors.origin = "Please select a departure airport";
  }

  // Destination validation
  if (!values.destination) {
    errors.destination = "Please select an arrival airport";
  } else if (values.origin?.code === values.destination?.code) {
    errors.destination = "Destination must be different from origin";
  }

  // Departure date validation
  if (!values.departureDate) {
    errors.departureDate = "Please select a departure date";
  } else if (values.departureDate < today) {
    errors.departureDate = "Departure date cannot be in the past";
  }

  // Return date validation (only if provided)
  if (values.returnDate) {
    if (values.returnDate < values.departureDate) {
      errors.returnDate = "Return date must be after departure";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// COMPONENT
// ============================================

export function SearchForm({
  onSubmit,
  isLoading = false,
  airports = DEFAULT_AIRPORTS,
  initialValues,
}: SearchFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Form state
  const [values, setValues] = useState<SearchFormValues>({
    origin: initialValues?.origin ?? null,
    destination: initialValues?.destination ?? null,
    departureDate: initialValues?.departureDate ?? "",
    returnDate: initialValues?.returnDate ?? "",
  });

  // Track which fields have been touched (for showing errors)
  const [touched, setTouched] = useState({
    origin: false,
    destination: false,
    departureDate: false,
    returnDate: false,
  });

  // Validation
  const validation = useMemo(() => validateForm(values), [values]);

  // Handlers
  const handleFieldChange = useCallback(
    <K extends keyof SearchFormValues>(
      field: K,
      value: SearchFormValues[K]
    ) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFieldBlur = useCallback((field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSwapLocations = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched to show any errors
      setTouched({
        origin: true,
        destination: true,
        departureDate: true,
        returnDate: true,
      });

      if (validation.isValid) {
        onSubmit(values);
      }
    },
    [validation.isValid, values, onSubmit]
  );

  // Helper to show error only after field is touched
  const getFieldError = (field: keyof typeof touched) => {
    return touched[field] ? validation.errors[field] : undefined;
  };

  // Format airport option for display
  const getAirportLabel = (airport: Airport) => {
    return `${airport.city} (${airport.code})`;
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Flight search form"
      sx={{
        width: "100%",
        // maxWidth: 900,
        mx: "auto",
      }}
    >
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        alignItems={isMobile ? "stretch" : "flex-start"}
      >
        {/* Origin & Destination Group */}
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={isMobile ? 2 : 1}
          sx={{ flex: 2.5 }}
          alignItems="center"
        >
          {/* Origin */}
          <Autocomplete
            id="origin-airport"
            options={airports}
            value={values.origin}
            onChange={(_, newValue) => handleFieldChange("origin", newValue)}
            onBlur={() => handleFieldBlur("origin")}
            getOptionLabel={getAirportLabel}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            disabled={isLoading}
            fullWidth
            sx={{ minWidth: { xs: "100%", md: 200 } }}
            renderOption={(props, option) => (
              <li {...props} key={option.code}>
                <Box>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {option.code}
                  </Box>
                  <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                    {option.city}, {option.country}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="From"
                placeholder="Departure city"
                error={!!getFieldError("origin")}
                helperText={getFieldError("origin")}
                required
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlightTakeoff color="action" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  "aria-label": "Departure airport",
                }}
              />
            )}
          />

          {/* Swap Button */}
          <IconButton
            onClick={handleSwapLocations}
            disabled={isLoading}
            aria-label="Swap origin and destination"
            sx={{
              alignSelf: "center",
              transform: isMobile ? "rotate(90deg)" : "none",
              flexShrink: 0,
            }}
          >
            <SwapHoriz />
          </IconButton>

          {/* Destination */}
          <Autocomplete
            id="destination-airport"
            options={airports}
            value={values.destination}
            onChange={(_, newValue) =>
              handleFieldChange("destination", newValue)
            }
            onBlur={() => handleFieldBlur("destination")}
            getOptionLabel={getAirportLabel}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            disabled={isLoading}
            fullWidth
            sx={{ minWidth: { xs: "100%", md: 200 } }}
            renderOption={(props, option) => (
              <li {...props} key={option.code}>
                <Box>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {option.code}
                  </Box>
                  <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                    {option.city}, {option.country}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="To"
                placeholder="Arrival city"
                error={!!getFieldError("destination")}
                helperText={getFieldError("destination")}
                required
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlightLand color="action" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  "aria-label": "Arrival airport",
                }}
              />
            )}
          />
        </Stack>

        {/* Date Fields Group */}
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          sx={{ flex: 1.5 }}
        >
          {/* Departure Date */}
          <TextField
            id="departure-date"
            type="date"
            label="Departure"
            value={values.departureDate}
            onChange={(e) => handleFieldChange("departureDate", e.target.value)}
            onBlur={() => handleFieldBlur("departureDate")}
            error={!!getFieldError("departureDate")}
            helperText={getFieldError("departureDate")}
            disabled={isLoading}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: getMinDate(),
              "aria-label": "Departure date",
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Return Date (Optional) */}
          <TextField
            id="return-date"
            type="date"
            label="Return (optional)"
            value={values.returnDate}
            onChange={(e) => handleFieldChange("returnDate", e.target.value)}
            onBlur={() => handleFieldBlur("returnDate")}
            error={!!getFieldError("returnDate")}
            helperText={getFieldError("returnDate")}
            disabled={isLoading}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: values.departureDate || getMinDate(),
              "aria-label": "Return date (optional)",
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Search Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading || !validation.isValid}
          startIcon={<Search />}
          sx={{
            height: isMobile ? 48 : 56,
            minWidth: isMobile ? "100%" : 140,
            alignSelf: isMobile ? "stretch" : "flex-start",
          }}
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </Stack>
    </Box>
  );
}

export default SearchForm;
