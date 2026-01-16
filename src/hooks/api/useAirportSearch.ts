/**
 * useAirportSearch Hook
 *
 * React Query hook for searching airports and cities using the Amadeus API.
 * Uses debounced input to reduce API calls.
 */

import { useQuery } from "@tanstack/react-query";
import { searchLocations } from "@/api/services/locationService";
import type { LocationSearchResult } from "@/api/services/locationService";
import { useDebounce } from "@/hooks/ui/useDebounce";

// Query key factory
export const airportSearchKeys = {
  all: ["airports"] as const,
  search: (keyword: string) =>
    [...airportSearchKeys.all, "search", keyword] as const,
};

export interface UseAirportSearchOptions {
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Minimum characters before searching (default: 2) */
  minChars?: number;
  /** Max results to return (default: 10) */
  maxResults?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

export interface UseAirportSearchReturn {
  /** Search results (cities/airports) */
  data: LocationSearchResult[];
  /** Loading state */
  isLoading: boolean;
  /** Fetching state (includes background refetch) */
  isFetching: boolean;
  /** Error state */
  isError: boolean;
  /** Error details */
  error: unknown;
  /** The debounced search term being used */
  debouncedKeyword: string;
}

/**
 * Hook for searching airports and cities
 *
 * @param keyword - Search keyword (city name, airport code, etc.)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const [input, setInput] = useState('');
 * const { data, isLoading } = useAirportSearch(input);
 *
 * // data contains cities with nested airports
 * ```
 */
export function useAirportSearch(
  keyword: string,
  options: UseAirportSearchOptions = {}
): UseAirportSearchReturn {
  const {
    debounceMs = 300,
    minChars = 2,
    maxResults = 10,
    enabled = true,
  } = options;

  // Debounce the search keyword
  const debouncedKeyword = useDebounce(keyword.trim(), debounceMs);

  // Only search if keyword meets minimum length
  const shouldSearch = enabled && debouncedKeyword.length >= minChars;

  const query = useQuery<LocationSearchResult[], Error>({
    queryKey: airportSearchKeys.search(debouncedKeyword),
    queryFn: () =>
      searchLocations({
        keyword: debouncedKeyword,
        subType: "AIRPORT,CITY",
        max: maxResults,
      }),
    enabled: shouldSearch,
    staleTime: 10 * 60 * 1000, // 10 minutes - location data doesn't change often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading && shouldSearch,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    debouncedKeyword,
  };
}

export default useAirportSearch;
