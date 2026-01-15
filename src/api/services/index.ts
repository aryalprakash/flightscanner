// Barrel export for API services

export { searchFlights } from "./flightService";

export type {
  FlightSearchParams,
  FlightOffer,
  FlightSearchResult,
  FlightSearchError,
  Itinerary,
  Segment,
  Duration,
  Price,
  Airline,
  FlightPoint,
  CabinClass,
} from "./flightService";
