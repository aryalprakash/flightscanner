import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Button,
  Stack,
  Skeleton,
  Grid,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import { FlightTakeoff, FilterList, Close } from "@mui/icons-material";

import { useFlightSearch } from "@/hooks";
import { FlightCard, FlightFilters } from "@/components/flight";
import { SearchForm } from "@/components/forms/SearchForm";
import { useLocationStore } from "@/store";
import { getLocationByCode } from "@/api/services/locationService";
import type { LocationSearchResult } from "@/api/services/locationService";
import type { FlightOffer } from "@/api/types/flightOffer";
import type {
  SearchFormValues,
  TripType,
  TravelClass,
  PassengerCount,
} from "@/components/forms/SearchForm/SearchForm.types";
import type { FlightSearchParams } from "@/api/types/amadeus";

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Mobile filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Extract search params
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");

  // Extract additional params
  const tripType = (searchParams.get("tripType") as TripType) || "round-trip";
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const infants = parseInt(searchParams.get("infants") || "0", 10);
  const travelClass =
    (searchParams.get("travelClass") as TravelClass) || "ECONOMY";

  // Get setSelectedLocations for handleSearch
  const setSelectedLocations = useLocationStore(
    (state) => state.setSelectedLocations
  );

  // State for prefetched locations
  const [originLocation, setOriginLocation] =
    useState<LocationSearchResult | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<LocationSearchResult | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  // Fetch location data for prefilling the form
  // First check cache/store, then fetch if needed
  useEffect(() => {
    const fetchLocations = async () => {
      // Get current store state directly to avoid stale closures
      const storeState = useLocationStore.getState();

      let originResult: LocationSearchResult | null = null;
      let destResult: LocationSearchResult | null = null;

      // Check if we have cached data from store that matches URL params
      if (origin) {
        // First check if selectedOrigin matches
        if (storeState.selectedOrigin?.code === origin) {
          originResult = storeState.selectedOrigin;
        } else {
          // Try to get from cache
          originResult = storeState.getLocation(origin);
          // If not in cache, fetch from API
          if (!originResult) {
            originResult = await getLocationByCode(origin);
          }
        }
      }

      if (destination) {
        // First check if selectedDestination matches
        if (storeState.selectedDestination?.code === destination) {
          destResult = storeState.selectedDestination;
        } else {
          // Try to get from cache
          destResult = storeState.getLocation(destination);
          // If not in cache, fetch from API
          if (!destResult) {
            destResult = await getLocationByCode(destination);
          }
        }
      }

      // Update local state
      setOriginLocation(originResult);
      setDestinationLocation(destResult);

      // Update store with fetched locations for future use
      if (originResult || destResult) {
        storeState.setSelectedLocations(originResult, destResult);
      }

      setIsLoadingLocations(false);
    };

    setIsLoadingLocations(true);
    fetchLocations();
  }, [origin, destination]); // Only depend on URL params

  // Build passenger count object
  const passengers: PassengerCount = useMemo(
    () => ({
      adults: Math.max(1, Math.min(9, adults)),
      children: Math.max(0, Math.min(8, children)),
      infants: Math.max(0, Math.min(4, infants)),
    }),
    [adults, children, infants]
  );

  // Build initial values for the form
  const initialFormValues = useMemo<Partial<SearchFormValues>>(
    () => ({
      tripType,
      origin: originLocation,
      destination: destinationLocation,
      departureDate: departureDate || "",
      returnDate: returnDate || "",
      passengers,
      travelClass,
    }),
    [
      tripType,
      originLocation,
      destinationLocation,
      departureDate,
      returnDate,
      passengers,
      travelClass,
    ]
  );

  // Build search params object
  const flightSearchParams = useMemo<FlightSearchParams | null>(() => {
    if (!origin || !destination || !departureDate) {
      return null;
    }
    return {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults: passengers.adults,
      children: passengers.children > 0 ? passengers.children : undefined,
      infants: passengers.infants > 0 ? passengers.infants : undefined,
      travelClass: travelClass !== "ECONOMY" ? travelClass : undefined,
      max: 20, // Limit results for demo
    };
  }, [origin, destination, departureDate, returnDate, passengers, travelClass]);

  // Use the flight search hook
  const { data, isLoading, isError, error, refetch } = useFlightSearch(
    flightSearchParams,
    { enabled: !!flightSearchParams }
  );

  // Filtered offers state
  const [filteredOffers, setFilteredOffers] = useState<FlightOffer[] | null>(
    null
  );

  // Handle filter changes
  const handleFilterChange = useCallback((filtered: FlightOffer[]) => {
    setFilteredOffers(filtered);
  }, []);

  // Reset filtered offers when data changes
  const displayedOffers = filteredOffers ?? data?.offers ?? [];

  // Handle search form submission
  const handleSearch = (values: SearchFormValues) => {
    if (!values.origin || !values.destination) return;

    // Save selected locations to store for future use
    setSelectedLocations(values.origin, values.destination);

    const params = new URLSearchParams({
      origin: values.origin.code,
      destination: values.destination.code,
      departureDate: values.departureDate,
    });

    if (values.returnDate) {
      params.set("returnDate", values.returnDate);
    }

    // Add trip type
    if (values.tripType !== "round-trip") {
      params.set("tripType", values.tripType);
    }

    // Add passenger params
    if (values.passengers.adults !== 1) {
      params.set("adults", values.passengers.adults.toString());
    }
    if (values.passengers.children > 0) {
      params.set("children", values.passengers.children.toString());
    }
    if (values.passengers.infants > 0) {
      params.set("infants", values.passengers.infants.toString());
    }

    // Add travel class
    if (values.travelClass !== "ECONOMY") {
      params.set("travelClass", values.travelClass);
    }

    // Update URL with new search params
    setSearchParams(params);
  };

  // Validate required params
  if (!origin || !destination || !departureDate) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Missing search parameters. Please start a new search.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ flex: 1, py: 3 }}>
      <Container maxWidth="lg">
        {/* Brand Header */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 3,
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          <FlightTakeoff sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h5"
            component="span"
            color="primary.main"
            fontWeight={700}
          >
            FlightScanner
          </Typography>
        </Box>

        {/* Search Form */}
        <Paper sx={{ px: 3, pb: 4, pt: 1, mb: 3 }}>
          {isLoadingLocations ? (
            <Box sx={{ py: 3 }}>
              <Stack direction="row" spacing={2}>
                <Skeleton variant="rectangular" height={56} sx={{ flex: 1 }} />
                <Skeleton variant="rectangular" height={56} sx={{ flex: 1 }} />
                <Skeleton variant="rectangular" height={56} width={150} />
                <Skeleton variant="rectangular" height={56} width={120} />
              </Stack>
            </Box>
          ) : (
            <SearchForm
              onSubmit={handleSearch}
              isLoading={isLoading}
              initialValues={initialFormValues}
              key={`${origin}-${destination}-${departureDate}`}
            />
          )}
        </Paper>

        {/* Results Header with Mobile Filter Button */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {isLoading
              ? "Searching..."
              : data
              ? filteredOffers
                ? `${displayedOffers.length} of ${data.meta.totalCount} flights`
                : `${data.meta.totalCount} flights found`
              : ""}
          </Typography>

          {/* Mobile Filter Button */}
          {isMobile && data && data.offers.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={
                <Badge
                  color="primary"
                  variant="dot"
                  invisible={
                    !filteredOffers ||
                    filteredOffers.length === data.offers.length
                  }
                >
                  <FilterList />
                </Badge>
              }
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ textTransform: "none" }}
            >
              Filters
            </Button>
          )}
        </Stack>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="bottom"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: {
              maxHeight: "85vh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            {/* Drawer Header */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
              <IconButton
                onClick={() => setFilterDrawerOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Stack>

            {/* Filters Content */}
            {data && (
              <FlightFilters
                offers={data.offers}
                onFilterChange={(filtered) => {
                  handleFilterChange(filtered);
                }}
              />
            )}

            {/* Apply Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ mt: 2 }}
            >
              Show {displayedOffers.length} Results
            </Button>
          </Box>
        </Drawer>

        {/* Loading State */}
        {isLoading && (
          <Box>
            {[1, 2, 3].map((i) => (
              <Paper key={i} sx={{ mb: 2, p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={32}
                      sx={{ my: 1 }}
                    />
                    <Skeleton variant="text" width="30%" height={20} />
                  </Box>
                  <Box sx={{ minWidth: 120, textAlign: "center" }}>
                    <Skeleton variant="text" width="100%" height={40} />
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={36}
                      sx={{ mt: 1, borderRadius: 1 }}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        {/* Error State */}
        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" fontWeight={600}>
              {error?.message || "Failed to search flights"}
            </Typography>
            {error?.details && (
              <Typography variant="caption" display="block">
                {error.details}
              </Typography>
            )}
          </Alert>
        )}

        {/* Results with Filters */}
        {data && !isLoading && (
          <>
            {data.offers.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No flights found for this route. Try different dates.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {/* Filters Sidebar */}
                <Grid
                  item
                  xs={12}
                  md={3}
                  sx={{ display: { xs: "none", md: "block" } }}
                >
                  <Box sx={{ position: "sticky", top: 16 }}>
                    <FlightFilters
                      offers={data.offers}
                      onFilterChange={handleFilterChange}
                    />
                  </Box>
                </Grid>

                {/* Flight Results */}
                <Grid item xs={12} md={9}>
                  {displayedOffers.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No flights match your filters. Try adjusting your
                        criteria.
                      </Typography>
                    </Paper>
                  ) : (
                    displayedOffers.map((offer) => (
                      <FlightCard
                        key={offer.id}
                        offer={offer}
                        onSelect={(selectedOffer) => {
                          console.log("Selected offer:", selectedOffer);
                          // TODO: Navigate to booking page
                        }}
                      />
                    ))
                  )}
                </Grid>
              </Grid>
            )}
          </>
        )}

        {/* API Configuration Notice */}
        {isError && error?.code === "CONFIG_ERROR" && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>To enable real search results:</strong>
            </Typography>
            <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
              <li>
                Get API credentials from{" "}
                <a
                  href="https://developers.amadeus.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  developers.amadeus.com
                </a>
              </li>
            </ol>
          </Alert>
        )}
      </Container>
    </Box>
  );
}

export default Search;
