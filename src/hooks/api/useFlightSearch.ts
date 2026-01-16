/**
 * useFlightSearch Hook
 *
 * React Query hook for searching flights using the Amadeus API.
 */

import { useQuery } from "@tanstack/react-query";
import { searchFlights } from "@/api/services/flightService";
import type { FlightSearchParams } from "@/api/types/amadeus";
import type {
  FlightSearchResult,
  FlightSearchError,
} from "@/api/types/flightOffer";

// Query key factory for flight searches
export const flightSearchKeys = {
  all: ["flights"] as const,
  search: (params: FlightSearchParams) =>
    [...flightSearchKeys.all, "search", params] as const,
};

export interface UseFlightSearchOptions {
  /** Enable/disable the query */
  enabled?: boolean;
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
}

/**
 * Hook for searching flights
 *
 * @param params - Search parameters (origin, destination, dates, passengers)
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFlightSearch({
 *   originLocationCode: 'JFK',
 *   destinationLocationCode: 'LAX',
 *   departureDate: '2024-06-15',
 *   adults: 1,
 * });
 * ```
 */
export function useFlightSearch(
  params: FlightSearchParams | null,
  options: UseFlightSearchOptions = {}
) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  return useQuery<FlightSearchResult, FlightSearchError>({
    queryKey: params
      ? flightSearchKeys.search(params)
      : ["flights", "disabled"],
    queryFn: () => {
      if (!params) {
        throw new Error("Search parameters are required");
      }
      return searchFlights(params);
    },
    enabled: enabled && params !== null,
    refetchOnWindowFocus,
    staleTime,
    retry: (failureCount, error) => {
      // Don't retry on config errors
      if (error?.code === "CONFIG_ERROR") return false;
      // Don't retry on auth errors more than once
      if (error?.code === "AUTH_ERROR") return failureCount < 1;
      // Retry API errors up to 2 times
      return failureCount < 2;
    },
  });
}

export default useFlightSearch;
