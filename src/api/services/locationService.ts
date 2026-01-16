/**
 * Amadeus Location Search API Service
 *
 * Handles searching for airports and cities using the Amadeus Airport & City Search API.
 */

import { api } from "@/api/clients/httpClient";

// ============================================
// TYPES
// ============================================

export interface LocationSearchParams {
  keyword: string;
  subType?: "AIRPORT" | "CITY" | "AIRPORT,CITY";
  max?: number;
}

export interface AmadeusLocation {
  type: string;
  subType: "AIRPORT" | "CITY";
  name: string;
  detailedName: string;
  id: string;
  iataCode: string;
  address: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
    regionCode?: string;
  };
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  analytics?: {
    travelers: {
      score: number;
    };
  };
}

export interface LocationSearchResult {
  id: string;
  type: "AIRPORT" | "CITY";
  code: string;
  name: string;
  cityName: string;
  cityCode: string;
  countryName: string;
  countryCode: string;
  detailedName: string;
  // For cities with multiple airports
  airports?: LocationSearchResult[];
  score?: number;
}

interface AmadeusLocationResponse {
  meta: { count: number };
  data: AmadeusLocation[];
}

// ============================================
// MAIN API FUNCTION
// ============================================

/**
 * Search for airports and cities using the Amadeus API
 *
 * @param params - Search parameters
 * @returns Normalized location search results with nested airports for cities
 *
 * @example
 * const results = await searchLocations({
 *   keyword: 'New York',
 *   subType: 'AIRPORT,CITY',
 *   max: 10,
 * });
 */
export async function searchLocations(
  params: LocationSearchParams
): Promise<LocationSearchResult[]> {
  // Don't search for very short keywords
  if (!params.keyword || params.keyword.length < 2) {
    return [];
  }

  const rawData = await api.get<AmadeusLocationResponse>(
    "/v1/reference-data/locations",
    {
      keyword: params.keyword,
      subType: params.subType || "AIRPORT,CITY",
      "page[limit]": params.max || 10,
      view: "FULL",
    }
  );

  return normalizeLocations(rawData.data);
}

// ============================================
// NORMALIZATION
// ============================================

/**
 * Normalize and group locations - cities contain their airports
 */
function normalizeLocations(
  locations: AmadeusLocation[]
): LocationSearchResult[] {
  const citiesMap = new Map<string, LocationSearchResult>();
  const standaloneAirports: LocationSearchResult[] = [];

  // First pass: identify cities and airports
  for (const loc of locations) {
    const normalized: LocationSearchResult = {
      id: loc.id,
      type: loc.subType,
      code: loc.iataCode,
      name: loc.name,
      cityName: loc.address.cityName,
      cityCode: loc.address.cityCode,
      countryName: loc.address.countryName,
      countryCode: loc.address.countryCode,
      detailedName: loc.detailedName,
      score: loc.analytics?.travelers?.score,
    };

    if (loc.subType === "CITY") {
      // Initialize city with empty airports array
      citiesMap.set(loc.iataCode, { ...normalized, airports: [] });
    } else {
      standaloneAirports.push(normalized);
    }
  }

  // Second pass: group airports under their cities
  const usedAirports = new Set<string>();

  for (const airport of standaloneAirports) {
    const city = citiesMap.get(airport.cityCode);
    if (city && city.airports) {
      city.airports.push(airport);
      usedAirports.add(airport.id);
    }
  }

  // Build final result - cities first, then standalone airports
  const result: LocationSearchResult[] = [];

  // Add cities (sorted by score)
  const cities = Array.from(citiesMap.values()).sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );
  result.push(...cities);

  // Add airports that weren't grouped under a city
  for (const airport of standaloneAirports) {
    if (!usedAirports.has(airport.id)) {
      result.push(airport);
    }
  }

  return result;
}

/**
 * Get a location by its IATA code
 *
 * @param code - IATA code (e.g., 'JFK', 'NYC')
 * @returns Location data or null if not found
 *
 * @example
 * const location = await getLocationByCode('JFK');
 */
export async function getLocationByCode(
  code: string
): Promise<LocationSearchResult | null> {
  if (!code || code.length < 2) {
    return null;
  }

  try {
    const results = await searchLocations({
      keyword: code,
      subType: "AIRPORT,CITY",
      max: 5,
    });

    // Find exact match by code
    for (const result of results) {
      if (result.code === code) {
        return result;
      }
      // Check nested airports for cities
      if (result.airports) {
        const airport = result.airports.find((a) => a.code === code);
        if (airport) {
          return airport;
        }
      }
    }

    // Return first result if no exact match (best effort)
    return results[0] || null;
  } catch (error) {
    console.error("Failed to fetch location by code:", error);
    return null;
  }
}

export default searchLocations;
