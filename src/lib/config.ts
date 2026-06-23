/* ============================================================
   App configuration.
   The Supabase anon ("public") key is designed to live in client
   code: Row Level Security protects the data. Never put the
   service_role / secret key here.
   Values can be overridden at build time via Vite env vars
   (VITE_SUPABASE_URL / VITE_SUPABASE_KEY).
   ============================================================ */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://klfigmugksrwaxtjlevw.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZmlnbXVna3Nyd2F4dGpsZXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTQyMDcsImV4cCI6MjA5NzczMDIwN30.PQT8NlmLMWAXTdXeA6LAvowkxmZEisd5ndmOfuceDjQ';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || DEFAULT_SUPABASE_KEY;

/** When true, the leaderboard is shared online via Supabase. */
export const SHARED = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * Shared Supabase client. Used for both the leaderboard (REST is also called
 * directly in leaderboard.ts) and Auth (anonymous guest sessions + magic-link).
 * `detectSessionInUrl` lets the magic-link callback complete on page load.
 * Everything that uses this must degrade gracefully when it's null.
 */
export const supabase: SupabaseClient | null = SHARED
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

/** localStorage keys. */
export const LB_KEY = 'tkd_quiz_lb_v1';
export const PROGRESS_KEY = 'tkd_quiz_progress_v1';
export const THEME_KEY = 'tkd_quiz_theme_v1';
export const SETTINGS_KEY = 'tkd_quiz_settings_v1';
