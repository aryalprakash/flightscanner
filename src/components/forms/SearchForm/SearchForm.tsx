/**
 * SearchForm Component
 *
 * A responsive, accessible flight search form built with Material UI.
 * Supports origin/destination autocomplete with Amadeus API, date selection, and validation.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
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
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Popover,
} from "@mui/material";
import {
  FlightTakeoff,
  FlightLand,
  SwapHoriz,
  Search,
  LocationCity,
  LocalAirport,
  Person,
  Add,
  Remove,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { format, parse, isValid, startOfDay, addDays } from "date-fns";

import { useAirportSearch } from "@/hooks";
import type { LocationSearchResult } from "@/api/services/locationService";

import type {
  SearchFormProps,
  SearchFormValues,
  SearchFormValidation,
  TripType,
  TravelClass,
  PassengerCount,
} from "./SearchForm.types";

import { TRIP_TYPE_OPTIONS, TRAVEL_CLASS_OPTIONS } from "./SearchForm.types";
import { CustomDateField } from "./CustomDateField";

// ============================================
// TYPES
// ============================================

// Extended type for autocomplete options (includes nested airports)
type AutocompleteOption = LocationSearchResult & {
  isNested?: boolean;
  parentCity?: string;
};

// Date range type for round-trip
type DateRange = [Date | null, Date | null];

// ============================================
// HELPERS
// ============================================

const getMinDate = () => {
  return startOfDay(new Date());
};

const formatDateToString = (date: Date | null): string => {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
};

const parseDateFromString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : null;
};

function flattenOptions(
  locations: LocationSearchResult[]
): AutocompleteOption[] {
  const options: AutocompleteOption[] = [];
  for (const loc of locations) {
    options.push(loc);
    if (loc.type === "CITY" && loc.airports && loc.airports.length > 0) {
      for (const airport of loc.airports) {
        options.push({
          ...airport,
          isNested: true,
          parentCity: loc.cityName,
        });
      }
    }
  }
  return options;
}

function getPassengerSummary(passengers: PassengerCount): string {
  const parts: string[] = [];
  if (passengers.adults > 0) {
    parts.push(`${passengers.adults} Adult${passengers.adults > 1 ? "s" : ""}`);
  }
  if (passengers.children > 0) {
    parts.push(
      `${passengers.children} Child${passengers.children > 1 ? "ren" : ""}`
    );
  }
  if (passengers.infants > 0) {
    parts.push(
      `${passengers.infants} Infant${passengers.infants > 1 ? "s" : ""}`
    );
  }
  return parts.join(", ") || "1 Adult";
}

// ============================================
// VALIDATION
// ============================================

function validateForm(values: SearchFormValues): SearchFormValidation {
  const errors: SearchFormValidation["errors"] = {};
  const today = formatDateToString(getMinDate());

  if (!values.origin) {
    errors.origin = "Please select a departure airport";
  }

  if (!values.destination) {
    errors.destination = "Please select an arrival airport";
  } else if (values.origin?.code === values.destination?.code) {
    errors.destination = "Destination must be different from origin";
  }

  if (!values.departureDate) {
    errors.departureDate = "Please select a departure date";
  } else if (values.departureDate < today) {
    errors.departureDate = "Departure date cannot be in the past";
  }

  if (values.tripType === "round-trip" && values.returnDate) {
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
// PASSENGER SELECTOR COMPONENT
// ============================================

interface PassengerSelectorProps {
  value: PassengerCount;
  onChange: (value: PassengerCount) => void;
  disabled?: boolean;
}

function PassengerSelector({
  value,
  onChange,
  disabled,
}: PassengerSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleChange = (type: keyof PassengerCount, delta: number) => {
    const newValue = { ...value };
    newValue[type] = Math.max(
      type === "adults" ? 1 : 0,
      newValue[type] + delta
    );
    // Max 9 passengers total
    const total = newValue.adults + newValue.children + newValue.infants;
    if (total <= 9) {
      onChange(newValue);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        startIcon={<Person sx={{ fontSize: "1.1rem !important" }} />}
        endIcon={<KeyboardArrowDown sx={{ fontSize: "1.1rem !important" }} />}
        size="small"
        sx={{
          textTransform: "none",
          color: "text.primary",
          minWidth: "auto",
          whiteSpace: "nowrap",
          fontSize: "0.875rem",
          py: 0.5,
          px: 1,
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        {getPassengerSummary(value)}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          {/* Adults */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="body1">Adults</Typography>
              <Typography variant="caption" color="text.secondary">
                12+ years
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleChange("adults", -1)}
                disabled={value.adults <= 1}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography sx={{ minWidth: 24, textAlign: "center" }}>
                {value.adults}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleChange("adults", 1)}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Children */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="body1">Children</Typography>
              <Typography variant="caption" color="text.secondary">
                2-11 years
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleChange("children", -1)}
                disabled={value.children <= 0}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography sx={{ minWidth: 24, textAlign: "center" }}>
                {value.children}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleChange("children", 1)}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Infants */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="body1">Infants</Typography>
              <Typography variant="caption" color="text.secondary">
                Under 2 years
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleChange("infants", -1)}
                disabled={value.infants <= 0}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography sx={{ minWidth: 24, textAlign: "center" }}>
                {value.infants}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleChange("infants", 1)}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleClose}
            sx={{ mt: 2 }}
          >
            Done
          </Button>
        </Box>
      </Popover>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SearchForm({
  onSubmit,
  isLoading = false,
  initialValues,
}: SearchFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  // Medium screen: 900-1200px (between md and lg)
  const isMediumScreen = useMediaQuery(
    "(min-width: 900px) and (max-width: 1200px)"
  );

  // Default dates: today for departure, tomorrow for return
  const today = getMinDate();
  const tomorrow = addDays(today, 1);

  // Form state with new fields
  const [values, setValues] = useState<SearchFormValues>({
    tripType: initialValues?.tripType ?? "round-trip",
    origin: initialValues?.origin ?? null,
    destination: initialValues?.destination ?? null,
    departureDate: initialValues?.departureDate ?? formatDateToString(today),
    returnDate: initialValues?.returnDate ?? formatDateToString(tomorrow),
    passengers: initialValues?.passengers ?? {
      adults: 1,
      children: 0,
      infants: 0,
    },
    travelClass: initialValues?.travelClass ?? "ECONOMY",
  });

  // Date state for MUI X date pickers (using Date objects internally)
  const [departureDate, setDepartureDate] = useState<Date | null>(
    initialValues?.departureDate
      ? parseDateFromString(initialValues.departureDate)
      : today
  );
  const [dateRange, setDateRange] = useState<DateRange>([
    initialValues?.departureDate
      ? parseDateFromString(initialValues.departureDate)
      : today,
    initialValues?.returnDate
      ? parseDateFromString(initialValues.returnDate)
      : tomorrow,
  ]);

  // Search input states
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");

  const originSearch = useAirportSearch(originInput, { debounceMs: 300 });
  const destinationSearch = useAirportSearch(destinationInput, {
    debounceMs: 300,
  });

  // Include current value in options if not already present (for pre-filled values)
  const originOptions = useMemo(() => {
    const searchOptions = flattenOptions(originSearch.data);
    // If we have a selected value and it's not in the search results, add it
    if (
      values.origin &&
      !searchOptions.some((opt) => opt.code === values.origin?.code)
    ) {
      return [...searchOptions, values.origin];
    }
    return searchOptions;
  }, [originSearch.data, values.origin]);

  const destinationOptions = useMemo(() => {
    const searchOptions = flattenOptions(destinationSearch.data);
    // If we have a selected value and it's not in the search results, add it
    if (
      values.destination &&
      !searchOptions.some((opt) => opt.code === values.destination?.code)
    ) {
      return [...searchOptions, values.destination];
    }
    return searchOptions;
  }, [destinationSearch.data, values.destination]);

  // Sync form state when initialValues change (e.g., when location data is fetched)
  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({
        tripType: initialValues.tripType ?? prev.tripType,
        origin: initialValues.origin ?? prev.origin,
        destination: initialValues.destination ?? prev.destination,
        departureDate: initialValues.departureDate ?? prev.departureDate,
        returnDate: initialValues.returnDate ?? prev.returnDate,
        passengers: initialValues.passengers ?? prev.passengers,
        travelClass: initialValues.travelClass ?? prev.travelClass,
      }));

      // Also sync date states
      if (initialValues.departureDate) {
        const depDate = parseDateFromString(initialValues.departureDate);
        setDepartureDate(depDate);
        setDateRange((prev) => [depDate, prev[1]]);
      }
      if (initialValues.returnDate) {
        const retDate = parseDateFromString(initialValues.returnDate);
        setDateRange((prev) => [prev[0], retDate]);
      }
    }
  }, [
    initialValues?.origin?.code,
    initialValues?.destination?.code,
    initialValues?.departureDate,
    initialValues?.returnDate,
    initialValues?.tripType,
    initialValues?.passengers?.adults,
    initialValues?.passengers?.children,
    initialValues?.passengers?.infants,
    initialValues?.travelClass,
  ]);

  const [touched, setTouched] = useState({
    origin: false,
    destination: false,
    departureDate: false,
    returnDate: false,
  });

  const validation = useMemo(() => validateForm(values), [values]);

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

  // Handle departure date change for one-way trips
  const handleDepartureDateChange = useCallback((date: Date | null) => {
    setDepartureDate(date);
    setValues((prev) => ({
      ...prev,
      departureDate: formatDateToString(date),
    }));
  }, []);

  // Handle date range change for round-trip
  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
    setValues((prev) => ({
      ...prev,
      departureDate: formatDateToString(newRange[0]),
      returnDate: formatDateToString(newRange[1]),
    }));
  }, []);

  // Handle trip type change
  const handleTripTypeChange = useCallback(
    (newTripType: TripType) => {
      setValues((prev) => ({
        ...prev,
        tripType: newTripType,
        // Clear return date when switching to one-way
        returnDate: newTripType === "one-way" ? "" : prev.returnDate,
      }));

      // Sync date states when switching trip types
      if (newTripType === "one-way") {
        setDepartureDate(dateRange[0]);
      } else {
        setDateRange([departureDate, null]);
      }
    },
    [dateRange, departureDate]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
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

  const getFieldError = (field: keyof typeof touched) => {
    return touched[field] ? validation.errors[field] : undefined;
  };

  const getOptionLabel = (option: AutocompleteOption) => {
    if (option.isNested) {
      return `${option.name} (${option.code})`;
    }
    return option.type === "CITY"
      ? `${option.cityName}, ${option.countryName}`
      : `${option.name} (${option.code})`;
  };

  const renderOption = (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: AutocompleteOption
  ) => {
    const isCity = option.type === "CITY";
    return (
      <li
        {...props}
        key={option.id}
        style={{
          ...props.style,
          paddingLeft: option.isNested ? 32 : 16,
          backgroundColor: option.isNested ? "rgba(0,0,0,0.02)" : undefined,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}
        >
          {isCity ? (
            <LocationCity fontSize="small" color="action" />
          ) : (
            <LocalAirport fontSize="small" color="primary" />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              fontWeight={option.isNested ? 400 : 600}
              component="span"
            >
              {option.code}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ ml: 1 }}
            >
              {option.isNested
                ? option.name
                : isCity
                ? `${option.cityName}, ${option.countryName}`
                : `${option.cityName}`}
            </Typography>
          </Box>
        </Box>
      </li>
    );
  };

  const minDate = getMinDate();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Flight search form"
      sx={{ width: "100%", mx: "auto" }}
    >
      {/* Options Row - Trip Type, Passengers, Class */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        alignItems="center"
      >
        {/* Trip Type */}
        <FormControl size="small" variant="standard">
          <Select
            value={values.tripType}
            onChange={(e) => handleTripTypeChange(e.target.value as TripType)}
            disabled={isLoading}
            disableUnderline
            sx={{
              fontSize: "0.875rem",
              "& .MuiSelect-select": {
                py: 0.5,
                px: 1,
                "&:focus": { backgroundColor: "transparent" },
              },
              "&:hover": { backgroundColor: "action.hover", borderRadius: 1 },
            }}
          >
            {TRIP_TYPE_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{ fontSize: "0.875rem" }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Passengers */}
        <PassengerSelector
          value={values.passengers}
          onChange={(passengers) =>
            setValues((prev) => ({ ...prev, passengers }))
          }
          disabled={isLoading}
        />

        {/* Travel Class */}
        <FormControl size="small" variant="standard">
          <Select
            value={values.travelClass}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                travelClass: e.target.value as TravelClass,
              }))
            }
            disabled={isLoading}
            disableUnderline
            sx={{
              fontSize: "0.875rem",
              "& .MuiSelect-select": {
                py: 0.5,
                px: 1,
                "&:focus": { backgroundColor: "transparent" },
              },
              "&:hover": { backgroundColor: "action.hover", borderRadius: 1 },
            }}
          >
            {TRAVEL_CLASS_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{ fontSize: "0.875rem" }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Main Search Fields */}
      {/* Large screens (>1200px): all on one row */}
      {/* Medium screens (900-1200px): two rows */}
      {/* Mobile (<900px): stacked vertically */}
      <Stack spacing={isMobile || isMediumScreen ? 2 : 0}>
        {/* Row 1: Origin & Destination (+ dates/search on large screens) */}
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={isMobile ? 2 : 1}
          alignItems={isMobile ? "stretch" : "center"}
        >
          {/* Origin */}
          <Autocomplete
            id="origin-airport"
            options={originOptions}
            forcePopupIcon={false}
            value={values.origin}
            onChange={(_, newValue) => {
              setValues((prev) => ({ ...prev, origin: newValue }));
            }}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === "input") {
                setOriginInput(newInputValue);
              }
            }}
            onBlur={() => handleFieldBlur("origin")}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            filterOptions={(x) => x}
            loading={originSearch.isLoading}
            disabled={isLoading}
            fullWidth
            sx={{
              minWidth: { xs: "100%", md: 200 },
              position: "relative",
              "& .MuiFormHelperText-root": {
                position: "absolute",
                bottom: -20,
                left: 0,
                margin: 0,
              },
            }}
            slotProps={{
              paper: { sx: { minWidth: 450, maxWidth: 500 } },
              popper: { sx: { minWidth: 450 }, placement: "bottom-start" },
            }}
            renderOption={(props, option) => renderOption(props, option)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="From"
                placeholder="City or airport"
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
                  endAdornment: (
                    <>
                      {originSearch.isLoading && (
                        <CircularProgress color="inherit" size={20} />
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  "aria-label": "Departure airport or city",
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
            options={destinationOptions}
            forcePopupIcon={false}
            value={values.destination}
            onChange={(_, newValue) => {
              setValues((prev) => ({ ...prev, destination: newValue }));
            }}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === "input") {
                setDestinationInput(newInputValue);
              }
            }}
            onBlur={() => handleFieldBlur("destination")}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            filterOptions={(x) => x}
            loading={destinationSearch.isLoading}
            disabled={isLoading}
            fullWidth
            sx={{
              minWidth: { xs: "100%", md: 200 },
              position: "relative",
              "& .MuiFormHelperText-root": {
                position: "absolute",
                bottom: -20,
                left: 0,
                margin: 0,
              },
            }}
            slotProps={{
              paper: { sx: { minWidth: 450, maxWidth: 500 } },
              popper: { sx: { minWidth: 450 }, placement: "bottom-start" },
            }}
            renderOption={(props, option) => renderOption(props, option)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="To"
                placeholder="City or airport"
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
                  endAdornment: (
                    <>
                      {destinationSearch.isLoading && (
                        <CircularProgress color="inherit" size={20} />
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  "aria-label": "Arrival airport or city",
                }}
              />
            )}
          />

          {/* Large screen only: Date fields and search button on same row */}
          {!isMobile && !isMediumScreen && (
            <>
              {values.tripType === "one-way" && (
                <CustomDateField
                  label="Departure"
                  value={departureDate}
                  onChange={handleDepartureDateChange}
                  onBlur={() => handleFieldBlur("departureDate")}
                  minDate={minDate}
                  disabled={isLoading}
                  required
                  error={!!getFieldError("departureDate")}
                  helperText={getFieldError("departureDate")}
                />
              )}

              {values.tripType === "round-trip" && (
                <>
                  <CustomDateField
                    label="Departure"
                    value={dateRange[0]}
                    onChange={(date) =>
                      handleDateRangeChange([date, dateRange[1]])
                    }
                    onBlur={() => handleFieldBlur("departureDate")}
                    minDate={minDate}
                    disabled={isLoading}
                    required
                    error={!!getFieldError("departureDate")}
                    helperText={getFieldError("departureDate")}
                  />
                  <CustomDateField
                    label="Return"
                    value={dateRange[1]}
                    onChange={(date) =>
                      handleDateRangeChange([dateRange[0], date])
                    }
                    onBlur={() => handleFieldBlur("returnDate")}
                    minDate={dateRange[0] || minDate}
                    disabled={isLoading}
                    error={!!getFieldError("returnDate")}
                    helperText={getFieldError("returnDate")}
                  />
                </>
              )}

              {values.tripType === "multi-city" && (
                <CustomDateField
                  label="Departure"
                  value={departureDate}
                  onChange={handleDepartureDateChange}
                  onBlur={() => handleFieldBlur("departureDate")}
                  minDate={minDate}
                  disabled={isLoading}
                  required
                  error={!!getFieldError("departureDate")}
                  helperText={getFieldError("departureDate")}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading || !validation.isValid}
                startIcon={<Search />}
                sx={{
                  height: 56,
                  minWidth: 140,
                  flexShrink: 0,
                }}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </>
          )}
        </Stack>

        {/* Row 2: Date Fields + Search Button (mobile and medium screens only) */}
        {(isMobile || isMediumScreen) && (
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "stretch" : "flex-start"}
          >
            {/* Date Fields */}
            {values.tripType === "one-way" && (
              <CustomDateField
                label="Departure"
                value={departureDate}
                onChange={handleDepartureDateChange}
                onBlur={() => handleFieldBlur("departureDate")}
                minDate={minDate}
                disabled={isLoading}
                required
                error={!!getFieldError("departureDate")}
                helperText={getFieldError("departureDate")}
              />
            )}

            {values.tripType === "round-trip" && (
              <>
                <CustomDateField
                  label="Departure"
                  value={dateRange[0]}
                  onChange={(date) =>
                    handleDateRangeChange([date, dateRange[1]])
                  }
                  onBlur={() => handleFieldBlur("departureDate")}
                  minDate={minDate}
                  disabled={isLoading}
                  required
                  error={!!getFieldError("departureDate")}
                  helperText={getFieldError("departureDate")}
                />
                <CustomDateField
                  label="Return"
                  value={dateRange[1]}
                  onChange={(date) =>
                    handleDateRangeChange([dateRange[0], date])
                  }
                  onBlur={() => handleFieldBlur("returnDate")}
                  minDate={dateRange[0] || minDate}
                  disabled={isLoading}
                  error={!!getFieldError("returnDate")}
                  helperText={getFieldError("returnDate")}
                />
              </>
            )}

            {values.tripType === "multi-city" && (
              <CustomDateField
                label="Departure"
                value={departureDate}
                onChange={handleDepartureDateChange}
                onBlur={() => handleFieldBlur("departureDate")}
                minDate={minDate}
                disabled={isLoading}
                required
                error={!!getFieldError("departureDate")}
                helperText={getFieldError("departureDate")}
              />
            )}

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
        )}
      </Stack>
    </Box>
  );
}

export default SearchForm;
