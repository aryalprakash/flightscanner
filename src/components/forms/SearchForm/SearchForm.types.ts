/**
 * SearchForm Types
 */

import type { LocationSearchResult } from "@/api/services/locationService";

// Re-export LocationSearchResult as the Airport type for form values
export type Airport = LocationSearchResult;

export type TripType = "one-way" | "round-trip" | "multi-city";

export type TravelClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface SearchFormValues {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  departureDate: string;
  returnDate: string;
  passengers: PassengerCount;
  travelClass: TravelClass;
}

export interface SearchFormProps {
  /** Called when form is submitted with valid data */
  onSubmit: (values: SearchFormValues) => void;
  /** Optional loading state to disable form during search */
  isLoading?: boolean;
  /** Optional initial values */
  initialValues?: Partial<SearchFormValues>;
}

export interface SearchFormValidation {
  isValid: boolean;
  errors: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
  };
}

// Constants for dropdown options
export const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: "round-trip", label: "Round trip" },
  { value: "one-way", label: "One way" },
  { value: "multi-city", label: "Multi-city" },
];

export const TRAVEL_CLASS_OPTIONS: { value: TravelClass; label: string }[] = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];
