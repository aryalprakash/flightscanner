/**
 * Amadeus Flight Offers API Service
 *
 * Handles fetching and normalization of flight data
 * from the Amadeus Self-Service API.
 */

import { api } from "@/api/clients/httpClient";
import type {
  AmadeusFlightOffersResponse,
  AmadeusFlightOffer,
  AmadeusItinerary,
  AmadeusSegment,
  AmadeusDictionaries,
  FlightSearchParams,
} from "../types/amadeus";

import type {
  FlightOffer,
  FlightSearchResult,
  Itinerary,
  Segment,
  Duration,
  CabinClass,
} from "../types/flightOffer";

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
  const rawData = await api.get<AmadeusFlightOffersResponse>(
    "/v2/shopping/flight-offers",
    {
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults,
      returnDate: params.returnDate,
      children: params.children,
      infants: params.infants,
      travelClass: params.travelClass,
      nonStop: params.nonStop,
      currencyCode: params.currencyCode,
      maxPrice: params.maxPrice,
      max: params.max,
    }
  );

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
