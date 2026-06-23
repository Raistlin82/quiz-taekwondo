/* ============================================================
   Authentication (Supabase Auth) — guest-first, login optional.
   Runes-based singleton, mirrors the other stores.

   Model: on init we sign in ANONYMOUSLY so every player has a
   stable user id (guest). The player can later "save" their
   progress by entering an email → magic link, which CONVERTS the
   anonymous user into a permanent one (updateUser). All of this is
   best-effort: if Supabase Auth is unreachable or not configured,
   the app keeps working in pure-local mode (user stays null).
   ============================================================ */

import { supabase } from '../config';
import { progressStore } from './progress.svelte';
import type { User } from '@supabase/supabase-js';

type SaveStatus = 'idle' | 'sending' | 'sent' | 'error';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Redirect target for the magic link — same page, works under any GH Pages subpath. */
function redirectTo(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.origin + window.location.pathname;
}

class AuthStore {
  user = $state<User | null>(null);
  /** True once init() has settled (so the UI can avoid flicker). */
  ready = $state(false);
  status = $state<SaveStatus>('idle');
  message = $state<string | null>(null);

  /** Auth is wired up at all (Supabase client present). */
  get available(): boolean {
    return !!supabase;
  }
  /** Signed in with a real (permanent) account. */
  get isLoggedIn(): boolean {
    return !!this.user && !this.user.is_anonymous;
  }
  /** Anonymous guest session. */
  get isGuest(): boolean {
    return !!this.user && !!this.user.is_anonymous;
  }
  get email(): string | null {
    return this.user?.email ?? null;
  }
  /** Stable id to attach to leaderboard rows (null when no session). */
  get userId(): string | null {
    return this.user?.id ?? null;
  }
  /** Friendly name derived from the email, for prefilling the player name. */
  get displayName(): string | null {
    const e = this.user?.email;
    return e ? e.split('@')[0].slice(0, 18) : null;
  }

  /** Set the active user and (re)bind progress cloud-sync to it. */
  private applyUser(u: User | null): void {
    this.user = u;
    void progressStore.attachUser(u?.id ?? null);
  }

  /** Load any existing session, create a guest one, and subscribe to changes. */
  async init(): Promise<void> {
    if (!supabase) {
      this.ready = true;
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      this.applyUser(data.session?.user ?? null);
      supabase.auth.onAuthStateChange((_event, session) => {
        this.applyUser(session?.user ?? null);
        // A returning magic-link login confirms the "saved" state.
        if (this.isLoggedIn && this.status !== 'idle') this.status = 'idle';
      });
      // No session yet → start an anonymous (guest) one so scores get a stable id.
      if (!this.user) {
        const { data: anon } = await supabase.auth.signInAnonymously();
        this.applyUser(anon.user ?? null);
      }
    } catch {
      /* Auth not configured/unreachable — stay in local mode. */
    } finally {
      this.ready = true;
    }
  }

  /**
   * Save progress to a permanent account via an emailed magic link.
   * If the current session is anonymous we CONVERT it (updateUser) so the
   * guest's scores carry over; otherwise we send a normal OTP sign-in link.
   */
  async saveWithEmail(email: string): Promise<void> {
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      this.status = 'error';
      this.message = 'Inserisci un indirizzo email valido.';
      return;
    }
    if (!supabase) {
      this.status = 'error';
      this.message = 'Login non disponibile al momento.';
      return;
    }
    this.status = 'sending';
    this.message = null;
    try {
      if (this.isGuest) {
        // Try to convert the anonymous guest into a permanent account.
        // Pass the redirect explicitly so the confirmation lands back on the
        // app (full GH Pages subpath), not on Supabase's Site URL.
        const { error } = await supabase.auth.updateUser(
          { email: clean },
          { emailRedirectTo: redirectTo() },
        );
        if (error) {
          // Most common case: that email already has an account (e.g. the user
          // signed up before). Don't fail — send a normal sign-in magic link to
          // the existing account. Its cloud progress loads on login and any
          // local guest progress merges in (non-destructive).
          const { error: signInErr } = await supabase.auth.signInWithOtp({
            email: clean,
            options: { emailRedirectTo: redirectTo() },
          });
          if (signInErr) throw signInErr;
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: clean,
          options: { emailRedirectTo: redirectTo() },
        });
        if (error) throw error;
      }
      this.status = 'sent';
      this.message = 'Ti ho inviato un link via email: aprilo per accedere e salvare i progressi.';
    } catch {
      this.status = 'error';
      this.message = 'Invio non riuscito. Riprova tra poco.';
    }
  }

  /** Sign out of the permanent account (drops back to a fresh guest session). */
  async signOut(): Promise<void> {
    if (!supabase) return;
    this.status = 'idle';
    this.message = null;
    try {
      await supabase.auth.signOut();
      const { data } = await supabase.auth.signInAnonymously();
      this.applyUser(data.user ?? null);
    } catch {
      this.applyUser(null);
    }
  }

  resetSave(): void {
    this.status = 'idle';
    this.message = null;
  }
}

export const authStore = new AuthStore();
