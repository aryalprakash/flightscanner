import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Paper } from "@mui/material";
import { FlightTakeoff } from "@mui/icons-material";

import { SearchForm } from "@/components/forms/SearchForm";
import { useLocationStore } from "@/store";
import type { SearchFormValues } from "@/components/forms/SearchForm";

export function Home() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const setSelectedLocations = useLocationStore(
    (state) => state.setSelectedLocations
  );

  const handleSearch = (values: SearchFormValues) => {
    setIsSearching(true);

    // Save selected locations to store for prefilling on search page
    setSelectedLocations(values.origin, values.destination);

    // Build search params for URL
    const params = new URLSearchParams({
      origin: values.origin!.code,
      destination: values.destination!.code,
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

    // Navigate to search results page
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <FlightTakeoff sx={{ fontSize: 48, color: "primary.main" }} />
            <Typography variant="h1" component="h1" color="primary.main">
              FlightScanner
            </Typography>
          </Box>
          <Typography
            variant="h4"
            component="p"
            color="text.secondary"
            sx={{ fontWeight: 400, maxWidth: 600, mx: "auto" }}
          >
            Search and compare flight prices from hundreds of airlines
          </Typography>
        </Box>

        {/* Search Form Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            pt: { xs: 2, md: 2 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <SearchForm onSubmit={handleSearch} isLoading={isSearching} />
        </Paper>

        {/* Features */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: { xs: 3, md: 6 },
            mt: 4,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Best Prices", icon: "💰" },
            { label: "100+ Airlines", icon: "✈️" },
            { label: "No Hidden Fees", icon: "✓" },
          ].map((feature) => (
            <Box
              key={feature.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography variant="h5" component="span">
                {feature.icon}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {feature.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
