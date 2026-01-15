// Main API barrel export

export { searchFlights } from "./services";

export type {
  // Search params
  FlightSearchParams,
  // Normalized types
  FlightOffer,
  FlightSearchResult,
  FlightSearchError,
  FlightSearchState,
  Itinerary,
  Segment,
  Duration,
  Price,
  Airline,
  FlightPoint,
  CabinClass,
} from "./types";
