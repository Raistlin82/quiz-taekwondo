<script lang="ts">
  import { slide } from 'svelte/transition';
  import { authStore } from '../stores/auth.svelte';
  import { motionMs } from '../motion';

  // Only render when Supabase Auth is wired up at all.
  const show = $derived(authStore.available);

  let expanded = $state(false);
  let email = $state('');

  function toggle() {
    expanded = !expanded;
    if (!expanded) authStore.resetSave();
  }

  async function submit() {
    await authStore.saveWithEmail(email);
    if (authStore.status === 'sent') email = '';
  }
</script>

{#if show}
  <div class="auth">
    {#if authStore.isLoggedIn}
      <div class="who">
        <span class="dot" aria-hidden="true">👤</span>
        <span class="who-txt" title={authStore.email ?? ''}>
          {authStore.displayName}<span class="email"> · {authStore.email}</span>
        </span>
        <button class="link" onclick={() => authStore.signOut()}>Esci</button>
      </div>
    {:else}
      <button class="save-toggle" onclick={toggle} aria-expanded={expanded}>
        💾 Salva i progressi {expanded ? '▴' : '▾'}
      </button>
      {#if expanded}
        <div class="save-box" transition:slide={{ duration: motionMs(180) }}>
          {#if authStore.status === 'sent'}
            <p class="msg ok" role="status">✅ {authStore.message}</p>
          {:else}
            <p class="blurb">Inserisci la tua email: ricevi un link per ritrovare progressi e classifica su ogni dispositivo. Nessuna password.</p>
            <div class="row">
              <input
                class="email-box"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="latua@email.it"
                bind:value={email}
                onkeydown={(e) => e.key === 'Enter' && submit()}
              />
              <button class="send" onclick={submit} disabled={authStore.status === 'sending'}>
                {authStore.status === 'sending' ? '…' : 'Invia'}
              </button>
            </div>
            {#if authStore.status === 'error'}
              <p class="msg err" role="status">⚠️ {authStore.message}</p>
            {/if}
          {/if}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .auth {
    margin-top: 4px;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 12px;
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--ink);
  }
  .who-txt {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .email {
    color: var(--ink-soft);
    font-weight: 600;
  }
  .link {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: var(--blu);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
    padding: 2px 4px;
    min-height: 0;
  }
  .save-toggle {
    width: 100%;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: 14px;
    padding: 9px 12px;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .save-box {
    margin-top: 8px;
  }
  .blurb {
    font-size: 0.78rem;
    color: var(--ink-soft);
    margin: 0 0 8px;
    line-height: 1.35;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .email-box {
    flex: 1;
    padding: 11px 14px;
    border: 2px solid var(--border);
    border-radius: 14px;
    /* >=16px prevents iOS Safari zoom on focus */
    font-size: max(16px, 0.98rem);
    font-family: inherit;
    font-weight: 600;
    background: var(--surface);
    color: var(--ink);
  }
  .email-box:focus {
    outline: none;
    border-color: var(--blu);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent);
  }
  .send {
    flex: 0 0 auto;
    padding: 0 18px;
    min-height: 44px;
    border: none;
    border-radius: 14px;
    background: var(--blu);
    color: #fff;
    font-weight: 800;
    cursor: pointer;
  }
  .send:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .msg {
    font-size: 0.8rem;
    font-weight: 700;
    margin: 8px 0 0;
    line-height: 1.35;
  }
  .msg.ok {
    color: var(--verde-d, var(--verde));
  }
  .msg.err {
    color: var(--amber-ink);
  }
</style>
