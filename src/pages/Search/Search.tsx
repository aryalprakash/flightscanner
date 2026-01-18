import { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
  CircularProgress,
} from "@mui/material";
import { FlightTakeoff, FilterList, Close } from "@mui/icons-material";

import { useFlightSearch } from "@/hooks";
import {
  FlightCard,
  FlightFilters,
  FlightHighlights,
  PriceTrendGraph,
} from "@/components/flight";
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

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");

  const tripType = (searchParams.get("tripType") as TripType) || "round-trip";
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const infants = parseInt(searchParams.get("infants") || "0", 10);
  const travelClass =
    (searchParams.get("travelClass") as TravelClass) || "ECONOMY";

  const setSelectedLocations = useLocationStore(
    (state) => state.setSelectedLocations
  );

  const [originLocation, setOriginLocation] =
    useState<LocationSearchResult | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<LocationSearchResult | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      const storeState = useLocationStore.getState();

      let originResult: LocationSearchResult | null = null;
      let destResult: LocationSearchResult | null = null;

      if (origin) {
        if (storeState.selectedOrigin?.code === origin) {
          originResult = storeState.selectedOrigin;
        } else {
          originResult = storeState.getLocation(origin);
          // If not in cache, fetch from API
          if (!originResult) {
            originResult = await getLocationByCode(origin);
          }
        }
      }

      if (destination) {
        if (storeState.selectedDestination?.code === destination) {
          destResult = storeState.selectedDestination;
        } else {
          destResult = storeState.getLocation(destination);
          if (!destResult) {
            destResult = await getLocationByCode(destination);
          }
        }
      }

      setOriginLocation(originResult);
      setDestinationLocation(destResult);

      if (originResult || destResult) {
        storeState.setSelectedLocations(originResult, destResult);
      }

      setIsLoadingLocations(false);
    };

    setIsLoadingLocations(true);
    fetchLocations();
  }, [origin, destination]);

  const passengers: PassengerCount = useMemo(
    () => ({
      adults: Math.max(1, Math.min(9, adults)),
      children: Math.max(0, Math.min(8, children)),
      infants: Math.max(0, Math.min(4, infants)),
    }),
    [adults, children, infants]
  );

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
      // max: 20,
    };
  }, [origin, destination, departureDate, returnDate, passengers, travelClass]);

  const { data, isLoading, isError, error, refetch } = useFlightSearch(
    flightSearchParams,
    { enabled: !!flightSearchParams }
  );

  const [filteredOffers, setFilteredOffers] = useState<FlightOffer[] | null>(
    null
  );

  // Infinite scroll state
  const ITEMS_PER_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = useCallback((filtered: FlightOffer[]) => {
    setFilteredOffers(filtered);
    setVisibleCount(ITEMS_PER_PAGE); // Reset when filters change
  }, []);

  // Reset visible count when data changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [data]);

  const allOffers = filteredOffers ?? data?.offers ?? [];
  const displayedOffers = allOffers.slice(0, visibleCount);
  const hasMoreOffers = visibleCount < allOffers.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreOffers && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate loading delay for smoother UX
          setTimeout(() => {
            setVisibleCount((prev) =>
              Math.min(prev + ITEMS_PER_PAGE, allOffers.length)
            );
            setIsLoadingMore(false);
          }, 300);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMoreOffers, isLoadingMore, allOffers.length]);

  const handleSearch = (values: SearchFormValues) => {
    if (!values.origin || !values.destination) return;

    setSelectedLocations(values.origin, values.destination);

    const params = new URLSearchParams({
      origin: values.origin.code,
      destination: values.destination.code,
      departureDate: values.departureDate,
    });

    if (values.returnDate) {
      params.set("returnDate", values.returnDate);
    }

    if (values.tripType !== "round-trip") {
      params.set("tripType", values.tripType);
    }

    if (values.passengers.adults !== 1) {
      params.set("adults", values.passengers.adults.toString());
    }
    if (values.passengers.children > 0) {
      params.set("children", values.passengers.children.toString());
    }
    if (values.passengers.infants > 0) {
      params.set("infants", values.passengers.infants.toString());
    }

    if (values.travelClass !== "ECONOMY") {
      params.set("travelClass", values.travelClass);
    }

    setSearchParams(params);
  };

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

        {isMobile && data && data.offers.length > 0 && (
          <Box sx={{ mb: 2 }}>
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
              Filters{" "}
              {filteredOffers
                ? `(${displayedOffers.length} of ${data.meta.totalCount})`
                : `(${data.meta.totalCount})`}
            </Button>
          </Box>
        )}

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

            {data && (
              <FlightFilters
                offers={data.offers}
                onFilterChange={(filtered) => {
                  handleFilterChange(filtered);
                }}
              />
            )}

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
                      filteredCount={displayedOffers.length}
                      totalCount={data.meta.totalCount}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={9}>
                  {displayedOffers.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No flights match your filters. Try adjusting your
                        criteria.
                      </Typography>
                    </Paper>
                  ) : (
                    <>
                      <FlightHighlights
                        offers={allOffers}
                        onSelect={(offer) => {
                          console.log("Selected highlighted offer:", offer);
                          // Scroll to the flight card or highlight it
                          const element = document.getElementById(
                            `flight-${offer.id}`
                          );
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            element.style.boxShadow =
                              "0 0 0 3px rgba(25, 118, 210, 0.5)";
                            setTimeout(() => {
                              element.style.boxShadow = "";
                            }, 2000);
                          }
                        }}
                      />
                      <PriceTrendGraph
                        offers={displayedOffers}
                        currency={displayedOffers[0]?.price?.currency || "USD"}
                        selectedDate={departureDate}
                      />
                      {displayedOffers.map((offer) => (
                        <FlightCard
                          key={offer.id}
                          offer={offer}
                          onSelect={(selectedOffer) => {
                            console.log("Selected offer:", selectedOffer);
                            // TODO: Navigate to booking page
                          }}
                        />
                      ))}

                      {/* Load more sentinel / indicator */}
                      {hasMoreOffers && (
                        <Box
                          ref={loadMoreRef}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            py: 3,
                            gap: 1,
                          }}
                        >
                          {isLoadingMore ? (
                            <>
                              <CircularProgress size={24} />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Loading more flights...
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Scroll for more flights ({displayedOffers.length}{" "}
                              of {allOffers.length})
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* All loaded indicator */}
                      {!hasMoreOffers && allOffers.length > ITEMS_PER_PAGE && (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            All {allOffers.length} flights loaded
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

export default Search;
