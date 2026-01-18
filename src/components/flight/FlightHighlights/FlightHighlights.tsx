import { useMemo } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  AttachMoney as CheapestIcon,
  Speed as FastestIcon,
} from "@mui/icons-material";
import type { FlightOffer } from "@/api/types/flightOffer";

interface FlightHighlightsProps {
  offers: FlightOffer[];
  onSelect?: (
    offer: FlightOffer,
    type: "best" | "cheapest" | "fastest"
  ) => void;
}

interface HighlightedFlight {
  type: "best" | "cheapest" | "fastest";
  label: string;
  offer: FlightOffer;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export function FlightHighlights({ offers, onSelect }: FlightHighlightsProps) {
  const theme = useTheme();

  const highlights = useMemo<HighlightedFlight[]>(() => {
    if (!offers || offers.length === 0) return [];

    // Helper: Get average duration across itineraries
    const getAverageDuration = (offer: FlightOffer) => {
      const totalMinutes = offer.itineraries.reduce(
        (sum, it) => sum + it.duration.totalMinutes,
        0
      );
      return totalMinutes / offer.itineraries.length;
    };

    // Helper: Format average duration
    const formatAverageDuration = (offer: FlightOffer) => {
      const avgMinutes = getAverageDuration(offer);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = Math.round(avgMinutes % 60);
      return `${hours}h ${minutes}m`;
    };

    // Find cheapest flight
    const cheapest = [...offers].sort(
      (a, b) => a.price.total - b.price.total
    )[0];

    // Find fastest flight (by average duration)
    const fastest = [...offers].sort((a, b) => {
      return getAverageDuration(a) - getAverageDuration(b);
    })[0];

    if (fastest.id === cheapest.id) {
      return [];
    }

    const result: HighlightedFlight[] = [];

    // Add cheapest
    result.push({
      type: "cheapest",
      label: "Cheapest",
      offer: cheapest,
      icon: <CheapestIcon />,
      color: theme.palette.success.main,
      description: `${formatAverageDuration(cheapest)} avg · Lowest price`,
    });

    // Add fastest
    result.push({
      type: "fastest",
      label: "Fastest",
      offer: fastest,
      icon: <FastestIcon />,
      color: theme.palette.info.main,
      description: `${formatAverageDuration(fastest)} avg · Quickest route`,
    });

    return result;
  }, [offers, theme]);

  if (highlights.length === 0) return null;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ width: "100%" }}
      >
        {highlights.map((highlight) => (
          <Paper
            key={highlight.type}
            onClick={() => onSelect?.(highlight.offer, highlight.type)}
            sx={{
              flex: 1,
              p: { xs: 1, sm: 1, md: 2 },
              cursor: onSelect ? "pointer" : "default",
              border: `2px solid ${alpha(highlight.color, 0.3)}`,
              background: alpha(highlight.color, 0.04),
              transition: "all 0.2s ease-in-out",
              "&:hover": onSelect
                ? {
                    borderColor: highlight.color,
                    background: alpha(highlight.color, 0.08),
                    transform: "translateY(-2px)",
                    boxShadow: `0 4px 12px ${alpha(highlight.color, 0.2)}`,
                  }
                : {},
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: alpha(highlight.color, 0.12),
                  color: highlight.color,
                }}
              >
                {highlight.icon}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={highlight.label}
                    size="small"
                    sx={{
                      backgroundColor: highlight.color,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {highlight.description}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: highlight.color, lineHeight: 1.2 }}
                >
                  {formatPrice(
                    highlight.offer.price.total,
                    highlight.offer.price.currency
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  total
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

export default FlightHighlights;
