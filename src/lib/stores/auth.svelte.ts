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

/** True when the current URL carries a magic-link / OAuth return (PKCE code,
 *  token hash, or implicit-flow hash). On such a load the code exchange owns
 *  the session, so we must NOT start a competing anonymous guest session. */
function urlHasAuthReturn(): boolean {
  if (typeof window === 'undefined') return false;
  const { search, hash } = window.location;
  return /[?&](code|token_hash|error)=/.test(search) || /(access_token|error|type)=/.test(hash);
}

/** Read an auth error from the magic-link return URL (hash or query), if any.
 *  On a failed return (expired / already-used link) auth-js throws BEFORE it
 *  clears the hash, so these params are still here — we use them to show a real
 *  message instead of silently dropping the user back to a guest session. */
function authErrorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const fromBoth = (key: string): string | null => {
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return q.get(key) || h.get(key);
  };
  const code = fromBoth('error_code') ?? '';
  const err = fromBoth('error') ?? '';
  if (!code && !err) return null;
  if (/expired/i.test(code) || /access_denied/i.test(err)) {
    return 'Il link di accesso è scaduto o è già stato usato. Richiedine uno nuovo qui sotto.';
  }
  return 'Accesso non riuscito. Richiedi un nuovo link qui sotto.';
}

/** Strip auth params from the URL after the session is established, so a manual
 *  refresh doesn't try to re-exchange an already-consumed code. */
function cleanAuthReturnFromUrl(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    ['code', 'token_hash', 'type', 'error', 'error_description'].forEach((k) =>
      url.searchParams.delete(k),
    );
    url.hash = '';
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}

class AuthStore {
  user = $state<User | null>(null);
  /** True once init() has settled (so the UI can avoid flicker). */
  ready = $state(false);
  status = $state<SaveStatus>('idle');
  message = $state<string | null>(null);
  private authSub: { unsubscribe: () => void } | null = null;

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
    // Collapse duplicate same-id events (Supabase fires INITIAL_SESSION and
    // SIGNED_IN for the same anon id) so progress isn't re-fetched/re-merged. (bug-hunt)
    if (u?.id === this.user?.id) {
      this.user = u;
      return;
    }
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
      const authReturn = urlHasAuthReturn();
      // Capture any error the magic link came back with BEFORE we tidy the URL.
      const authErr = authReturn ? authErrorFromUrl() : null;
      // Subscribe FIRST so the SIGNED_IN fired by the magic-link code exchange
      // is caught even if it resolves after getSession().
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        this.applyUser(session?.user ?? null);
        // A returning magic-link login confirms the "saved" state.
        if (this.isLoggedIn && this.status !== 'idle') this.status = 'idle';
      });
      this.authSub = sub.subscription;

      const { data } = await supabase.auth.getSession();
      this.applyUser(data.session?.user ?? null);

      // Coming back from a magic link: the code exchange (awaited by getSession
      // above) owns this load — we must not race a guest session that masks the
      // login. So only tidy the URL here.
      if (authReturn) cleanAuthReturnFromUrl();
      // Start a guest session whenever we STILL have none: a fresh visit, OR a
      // failed/expired/consumed magic-link return (so the player isn't stranded
      // session-less). Gating on !this.user can't clobber a successful login.
      if (!this.user) {
        const { data: anon } = await supabase.auth.signInAnonymously();
        this.applyUser(anon.user ?? null);
      }
      // If the magic link came back with an error and we did NOT end up logged
      // in, surface it so the user gets feedback instead of a silent guest.
      if (authErr && !this.isLoggedIn) {
        this.status = 'error';
        this.message = authErr;
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
      // Drop the permanent account's progress before binding a fresh guest, so
      // it isn't merged into / pushed to the new anonymous cloud row. (bug-hunt)
      progressStore.resetForSignOut();
      const { data } = await supabase.auth.signInAnonymously();
      this.applyUser(data.user ?? null);
    } catch {
      // signOut may have cleared the server session before throwing — try to
      // recover a guest session so score writes keep working without a reload.
      try {
        const { data } = await supabase.auth.signInAnonymously();
        this.applyUser(data.user ?? null);
      } catch {
        this.applyUser(null);
      }
    }
  }

  resetSave(): void {
    this.status = 'idle';
    this.message = null;
  }
}

export const authStore = new AuthStore();
