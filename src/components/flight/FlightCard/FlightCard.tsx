/**
 * FlightCard Component
 *
 * Displays a single flight offer with itinerary details, price, and airline info.
 * Expandable to show detailed segment information.
 */

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  Button,
  Collapse,
} from "@mui/material";
import {
  FlightTakeoff,
  FlightLand,
  AccessTime,
  AirlineSeatReclineNormal,
  ExpandMore,
  ExpandLess,
  Circle,
  Flight,
} from "@mui/icons-material";

import type { FlightOffer, Itinerary, Segment } from "@/api/types/flightOffer";

/**
 * Get airline logo URL from AirHex API
 */
function getAirlineLogoUrl(
  airlineCode: string,
  size: number = 50,
  type: "s" | "f" | "t" = "s"
): string {
  // AirHex API: s = square, f = full, t = tail
  return `https://content.airhex.com/content/logos/airlines_${airlineCode}_${size}_${size}_${type}.png`;
}

// Currency symbol mapping
const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  KRW: "₩",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  MXN: "MX$",
  BRL: "R$",
  RUB: "₽",
  ZAR: "R",
  TRY: "₺",
  PLN: "zł",
  THB: "฿",
  MYR: "RM",
  PHP: "₱",
  IDR: "Rp",
  AED: "د.إ",
  SAR: "﷼",
  ILS: "₪",
  NPR: "Rs",
};

/**
 * Get the currency symbol for a given currency code
 */
function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || currencyCode;
}

/**
 * Format price with proper currency symbol
 */
function formatPrice(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  // For currencies that typically go after the number
  const suffixCurrencies = ["kr", "zł"];
  if (suffixCurrencies.includes(symbol)) {
    return `${amount.toFixed(0)} ${symbol}`;
  }
  return `${symbol}${amount.toFixed(0)}`;
}

/**
 * Calculate layover duration between two segments
 */
function calculateLayover(
  arrivalTime: string,
  departureTime: string
): { hours: number; minutes: number; formatted: string } {
  // Parse times (assuming same day for simplicity, or handle date parsing)
  const [arrHour, arrMin] = arrivalTime.split(":").map(Number);
  const [depHour, depMin] = departureTime.split(":").map(Number);

  let totalMinutes = depHour * 60 + depMin - (arrHour * 60 + arrMin);

  // Handle overnight layover
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours,
    minutes,
    formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
  };
}

export interface FlightCardProps {
  offer: FlightOffer;
  onSelect?: (offer: FlightOffer) => void;
}

/**
 * Renders a single itinerary (outbound or inbound) - summary view
 */
function ItinerarySection({ itinerary }: { itinerary: Itinerary }) {
  const firstSegment = itinerary.segments[0];
  const lastSegment = itinerary.segments[itinerary.segments.length - 1];

  return (
    <Box sx={{ py: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        {/* Departure */}
        <Box sx={{ textAlign: "center", minWidth: 80 }}>
          <Typography variant="h5" fontWeight={600}>
            {firstSegment.departure.time}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {firstSegment.departure.airportCode}
          </Typography>
        </Box>

        {/* Flight Info */}
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
          >
            <AccessTime fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {itinerary.duration.formatted}
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              my: 0.5,
            }}
          >
            <FlightTakeoff fontSize="small" color="action" />
            <Box
              sx={{
                flex: 1,
                height: 2,
                bgcolor: "divider",
                mx: 1,
                maxWidth: 120,
                position: "relative",
              }}
            >
              {itinerary.stops > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                  }}
                />
              )}
            </Box>
            <FlightLand fontSize="small" color="action" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {itinerary.stops === 0
              ? "Non-stop"
              : `${itinerary.stops} stop${itinerary.stops > 1 ? "s" : ""}`}
          </Typography>
        </Box>

        {/* Arrival */}
        <Box sx={{ textAlign: "center", minWidth: 80 }}>
          <Typography variant="h5" fontWeight={600}>
            {lastSegment.arrival.time}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lastSegment.arrival.airportCode}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

/**
 * Renders a single segment in the detailed view
 */
function SegmentDetail({ segment }: { segment: Segment }) {
  return (
    <Box sx={{ mb: 2 }}>
      {/* Segment Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box
          component="img"
          src={getAirlineLogoUrl(segment.airline.code, 50)}
          alt={`${segment.airline.name} logo`}
          sx={{
            width: 20,
            height: 20,
            objectFit: "contain",
            borderRadius: 0.5,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <Typography variant="body2" fontWeight={600}>
          {segment.airline.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {segment.flightNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          • {segment.aircraft}
        </Typography>
      </Stack>

      {/* Timeline */}
      <Stack direction="row" spacing={2}>
        {/* Timeline Line */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: 0.5,
          }}
        >
          <Circle sx={{ fontSize: 10, color: "primary.main" }} />
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: "divider",
              my: 0.5,
            }}
          />
          <Circle sx={{ fontSize: 10, color: "primary.main" }} />
        </Box>

        {/* Details */}
        <Box sx={{ flex: 1 }}>
          {/* Departure */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body1" fontWeight={600}>
              {segment.departure.time}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {segment.departure.airportCode}
              {segment.departure.terminal && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {" "}
                  • Terminal {segment.departure.terminal}
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {segment.departure.date}
            </Typography>
          </Box>

          {/* Duration */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mb: 1.5 }}
          >
            <Flight
              sx={{
                fontSize: 16,
                color: "action.active",
                transform: "rotate(90deg)",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {segment.duration.formatted}
            </Typography>
          </Stack>

          {/* Arrival */}
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {segment.arrival.time}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {segment.arrival.airportCode}
              {segment.arrival.terminal && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {" "}
                  • Terminal {segment.arrival.terminal}
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {segment.arrival.date}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

/**
 * Renders layover information between segments
 */
function LayoverInfo({
  arrivalTime,
  departureTime,
  airportCode,
}: {
  arrivalTime: string;
  departureTime: string;
  airportCode: string;
}) {
  const layover = calculateLayover(arrivalTime, departureTime);

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        my: 1,
        bgcolor: "action.hover",
        borderRadius: 1,
        borderLeft: 3,
        borderColor: "warning.main",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <AccessTime sx={{ fontSize: 16, color: "warning.main" }} />
        <Typography variant="body2" color="text.secondary">
          <strong>{layover.formatted}</strong> layover in {airportCode}
        </Typography>
      </Stack>
    </Box>
  );
}

/**
 * Renders detailed itinerary with all segments
 */
function ItineraryDetail({
  itinerary,
  label,
}: {
  itinerary: Itinerary;
  label: string;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>

      {itinerary.segments.map((segment, index) => (
        <Box key={segment.id}>
          <SegmentDetail segment={segment} />

          {/* Layover info between segments */}
          {index < itinerary.segments.length - 1 && (
            <LayoverInfo
              arrivalTime={segment.arrival.time}
              departureTime={itinerary.segments[index + 1].departure.time}
              airportCode={segment.arrival.airportCode}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}

export function FlightCard({ offer, onSelect }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const outbound = offer.itineraries[0];
  const inbound = offer.itineraries[1];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the Select button
    const target = e.target as HTMLElement;
    if (
      target.closest("button") &&
      target.closest("button")?.textContent === "Select"
    ) {
      return;
    }
    setExpanded(!expanded);
  };

  return (
    <Card
      id={`flight-${offer.id}`}
      onClick={handleCardClick}
      sx={{
        mb: 2,
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          {/* Flight Details */}
          <Box sx={{ flex: 1 }}>
            {/* Airline Info */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Box
                component="img"
                src={getAirlineLogoUrl(offer.validatingAirline.code, 50)}
                alt={`${offer.validatingAirline.name} logo`}
                sx={{
                  width: 24,
                  height: 24,
                  objectFit: "contain",
                  borderRadius: 0.5,
                }}
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                {offer.validatingAirline.name}
              </Typography>
              <Chip
                label={offer.bookingClass}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
              {offer.isNonStop && (
                <Chip
                  label="Non-stop"
                  size="small"
                  color="success"
                  sx={{ fontSize: "0.7rem" }}
                />
              )}
            </Stack>

            {/* Outbound */}
            <ItinerarySection itinerary={outbound} />

            {/* Inbound (if round trip) */}
            {inbound && (
              <>
                <Divider sx={{ my: 1 }} />
                <ItinerarySection itinerary={inbound} />
              </>
            )}
          </Box>

          {/* Price & Action */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" } }}
          />
          <Box
            sx={{
              minWidth: 140,
              textAlign: { xs: "left", md: "center" },
              pl: { xs: 0, md: 2 },
              pt: { xs: 2, md: 0 },
              borderTop: { xs: 1, md: 0 },
              borderColor: "divider",
            }}
          >
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {formatPrice(offer.price.total, offer.price.currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {offer.price.currency} total
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              {formatPrice(offer.price.perTraveler, offer.price.currency)}
              /person
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent={{ xs: "flex-start", md: "center" }}
              spacing={0.5}
              sx={{ mb: 2 }}
            >
              <AirlineSeatReclineNormal fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {offer.seatsAvailable} seats left
              </Typography>
            </Stack>

            {onSelect && (
              <Button
                variant="contained"
                size="medium"
                fullWidth
                onClick={() => onSelect(offer)}
              >
                Select
              </Button>
            )}
          </Box>
        </Stack>

        {/* Expand/Collapse Indicator */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 0,
            mb: "-10px",
            color: "text.secondary",
          }}
        >
          {expanded ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ px: { xs: 0, md: 2 } }}>
            <ItineraryDetail
              itinerary={outbound}
              label={inbound ? "Outbound Flight" : "Flight Details"}
            />
            {inbound && (
              <>
                <Divider sx={{ my: 2 }} />
                <ItineraryDetail itinerary={inbound} label="Return Flight" />
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default FlightCard;
