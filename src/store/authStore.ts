/**
 * Auth Store
 *
 * Zustand store for managing Amadeus API authentication token.
 * Token is fetched once and reused across all API calls.
 */

import { create } from "zustand";

// ============================================
// CONFIGURATION
// ============================================

const AMADEUS_BASE_URL =
  import.meta.env.VITE_AMADEUS_BASE_URL || "https://test.api.amadeus.com";
const AMADEUS_CLIENT_ID = import.meta.env.VITE_AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

// Buffer time before expiry to refresh token (60 seconds)
const TOKEN_EXPIRY_BUFFER = 60 * 1000;

// ============================================
// TYPES
// ============================================

interface AmadeusAuthResponse {
  type: string;
  username: string;
  application_name: string;
  client_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  state: string;
  scope: string;
}

interface AuthState {
  // State
  accessToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchToken: () => Promise<string>;
  getValidToken: () => Promise<string>;
  clearToken: () => void;
  isTokenValid: () => boolean;
}

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  accessToken: null,
  expiresAt: null,
  isLoading: false,
  error: null,

  // Check if current token is still valid
  isTokenValid: () => {
    const { accessToken, expiresAt } = get();
    if (!accessToken || !expiresAt) return false;
    return Date.now() < expiresAt - TOKEN_EXPIRY_BUFFER;
  },

  // Fetch a new token from Amadeus OAuth
  fetchToken: async () => {
    const { isLoading, isTokenValid, accessToken } = get();

    // Return existing token if still valid
    if (isTokenValid() && accessToken) {
      return accessToken;
    }

    // Prevent concurrent token fetches
    if (isLoading) {
      // Wait for the ongoing fetch to complete
      return new Promise((resolve, reject) => {
        const checkToken = setInterval(() => {
          const state = get();
          if (!state.isLoading) {
            clearInterval(checkToken);
            if (state.accessToken) {
              resolve(state.accessToken);
            } else {
              reject(new Error(state.error || "Failed to fetch token"));
            }
          }
        }, 100);
      });
    }

    // Validate credentials
    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
      const error = "Amadeus API credentials not configured";
      set({ error, isLoading: false });
      throw { code: "CONFIG_ERROR", message: error };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: AMADEUS_CLIENT_ID,
            client_secret: AMADEUS_CLIENT_SECRET,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed: ${response.status} - ${errorText}`);
      }

      const data: AmadeusAuthResponse = await response.json();

      const newState = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        isLoading: false,
        error: null,
      };

      set(newState);
      return data.access_token;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to authenticate";
      set({
        accessToken: null,
        expiresAt: null,
        isLoading: false,
        error: errorMessage,
      });
      throw { code: "AUTH_ERROR", message: errorMessage };
    }
  },

  // Get a valid token (fetches if needed)
  getValidToken: async () => {
    const { isTokenValid, accessToken, fetchToken } = get();

    if (isTokenValid() && accessToken) {
      return accessToken;
    }

    return fetchToken();
  },

  // Clear the stored token
  clearToken: () => {
    set({
      accessToken: null,
      expiresAt: null,
      error: null,
    });
  },
}));

// ============================================
// SELECTORS
// ============================================

export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectIsAuthenticated = (state: AuthState) =>
  state.accessToken !== null && state.isTokenValid();
export const selectAuthError = (state: AuthState) => state.error;
export const selectAuthLoading = (state: AuthState) => state.isLoading;

export default useAuthStore;
