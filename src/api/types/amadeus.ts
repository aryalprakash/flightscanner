/**
 * Amadeus API Raw Response Types
 * Based on Amadeus Flight Offers Search API v2
 */

// ============================================
// RAW API RESPONSE TYPES (from Amadeus)
// ============================================

export interface AmadeusFlightOffersResponse {
  meta: {
    count: number;
    links: { self: string };
  };
  data: AmadeusFlightOffer[];
  dictionaries: AmadeusDictionaries;
}

export interface AmadeusFlightOffer {
  type: "flight-offer";
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

export interface AmadeusItinerary {
  duration: string; // ISO 8601 duration format: "PT2H10M"
  segments: AmadeusSegment[];
}

export interface AmadeusSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO 8601 datetime
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  operating?: { carrierCode: string };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees?: Array<{
    amount: string;
    type: string;
  }>;
  grandTotal: string;
}

export interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: "ADULT" | "CHILD" | "INFANT";
  price: {
    currency: string;
    total: string;
    base: string;
  };
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    fareBasis: string;
    class: string;
    includedCheckedBags?: {
      weight?: number;
      weightUnit?: string;
      quantity?: number;
    };
  }>;
}

export interface AmadeusDictionaries {
  locations: Record<
    string,
    {
      cityCode: string;
      countryCode: string;
    }
  >;
  aircraft: Record<string, string>;
  currencies: Record<string, string>;
  carriers: Record<string, string>;
}

// ============================================
// API REQUEST TYPES
// ============================================

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional for one-way)
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number; // Max number of results (default 250)
}

// ============================================
// AUTH TYPES
// ============================================

export interface AmadeusAuthResponse {
  type: "amadeusOAuth2Token";
  username: string;
  application_name: string;
  client_id: string;
  token_type: "Bearer";
  access_token: string;
  expires_in: number;
  state: "approved";
  scope: string;
}
