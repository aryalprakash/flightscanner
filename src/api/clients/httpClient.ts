/**
 * HTTP Client
 *
 * Centralized HTTP client for Amadeus API with automatic token management.
 * Uses the auth store to get/refresh tokens as needed.
 */

import { useAuthStore } from "@/store/authStore";

// ============================================
// CONFIGURATION
// ============================================

const AMADEUS_BASE_URL =
  import.meta.env.VITE_AMADEUS_BASE_URL || "https://test.api.amadeus.com";

// ============================================
// TYPES
// ============================================

export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  status?: number;
}

// ============================================
// HTTP CLIENT
// ============================================

/**
 * Make an authenticated request to the Amadeus API
 *
 * @param endpoint - API endpoint (e.g., "/v2/shopping/flight-offers")
 * @param config - Request configuration
 * @returns Response data
 *
 * @example
 * ```ts
 * const data = await httpClient('/v1/reference-data/locations', {
 *   params: { keyword: 'NYC', subType: 'AIRPORT,CITY' }
 * });
 * ```
 */
export async function httpClient<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { method = "GET", headers = {}, body, params } = config;

  // Get token from auth store (will fetch if needed)
  const getValidToken = useAuthStore.getState().getValidToken;
  const token = await getValidToken();

  // Build URL with query params
  let url = `${AMADEUS_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Make request
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    const errorBody = await response.text();
    const error: ApiError = {
      code: "API_ERROR",
      message: `Request failed with status ${response.status}`,
      details: errorBody,
      status: response.status,
    };

    // Handle specific error codes
    if (response.status === 401) {
      // Token expired - clear it and throw
      useAuthStore.getState().clearToken();
      error.code = "AUTH_ERROR";
      error.message = "Authentication token expired";
    }

    throw error;
  }

  return response.json();
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(endpoint: string, params?: RequestConfig["params"]) =>
    httpClient<T>(endpoint, { method: "GET", params }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    params?: RequestConfig["params"]
  ) => httpClient<T>(endpoint, { method: "POST", body, params }),

  put: <T>(
    endpoint: string,
    body?: unknown,
    params?: RequestConfig["params"]
  ) => httpClient<T>(endpoint, { method: "PUT", body, params }),

  delete: <T>(endpoint: string, params?: RequestConfig["params"]) =>
    httpClient<T>(endpoint, { method: "DELETE", params }),
};

export default httpClient;
