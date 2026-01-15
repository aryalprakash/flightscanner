import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";
import { ArrowBack, FlightTakeoff, FlightLand } from "@mui/icons-material";

export function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract search params
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");

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
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate("/")} aria-label="Go back">
            <ArrowBack />
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
            >
              <Chip
                icon={<FlightTakeoff fontSize="small" />}
                label={origin}
                variant="outlined"
              />
              <Typography color="text.secondary">→</Typography>
              <Chip
                icon={<FlightLand fontSize="small" />}
                label={destination}
                variant="outlined"
              />
              <Chip label={departureDate} size="small" />
              {returnDate && (
                <Chip
                  label={`Return: ${returnDate}`}
                  size="small"
                  color="secondary"
                />
              )}
            </Stack>
          </Box>
        </Box>

        {/* Loading State */}
        <Paper
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography color="text.secondary">
            Searching for flights from {origin} to {destination}...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a demo. Connect the Amadeus API to see real results.
          </Typography>

          <Alert severity="info" sx={{ mt: 2, maxWidth: 500 }}>
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
              <li>Add credentials to .env.local</li>
              <li>Implement useFlightSearch hook with the searchFlights API</li>
            </ol>
          </Alert>
        </Paper>
      </Container>
    </Box>
  );
}

export default Search;
