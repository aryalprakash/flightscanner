/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMADEUS_BASE_URL: string;
  readonly VITE_AMADEUS_CLIENT_ID: string;
  readonly VITE_AMADEUS_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
