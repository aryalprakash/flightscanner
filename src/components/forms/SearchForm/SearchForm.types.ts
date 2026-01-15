/**
 * SearchForm Types
 */

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface SearchFormValues {
  origin: Airport | null;
  destination: Airport | null;
  departureDate: string;
  returnDate: string;
}

export interface SearchFormProps {
  /** Called when form is submitted with valid data */
  onSubmit: (values: SearchFormValues) => void;
  /** Optional loading state to disable form during search */
  isLoading?: boolean;
  /** Optional list of airports for autocomplete */
  airports?: Airport[];
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
