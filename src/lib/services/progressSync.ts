/* ============================================================
   Cloud sync for player progress (Supabase table `progress`).
   One row per user id (anonymous or permanent), holding the whole
   ProgressData blob as JSONB. Best-effort: every call no-ops when
   Supabase is unavailable so the app still works offline/local.
   ============================================================ */

import { supabase } from '../config';
import type { ProgressData } from '../stores/progress.svelte';

/**
 * Read the cloud progress row for a user.
 * Returns null only when the row is confirmed ABSENT; THROWS on a real read
 * error (network/RLS) so the caller can avoid overwriting unread cloud data
 * with local-only progress. (bug-hunt)
 */
export async function fetchCloudProgress(userId: string): Promise<ProgressData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('progress')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? ((data.data as ProgressData) ?? null) : null;
}

/** Upsert the cloud progress row for a user. Returns true on success. */
export async function pushCloudProgress(userId: string, data: ProgressData): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: userId, data }, { onConflict: 'user_id' });
    return !error;
  } catch {
    return false;
  }
}
