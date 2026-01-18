/**
 * FlightFilters Component
 *
 * Provides filtering options for flight search results:
 * - Stops (non-stop, 1 stop, 2+ stops)
 * - Airlines
 * - Price range
 * - Departure/Arrival times
 * - Duration
 */

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Collapse,
  IconButton,
  Paper,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  FilterList,
  AccessTime,
  AttachMoney,
  FlightTakeoff,
  Airlines,
} from "@mui/icons-material";
import type { FlightOffer } from "@/api/types/flightOffer";

// ============================================
// TYPES
// ============================================

export interface FlightFiltersProps {
  offers: FlightOffer[];
  onFilterChange: (filteredOffers: FlightOffer[]) => void;
  filteredCount?: number;
  totalCount?: number;
}

export interface FilterState {
  stops: number[]; // [0, 1, 2] for non-stop, 1 stop, 2+ stops
  airlines: string[];
  priceRange: [number, number];
  departureTimeRange: [number, number]; // hours 0-24
  arrivalTimeRange: [number, number]; // hours 0-24
  maxDuration: number; // in minutes
}

// ============================================
// HELPERS
// ============================================

function getOutboundItinerary(offer: FlightOffer) {
  return (
    offer.itineraries.find((it) => it.direction === "outbound") ||
    offer.itineraries[0]
  );
}

/**
 * Check if all itineraries meet the stops filter criteria
 * For round trips, both departure and return must satisfy the filter
 */
function meetsStopsFilter(offer: FlightOffer, allowedStops: number[]): boolean {
  if (allowedStops.length === 0) return true;

  // Check all itineraries (departure and return for round trips)
  for (const itinerary of offer.itineraries) {
    const stops = itinerary.stops ?? 0;
    const stopsCategory = stops >= 2 ? 2 : stops;
    if (!allowedStops.includes(stopsCategory)) {
      return false;
    }
  }
  return true;
}

function getDepartureHour(offer: FlightOffer): number {
  const outbound = getOutboundItinerary(offer);
  if (!outbound || outbound.segments.length === 0) return 0;
  const departureTime = outbound.segments[0].departure.time;
  const hour = parseInt(departureTime.split(":")[0], 10);
  return hour;
}

function getArrivalHour(offer: FlightOffer): number {
  const outbound = getOutboundItinerary(offer);
  if (!outbound || outbound.segments.length === 0) return 0;
  const lastSegment = outbound.segments[outbound.segments.length - 1];
  const arrivalTime = lastSegment.arrival.time;
  const hour = parseInt(arrivalTime.split(":")[0], 10);
  return hour;
}

function getTotalDuration(offer: FlightOffer): number {
  const outbound = getOutboundItinerary(offer);
  return outbound?.duration.totalMinutes ?? 0;
}

function formatTime(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatPrice(price: number): string {
  return `$${Math.round(price)}`;
}

// ============================================
// FILTER SECTION COMPONENT
// ============================================

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function FilterSection({
  title,
  icon,
  defaultExpanded = true,
  children,
}: FilterSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          py: 1,
          "&:hover": { bgcolor: "action.hover" },
          borderRadius: 1,
          px: 1,
          mx: -1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {icon}
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FlightFilters({ offers, onFilterChange }: FlightFiltersProps) {
  // Calculate available filter options from offers
  const filterOptions = useMemo(() => {
    if (!offers.length) {
      return {
        airlines: [] as { code: string; name: string }[],
        minPrice: 0,
        maxPrice: 1000,
        maxDuration: 1440,
        hasNonStop: false,
        hasOneStop: false,
        hasTwoPlusStops: false,
      };
    }

    const airlineMap = new Map<string, string>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let maxDuration = 0;
    let hasNonStop = false;
    let hasOneStop = false;
    let hasTwoPlusStops = false;

    offers.forEach((offer) => {
      // Airlines
      const outbound = getOutboundItinerary(offer);
      outbound?.segments.forEach((seg) => {
        if (!airlineMap.has(seg.airline.code)) {
          airlineMap.set(seg.airline.code, seg.airline.name);
        }
      });

      // Price
      const price = offer.price.total;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;

      // Duration
      const duration = getTotalDuration(offer);
      if (duration > maxDuration) {
        maxDuration = duration;
      }

      // Stops - check all itineraries for round trips
      offer.itineraries.forEach((itinerary) => {
        const stops = itinerary.stops ?? 0;
        if (stops === 0) hasNonStop = true;
        else if (stops === 1) hasOneStop = true;
        else hasTwoPlusStops = true;
      });
    });

    return {
      airlines: Array.from(airlineMap.entries()).map(([code, name]) => ({
        code,
        name,
      })),
      minPrice: Math.floor(minPrice),
      maxPrice: Math.ceil(maxPrice),
      maxDuration: Math.ceil(maxDuration / 30) * 30, // Round up to nearest 30 mins
      hasNonStop,
      hasOneStop,
      hasTwoPlusStops,
    };
  }, [offers]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    stops: [], // Empty means all stops accepted
    airlines: [], // Empty means all airlines accepted
    priceRange: [filterOptions.minPrice, filterOptions.maxPrice],
    departureTimeRange: [0, 24],
    arrivalTimeRange: [0, 24],
    maxDuration: filterOptions.maxDuration,
  });

  // Apply filters
  const applyFilters = useCallback(
    (newFilters: FilterState) => {
      const filtered = offers.filter((offer) => {
        // Filter by stops - checks both departure and return for round trips
        if (!meetsStopsFilter(offer, newFilters.stops)) {
          return false;
        }

        // Filter by airlines
        if (newFilters.airlines.length > 0) {
          const outbound = getOutboundItinerary(offer);
          const offerAirlines = new Set(
            outbound?.segments.map((s) => s.airline.code) ?? []
          );
          const hasSelectedAirline = newFilters.airlines.some((a) =>
            offerAirlines.has(a)
          );
          if (!hasSelectedAirline) {
            return false;
          }
        }

        // Filter by price
        const price = offer.price.total;
        if (
          price < newFilters.priceRange[0] ||
          price > newFilters.priceRange[1]
        ) {
          return false;
        }

        // Filter by departure time
        const depHour = getDepartureHour(offer);
        if (
          depHour < newFilters.departureTimeRange[0] ||
          depHour > newFilters.departureTimeRange[1]
        ) {
          return false;
        }

        // Filter by arrival time
        const arrHour = getArrivalHour(offer);
        if (
          arrHour < newFilters.arrivalTimeRange[0] ||
          arrHour > newFilters.arrivalTimeRange[1]
        ) {
          return false;
        }

        // Filter by duration
        if (getTotalDuration(offer) > newFilters.maxDuration) {
          return false;
        }

        return true;
      });

      onFilterChange(filtered);
    },
    [offers, onFilterChange]
  );

  // Handle filter changes
  const handleStopsChange = (stop: number) => {
    const newStops = filters.stops.includes(stop)
      ? filters.stops.filter((s) => s !== stop)
      : [...filters.stops, stop];
    const newFilters = { ...filters, stops: newStops };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleAirlineChange = (code: string) => {
    const newAirlines = filters.airlines.includes(code)
      ? filters.airlines.filter((a) => a !== code)
      : [...filters.airlines, code];
    const newFilters = { ...filters, airlines: newAirlines };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handlePriceChange = (_: Event, value: number | number[]) => {
    const newFilters = {
      ...filters,
      priceRange: value as [number, number],
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleDepartureTimeChange = (_: Event, value: number | number[]) => {
    const newFilters = {
      ...filters,
      departureTimeRange: value as [number, number],
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleArrivalTimeChange = (_: Event, value: number | number[]) => {
    const newFilters = {
      ...filters,
      arrivalTimeRange: value as [number, number],
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleDurationChange = (_: Event, value: number | number[]) => {
    const newFilters = {
      ...filters,
      maxDuration: value as number,
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.stops.length > 0) count++;
    if (filters.airlines.length > 0) count++;
    if (
      filters.priceRange[0] > filterOptions.minPrice ||
      filters.priceRange[1] < filterOptions.maxPrice
    )
      count++;
    if (filters.departureTimeRange[0] > 0 || filters.departureTimeRange[1] < 24)
      count++;
    if (filters.arrivalTimeRange[0] > 0 || filters.arrivalTimeRange[1] < 24)
      count++;
    if (filters.maxDuration < filterOptions.maxDuration) count++;
    return count;
  }, [filters, filterOptions]);

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      stops: [],
      airlines: [],
      priceRange: [filterOptions.minPrice, filterOptions.maxPrice],
      departureTimeRange: [0, 24],
      arrivalTimeRange: [0, 24],
      maxDuration: filterOptions.maxDuration,
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  if (!offers.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: "0.75rem" }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {activeFiltersCount > 0 && (
            <Chip
              label="Clear all"
              size="small"
              onClick={clearFilters}
              sx={{ cursor: "pointer" }}
            />
          )}
        </Box>
      </Box>

      {/* Stops Filter */}
      <FilterSection
        title="Stops"
        icon={<FlightTakeoff fontSize="small" color="action" />}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {filterOptions.hasNonStop && (
            <Chip
              label="Non-stop"
              variant={filters.stops.includes(0) ? "filled" : "outlined"}
              color={filters.stops.includes(0) ? "primary" : "default"}
              onClick={() => handleStopsChange(0)}
              sx={{ cursor: "pointer" }}
            />
          )}
          {filterOptions.hasOneStop && (
            <Chip
              label="1 stop"
              variant={filters.stops.includes(1) ? "filled" : "outlined"}
              color={filters.stops.includes(1) ? "primary" : "default"}
              onClick={() => handleStopsChange(1)}
              sx={{ cursor: "pointer" }}
            />
          )}
          {filterOptions.hasTwoPlusStops && (
            <Chip
              label="2+ stops"
              variant={filters.stops.includes(2) ? "filled" : "outlined"}
              color={filters.stops.includes(2) ? "primary" : "default"}
              onClick={() => handleStopsChange(2)}
              sx={{ cursor: "pointer" }}
            />
          )}
        </Stack>
      </FilterSection>

      {/* Airlines Filter */}
      {filterOptions.airlines.length > 0 && (
        <FilterSection
          title="Airlines"
          icon={<Airlines fontSize="small" color="action" />}
          defaultExpanded={filterOptions.airlines.length <= 5}
        >
          <FormGroup>
            {filterOptions.airlines.map((airline) => (
              <FormControlLabel
                key={airline.code}
                control={
                  <Checkbox
                    checked={filters.airlines.includes(airline.code)}
                    onChange={() => handleAirlineChange(airline.code)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {airline.name} ({airline.code})
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </FilterSection>
      )}

      {/* Price Filter */}
      <FilterSection
        title="Price"
        icon={<AttachMoney fontSize="small" color="action" />}
      >
        <Box sx={{ px: 1 }}>
          <Slider
            value={filters.priceRange}
            onChange={handlePriceChange}
            min={filterOptions.minPrice}
            max={filterOptions.maxPrice}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPrice}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: -0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatPrice(filters.priceRange[0])}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPrice(filters.priceRange[1])}
            </Typography>
          </Box>
        </Box>
      </FilterSection>

      {/* Departure Time Filter */}
      <FilterSection
        title="Departure Time"
        icon={<AccessTime fontSize="small" color="action" />}
      >
        <Box sx={{ px: 1 }}>
          <Slider
            value={filters.departureTimeRange}
            onChange={handleDepartureTimeChange}
            min={0}
            max={24}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={formatTime}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: -0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatTime(filters.departureTimeRange[0])}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(filters.departureTimeRange[1])}
            </Typography>
          </Box>
        </Box>
      </FilterSection>

      {/* Arrival Time Filter */}
      <FilterSection
        title="Arrival Time"
        icon={<AccessTime fontSize="small" color="action" />}
      >
        <Box sx={{ px: 1 }}>
          <Slider
            value={filters.arrivalTimeRange}
            onChange={handleArrivalTimeChange}
            min={0}
            max={24}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={formatTime}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: -0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatTime(filters.arrivalTimeRange[0])}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(filters.arrivalTimeRange[1])}
            </Typography>
          </Box>
        </Box>
      </FilterSection>

      {/* Duration Filter */}
      <FilterSection
        title="Duration"
        icon={<AccessTime fontSize="small" color="action" />}
      >
        <Box sx={{ px: 1 }}>
          <Slider
            value={filters.maxDuration}
            onChange={handleDurationChange}
            min={60}
            max={filterOptions.maxDuration}
            step={30}
            valueLabelDisplay="auto"
            valueLabelFormat={formatDuration}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: -0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              1h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Up to {formatDuration(filters.maxDuration)}
            </Typography>
          </Box>
        </Box>
      </FilterSection>
    </Paper>
  );
}

export default FlightFilters;
