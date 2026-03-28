/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_WAITLIST_TABLE?: string;
  readonly VITE_SUPABASE_WAITLIST_EMAIL_FUNCTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
