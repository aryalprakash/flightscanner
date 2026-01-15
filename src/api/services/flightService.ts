/**
 * Amadeus Flight Offers API Service
 *
 * Handles authentication, fetching, and normalization of flight data
 * from the Amadeus Self-Service API (test environment).
 */

import type {
  AmadeusFlightOffersResponse,
  AmadeusFlightOffer,
  AmadeusItinerary,
  AmadeusSegment,
  AmadeusDictionaries,
  AmadeusAuthResponse,
  FlightSearchParams,
} from "../types/amadeus";

import type {
  FlightOffer,
  FlightSearchResult,
  FlightSearchError,
  Itinerary,
  Segment,
  Duration,
  CabinClass,
} from "../types/flightOffer";

// ============================================
// CONFIGURATION
// ============================================

const AMADEUS_BASE_URL =
  import.meta.env.VITE_AMADEUS_BASE_URL || "https://test.api.amadeus.com"; // Test environment

const AMADEUS_CLIENT_ID = import.meta.env.VITE_AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

// ============================================
// TOKEN MANAGEMENT
// ============================================

interface TokenCache {
  accessToken: string | null;
  expiresAt: number;
}

const tokenCache: TokenCache = {
  accessToken: null,
  expiresAt: 0,
};

/**
 * Fetches a new access token from Amadeus OAuth2 endpoint
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw createError("CONFIG_ERROR", "Amadeus API credentials not configured");
  }

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw createError(
      "AUTH_ERROR",
      "Failed to authenticate with Amadeus API",
      `Status: ${response.status}`
    );
  }

  const data: AmadeusAuthResponse = await response.json();

  // Cache the token
  tokenCache.accessToken = data.access_token;
  tokenCache.expiresAt = Date.now() + data.expires_in * 1000;

  return data.access_token;
}

// ============================================
// MAIN API FUNCTION
// ============================================

/**
 * Search for flight offers using the Amadeus API
 *
 * @param params - Search parameters
 * @returns Normalized flight search results
 *
 * @example
 * const results = await searchFlights({
 *   originLocationCode: 'JFK',
 *   destinationLocationCode: 'LAX',
 *   departureDate: '2024-06-15',
 *   adults: 1,
 * });
 */
export async function searchFlights(
  params: FlightSearchParams
): Promise<FlightSearchResult> {
  const token = await getAccessToken();

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("originLocationCode", params.originLocationCode);
  queryParams.set("destinationLocationCode", params.destinationLocationCode);
  queryParams.set("departureDate", params.departureDate);
  queryParams.set("adults", String(params.adults));

  if (params.returnDate) {
    queryParams.set("returnDate", params.returnDate);
  }
  if (params.children) {
    queryParams.set("children", String(params.children));
  }
  if (params.infants) {
    queryParams.set("infants", String(params.infants));
  }
  if (params.travelClass) {
    queryParams.set("travelClass", params.travelClass);
  }
  if (params.nonStop !== undefined) {
    queryParams.set("nonStop", String(params.nonStop));
  }
  if (params.currencyCode) {
    queryParams.set("currencyCode", params.currencyCode);
  }
  if (params.maxPrice) {
    queryParams.set("maxPrice", String(params.maxPrice));
  }
  if (params.max) {
    queryParams.set("max", String(params.max));
  }

  const url = `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${queryParams}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw createError(
      "API_ERROR",
      `Flight search failed with status ${response.status}`,
      errorBody
    );
  }

  const rawData: AmadeusFlightOffersResponse = await response.json();

  // Normalize and return
  return normalizeFlightOffers(rawData, params);
}

// ============================================
// NORMALIZATION FUNCTIONS
// ============================================

/**
 * Transform raw Amadeus response into clean FlightSearchResult
 */
function normalizeFlightOffers(
  raw: AmadeusFlightOffersResponse,
  params: FlightSearchParams
): FlightSearchResult {
  const { data, dictionaries } = raw;

  const offers = data.map((offer) => normalizeOffer(offer, dictionaries));

  return {
    offers,
    meta: {
      totalCount: raw.meta.count,
      searchParams: {
        origin: params.originLocationCode,
        destination: params.destinationLocationCode,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers:
          params.adults + (params.children || 0) + (params.infants || 0),
      },
      searchedAt: new Date().toISOString(),
    },
  };
}

/**
 * Transform a single Amadeus offer into normalized FlightOffer
 */
function normalizeOffer(
  offer: AmadeusFlightOffer,
  dictionaries: AmadeusDictionaries
): FlightOffer {
  const validatingCode = offer.validatingAirlineCodes[0];
  const cabinClass =
    offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || "ECONOMY";
  const totalPassengers = offer.travelerPricings.length;

  return {
    id: offer.id,
    price: {
      total: parseFloat(offer.price.grandTotal),
      base: parseFloat(offer.price.base),
      currency: offer.price.currency,
      perTraveler: parseFloat(offer.price.grandTotal) / totalPassengers,
    },
    itineraries: offer.itineraries.map((itinerary, index) =>
      normalizeItinerary(itinerary, index, dictionaries)
    ),
    validatingAirline: {
      code: validatingCode,
      name: dictionaries.carriers[validatingCode] || validatingCode,
    },
    bookingClass: cabinClass as CabinClass,
    seatsAvailable: offer.numberOfBookableSeats,
    lastTicketingDate: offer.lastTicketingDate,
    isNonStop: offer.itineraries.every((it) => it.segments.length === 1),
    isOneWay: offer.oneWay,
  };
}

/**
 * Transform Amadeus itinerary into normalized Itinerary
 */
function normalizeItinerary(
  itinerary: AmadeusItinerary,
  index: number,
  dictionaries: AmadeusDictionaries
): Itinerary {
  return {
    direction: index === 0 ? "outbound" : "inbound",
    duration: parseDuration(itinerary.duration),
    segments: itinerary.segments.map((segment) =>
      normalizeSegment(segment, dictionaries)
    ),
    stops: itinerary.segments.length - 1,
  };
}

/**
 * Transform Amadeus segment into normalized Segment
 */
function normalizeSegment(
  segment: AmadeusSegment,
  dictionaries: AmadeusDictionaries
): Segment {
  const departureLocation = dictionaries.locations[segment.departure.iataCode];
  const arrivalLocation = dictionaries.locations[segment.arrival.iataCode];

  return {
    id: segment.id,
    departure: {
      airportCode: segment.departure.iataCode,
      cityCode: departureLocation?.cityCode || segment.departure.iataCode,
      countryCode: departureLocation?.countryCode || "",
      terminal: segment.departure.terminal,
      dateTime: segment.departure.at,
      time: formatTime(segment.departure.at),
      date: formatDate(segment.departure.at),
    },
    arrival: {
      airportCode: segment.arrival.iataCode,
      cityCode: arrivalLocation?.cityCode || segment.arrival.iataCode,
      countryCode: arrivalLocation?.countryCode || "",
      terminal: segment.arrival.terminal,
      dateTime: segment.arrival.at,
      time: formatTime(segment.arrival.at),
      date: formatDate(segment.arrival.at),
    },
    duration: parseDuration(segment.duration),
    flightNumber: `${segment.carrierCode}${segment.number}`,
    airline: {
      code: segment.carrierCode,
      name: dictionaries.carriers[segment.carrierCode] || segment.carrierCode,
    },
    operatingAirline: segment.operating
      ? {
          code: segment.operating.carrierCode,
          name:
            dictionaries.carriers[segment.operating.carrierCode] ||
            segment.operating.carrierCode,
        }
      : undefined,
    aircraft:
      dictionaries.aircraft[segment.aircraft.code] || segment.aircraft.code,
    stops: segment.numberOfStops,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse ISO 8601 duration string (e.g., "PT2H30M") into Duration object
 */
function parseDuration(isoDuration: string): Duration {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);

  const hours = match?.[1] ? parseInt(match[1], 10) : 0;
  const minutes = match?.[2] ? parseInt(match[2], 10) : 0;
  const totalMinutes = hours * 60 + minutes;

  return {
    hours,
    minutes,
    totalMinutes,
    formatted: `${hours}h ${minutes}m`,
  };
}

/**
 * Format ISO datetime to time string (HH:mm)
 */
function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format ISO datetime to date string (YYYY-MM-DD)
 */
function formatDate(isoDateTime: string): string {
  return isoDateTime.split("T")[0];
}

/**
 * Create a standardized error object
 */
function createError(
  code: string,
  message: string,
  details?: string
): FlightSearchError {
  return { code, message, details };
}

// ============================================
// EXPORTS
// ============================================

export type { FlightSearchParams } from "../types/amadeus";
export type {
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
} from "../types/flightOffer";
