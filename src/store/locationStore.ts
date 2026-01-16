/**
 * Location Store
 *
 * Zustand store for caching searched airport/city locations.
 * Avoids refetching location data when navigating between pages.
 */

import { create } from "zustand";
import type { LocationSearchResult } from "@/api/services/locationService";

// ============================================
// TYPES
// ============================================

interface LocationCache {
  [code: string]: LocationSearchResult;
}

interface LocationState {
  // Cached locations by IATA code
  cache: LocationCache;

  // Current search selection
  selectedOrigin: LocationSearchResult | null;
  selectedDestination: LocationSearchResult | null;

  // Actions
  cacheLocation: (location: LocationSearchResult) => void;
  cacheLocations: (locations: LocationSearchResult[]) => void;
  getLocation: (code: string) => LocationSearchResult | null;
  setSelectedOrigin: (location: LocationSearchResult | null) => void;
  setSelectedDestination: (location: LocationSearchResult | null) => void;
  setSelectedLocations: (
    origin: LocationSearchResult | null,
    destination: LocationSearchResult | null
  ) => void;
  clearSelection: () => void;
  clearCache: () => void;
}

// ============================================
// STORE
// ============================================

export const useLocationStore = create<LocationState>((set, get) => ({
  // Initial state
  cache: {},
  selectedOrigin: null,
  selectedDestination: null,

  // Cache a single location
  cacheLocation: (location) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [location.code]: location,
      },
    }));
  },

  // Cache multiple locations
  cacheLocations: (locations) => {
    set((state) => {
      const newCache = { ...state.cache };
      for (const loc of locations) {
        newCache[loc.code] = loc;
        // Also cache nested airports if present
        if (loc.airports) {
          for (const airport of loc.airports) {
            newCache[airport.code] = airport;
          }
        }
      }
      return { cache: newCache };
    });
  },

  // Get a location from cache
  getLocation: (code) => {
    return get().cache[code] || null;
  },

  // Set selected origin
  setSelectedOrigin: (location) => {
    set({ selectedOrigin: location });
    // Also cache it
    if (location) {
      get().cacheLocation(location);
    }
  },

  // Set selected destination
  setSelectedDestination: (location) => {
    set({ selectedDestination: location });
    // Also cache it
    if (location) {
      get().cacheLocation(location);
    }
  },

  // Set both selected locations at once
  setSelectedLocations: (origin, destination) => {
    set({
      selectedOrigin: origin,
      selectedDestination: destination,
    });
    // Cache both
    if (origin) {
      get().cacheLocation(origin);
    }
    if (destination) {
      get().cacheLocation(destination);
    }
  },

  // Clear current selection
  clearSelection: () => {
    set({
      selectedOrigin: null,
      selectedDestination: null,
    });
  },

  // Clear all cached data
  clearCache: () => {
    set({
      cache: {},
      selectedOrigin: null,
      selectedDestination: null,
    });
  },
}));

// ============================================
// SELECTORS
// ============================================

export const selectSelectedOrigin = (state: LocationState) =>
  state.selectedOrigin;
export const selectSelectedDestination = (state: LocationState) =>
  state.selectedDestination;
export const selectLocationCache = (state: LocationState) => state.cache;

export default useLocationStore;
