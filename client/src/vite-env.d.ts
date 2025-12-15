/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_SF_SITE?: string;
  readonly VITE_SF_LOCALE?: string;
  readonly VITE_MUSEUM_TOUR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
