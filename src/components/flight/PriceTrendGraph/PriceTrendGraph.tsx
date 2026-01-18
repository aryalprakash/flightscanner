import { useMemo, useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Skeleton,
  Collapse,
  IconButton,
} from "@mui/material";
import { TrendingUp, ExpandMore, ExpandLess } from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import type { FlightOffer } from "@/api/types/flightOffer";

export interface PriceTrendGraphProps {
  offers: FlightOffer[];
  currency?: string;
  selectedDate?: string; // ISO date string (YYYY-MM-DD)
}

interface TrendDataPoint {
  label: string;
  daysAgo: number;
  highestFare: number;
  averageFare: number;
  lowestFare: number;
}

// Generate random variation within a percentage range
function randomVariation(
  baseValue: number,
  minPercent: number,
  maxPercent: number
): number {
  const variation = minPercent + Math.random() * (maxPercent - minPercent);
  const direction = Math.random() > 0.5 ? 1 : -1;
  return Math.round(baseValue * (1 + (direction * variation) / 100));
}

// Format selected date for display
function formatSelectedDate(dateStr?: string): string {
  if (!dateStr) return "Selected Date";
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d");
  } catch {
    return "Selected Date";
  }
}

// Generate mock historical and future data based on current offers
function generateTrendData(
  offers: FlightOffer[],
  selectedDate?: string
): TrendDataPoint[] {
  if (!offers || offers.length === 0) {
    return [];
  }

  // Calculate current day stats from actual offers
  const prices = offers.map((offer) => offer.price.total);
  const currentLowest = Math.min(...prices);
  const currentHighest = Math.max(...prices);
  const currentAverage = Math.round(
    prices.reduce((a, b) => a + b, 0) / prices.length
  );

  const dataPoints: TrendDataPoint[] = [];

  // Format the selected date for the center label
  const selectedDateLabel = formatSelectedDate(selectedDate);

  // Combined intervals: past, selected date, and future
  const intervals = [
    // Past data points (negative daysAgo means past)
    { daysAgo: -28, label: "-28 days" },
    { daysAgo: -21, label: "-21 days" },
    { daysAgo: -14, label: "-14 days" },
    { daysAgo: -7, label: "-7 days" },
    // Selected date (center point)
    { daysAgo: 0, label: selectedDateLabel },
    // Future data points (positive daysAgo means future)
    { daysAgo: 7, label: "+7 days" },
    { daysAgo: 14, label: "+14 days" },
    { daysAgo: 21, label: "+21 days" },
    { daysAgo: 28, label: "+28 days" },
  ];

  // Generate prices with general trends:
  // - Past: prices were generally lower
  // - Future: prices tend to increase as travel date approaches
  intervals.forEach(({ daysAgo, label }) => {
    let lowestFare: number;
    let highestFare: number;
    let averageFare: number;

    if (daysAgo === 0) {
      // Today's data from actual offers
      lowestFare = currentLowest;
      highestFare = currentHighest;
      averageFare = currentAverage;
    } else if (daysAgo < 0) {
      // Historical data - simulate lower prices in the past with some randomness
      // The further back, the generally lower the prices
      const daysPast = Math.abs(daysAgo);
      const discountFactor = 1 - (daysPast / 100) * (0.8 + Math.random() * 0.4);

      lowestFare = randomVariation(currentLowest * discountFactor, 5, 15);
      highestFare = randomVariation(currentHighest * discountFactor, 5, 15);
      averageFare = randomVariation(currentAverage * discountFactor, 5, 15);

      // Ensure logical ordering: lowest < average < highest
      const sortedPrices = [lowestFare, averageFare, highestFare].sort(
        (a, b) => a - b
      );
      lowestFare = sortedPrices[0];
      averageFare = sortedPrices[1];
      highestFare = sortedPrices[2];
    } else {
      // Future data - simulate higher prices as travel date approaches
      // The further into future, the higher the prices (last-minute bookings are expensive)
      const premiumFactor = 1 + (daysAgo / 100) * (0.5 + Math.random() * 0.5);

      lowestFare = randomVariation(currentLowest * premiumFactor, 5, 12);
      highestFare = randomVariation(currentHighest * premiumFactor, 5, 12);
      averageFare = randomVariation(currentAverage * premiumFactor, 5, 12);

      // Ensure logical ordering: lowest < average < highest
      const sortedPrices = [lowestFare, averageFare, highestFare].sort(
        (a, b) => a - b
      );
      lowestFare = sortedPrices[0];
      averageFare = sortedPrices[1];
      highestFare = sortedPrices[2];
    }

    dataPoints.push({
      label,
      daysAgo,
      highestFare,
      averageFare,
      lowestFare,
    });
  });

  return dataPoints;
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          minWidth: 150,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {label}
        </Typography>
        {payload.map((entry) => (
          <Box
            key={entry.name}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              py: 0.25,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: entry.color,
                fontWeight: 500,
              }}
            >
              {entry.name}:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {currency} {entry.value.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  }
  return null;
}

// Loading skeleton component
function ChartSkeleton() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "background.paper",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ width: "100%", px: 2 }}>
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 1 }}
          animation="wave"
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton
              key={i}
              variant="text"
              width={50}
              height={20}
              animation="wave"
            />
          ))}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Updating price trends...
      </Typography>
    </Box>
  );
}

export function PriceTrendGraph({
  offers,
  currency = "USD",
  selectedDate,
}: PriceTrendGraphProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayData, setDisplayData] = useState<TrendDataPoint[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const prevOffersRef = useRef<FlightOffer[]>([]);

  // Only generate trend data when expanded
  const trendData = useMemo(() => {
    if (!isExpanded && !hasLoadedOnce) {
      return [];
    }
    return generateTrendData(offers, selectedDate);
  }, [offers, selectedDate, isExpanded, hasLoadedOnce]);

  // Handle expansion - trigger initial load
  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      setIsLoading(true);
      // Simulate API fetch delay on first expand
      setTimeout(() => {
        setDisplayData(generateTrendData(offers, selectedDate));
        setIsLoading(false);
      }, 600);
    }
  };

  // Simulate loading state when offers change (only if already expanded)
  useEffect(() => {
    if (!isExpanded && !hasLoadedOnce) return;

    // Check if offers have actually changed (compare by length and first/last ids)
    const offersChanged =
      prevOffersRef.current.length !== offers.length ||
      prevOffersRef.current[0]?.id !== offers[0]?.id ||
      prevOffersRef.current[prevOffersRef.current.length - 1]?.id !==
        offers[offers.length - 1]?.id;

    if (offersChanged && offers.length > 0 && hasLoadedOnce) {
      setIsLoading(true);

      // Simulate API fetch delay
      const timer = setTimeout(() => {
        setDisplayData(trendData);
        setIsLoading(false);
      }, 600);

      prevOffersRef.current = offers;

      return () => clearTimeout(timer);
    } else if (offers.length > 0 && displayData.length === 0 && hasLoadedOnce) {
      // Initial load after expansion
      setDisplayData(trendData);
    }
  }, [offers, trendData, displayData.length, isExpanded, hasLoadedOnce]);

  // Format the selected date for header display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    try {
      const date = parseISO(selectedDate);
      return format(date, "MMM d, yyyy");
    } catch {
      return "";
    }
  }, [selectedDate]);

  // Chart colors
  const colors = {
    highest: theme.palette.error.main,
    average: theme.palette.warning.main,
    lowest: theme.palette.success.main,
  };

  // Gradient IDs for area fills
  const gradientIds = {
    highest: "colorHighest",
    average: "colorAverage",
    lowest: "colorLowest",
  };

  // Data to display in chart
  const chartData = displayData.length > 0 ? displayData : trendData;

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        mb: 3,
        overflow: "hidden",
      }}
    >
      {/* Collapsible Header */}
      <Box
        onClick={handleToggleExpand}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          cursor: "pointer",
          "&:hover": {
            bgcolor: "action.hover",
          },
          transition: "background-color 0.2s ease",
        }}
      >
        <TrendingUp color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Price Trend
        </Typography>
        {formattedDate && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            (±28 days from {formattedDate})
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          size="small"
          sx={{ ml: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpand();
          }}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isExpanded} timeout="auto">
        <Box sx={{ px: 3, pb: 3 }}>
          {/* Chart */}
          <Box sx={{ width: "100%", height: 300, position: "relative" }}>
            {/* Loading overlay - only render when loading */}
            {isLoading && <ChartSkeleton />}

            {/* Chart content */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                opacity: isLoading ? 0 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient
                      id={gradientIds.highest}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={colors.highest}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={colors.highest}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id={gradientIds.average}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={colors.average}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={colors.average}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id={gradientIds.lowest}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={colors.lowest}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={colors.lowest}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.palette.divider}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: theme.palette.divider }}
                  />

                  <YAxis
                    tick={{
                      fill: theme.palette.text.secondary,
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${currency} ${value}`}
                    width={80}
                  />

                  <Tooltip
                    content={<CustomTooltip currency={currency} />}
                    cursor={{
                      stroke: theme.palette.primary.main,
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span
                        style={{
                          color: theme.palette.text.primary,
                          fontSize: 13,
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />

                  {/* Stacked area charts - order matters for visual stacking */}
                  <Area
                    type="monotone"
                    dataKey="highestFare"
                    name="Highest Fare"
                    stackId="1"
                    stroke={colors.highest}
                    strokeWidth={2}
                    fill={`url(#${gradientIds.highest})`}
                    dot={{
                      fill: colors.highest,
                      strokeWidth: 0,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: colors.highest,
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="averageFare"
                    name="Average Fare"
                    stackId="2"
                    stroke={colors.average}
                    strokeWidth={2}
                    fill={`url(#${gradientIds.average})`}
                    dot={{
                      fill: colors.average,
                      strokeWidth: 0,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: colors.average,
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="lowestFare"
                    name="Lowest Fare"
                    stackId="3"
                    stroke={colors.lowest}
                    strokeWidth={2}
                    fill={`url(#${gradientIds.lowest})`}
                    dot={{
                      fill: colors.lowest,
                      strokeWidth: 0,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: colors.lowest,
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Footer note */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 2, textAlign: "center" }}
          >
            * Historical and future data are simulated based on current fare
            trends.
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default PriceTrendGraph;
