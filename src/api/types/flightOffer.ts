/**
 * Normalized FlightOffer Model
 * Clean, UI-friendly types derived from Amadeus API responses
 */

// ============================================
// NORMALIZED FLIGHT OFFER TYPES
// ============================================

export interface FlightOffer {
  id: string;
  price: Price;
  itineraries: Itinerary[];
  validatingAirline: Airline;
  bookingClass: CabinClass;
  seatsAvailable: number;
  lastTicketingDate: string;
  isNonStop: boolean;
  isOneWay: boolean;
}

export interface Price {
  total: number;
  base: number;
  currency: string;
  perTraveler: number;
}

export interface Itinerary {
  direction: "outbound" | "inbound";
  duration: Duration;
  segments: Segment[];
  stops: number;
}

export interface Segment {
  id: string;
  departure: FlightPoint;
  arrival: FlightPoint;
  duration: Duration;
  flightNumber: string;
  airline: Airline;
  operatingAirline?: Airline;
  aircraft: string;
  stops: number;
}

export interface FlightPoint {
  airportCode: string;
  airportName?: string;
  cityCode: string;
  cityName?: string;
  countryCode: string;
  countryName?: string;
  terminal?: string;
  dateTime: string; // ISO 8601
  time: string; // HH:mm format
  date: string; // YYYY-MM-DD format
}

export interface Airline {
  code: string;
  name: string;
}

export interface Duration {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string; // "2h 30m"
}

export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

// ============================================
// API STATE TYPES
// ============================================

export interface FlightSearchState {
  status: "idle" | "loading" | "success" | "error";
  data: FlightOffer[] | null;
  error: FlightSearchError | null;
}

export interface FlightSearchError {
  code: string;
  message: string;
  details?: string;
}

// ============================================
// SEARCH RESULT METADATA
// ============================================

export interface FlightSearchResult {
  offers: FlightOffer[];
  meta: {
    totalCount: number;
    searchParams: {
      origin: string;
      destination: string;
      departureDate: string;
      returnDate?: string;
      passengers: number;
    };
    searchedAt: string;
  };
}
