<script lang="ts">
  import { gameStore } from '../../stores/game.svelte';
  import { challengeStore } from '../../stores/challenge.svelte';
  import { ROUNDS, MATCH_SIZE } from '../../challenge';

  let copied = $state(false);

  async function copyLink() {
    const url = challengeStore.shareUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      /* clipboard blocked — the link is shown for manual copy */
    }
  }

  function appUrl(): string {
    return typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : '';
  }

  async function shareResult() {
    const r = challengeStore.result;
    if (!r) return;
    const text = `Quiz Taekwon-Do — sfida: ${me().name} ${me().score} vs ${opp().name} ${opp().score}`;
    try {
      if (navigator.share) await navigator.share({ text, url: appUrl() });
      else await navigator.clipboard.writeText(`${text} ${appUrl()}`);
    } catch {
      /* user dismissed the share sheet */
    }
  }

  // ---- result mapping (which stored side is "me") ----
  const isCreator = $derived(challengeStore.role === 'creator');
  function me() {
    const r = challengeStore.result!;
    return isCreator
      ? { name: r.creator_name, rp: r.creator_round_points, score: r.creator_score }
      : { name: r.opponent_name ?? 'Tu', rp: r.opponent_round_points ?? [], score: r.opponent_score ?? 0 };
  }
  function opp() {
    const r = challengeStore.result!;
    return isCreator
      ? { name: r.opponent_name ?? 'Avversario', rp: r.opponent_round_points ?? [], score: r.opponent_score ?? 0 }
      : { name: r.creator_name, rp: r.creator_round_points, score: r.creator_score };
  }
  const outcome = $derived.by(() => {
    const w = challengeStore.result?.winner;
    if (w === 'draw') return 'draw';
    return w === (isCreator ? 'creator' : 'opponent') ? 'win' : 'loss';
  });
</script>

<section class="screen">
  <div class="head">
    <button class="restart-btn" onclick={() => gameStore.goHome()}>← Home</button>
    {#if challengeStore.phase === 'menu'}
      <button class="ghost-sm" onclick={() => gameStore.goChallengeLadder()}>🏆 Classifica</button>
    {/if}
  </div>

  <!-- ===== MENU ===== -->
  {#if challengeStore.phase === 'menu'}
    <h1 class="title">⚔️ <span class="grad">Sfide</span></h1>
    <p class="sub">Meglio di {ROUNDS} round · {MATCH_SIZE} domande · stesse domande per entrambi</p>

    <label class="field">
      <span>Il tuo nome</span>
      <input class="name-box" maxlength="18" placeholder="Come ti chiami?" bind:value={gameStore.playerName} />
    </label>

    <button class="cta" onclick={() => challengeStore.startFriend()}>👥 Sfida un amico</button>
    <button class="cta alt" onclick={() => challengeStore.startRandom()}>🎲 Avversario casuale</button>

    {#if !challengeStore.available}
      <p class="note">⚠️ Sfide online non disponibili al momento.</p>
    {/if}

  <!-- ===== LOADING ===== -->
  {:else if challengeStore.phase === 'loading'}
    <div class="center"><div class="big">⏳</div><p>Un attimo…</p></div>

  <!-- ===== INTRO (opponent via link) ===== -->
  {:else if challengeStore.phase === 'intro'}
    <div class="center">
      <div class="big">⚔️</div>
      <h1 class="title">{challengeStore.loadedRow?.creator_name ?? 'Qualcuno'} ti sfida!</h1>
      <p class="sub center-t">Meglio di {ROUNDS} round · {MATCH_SIZE} domande, le stesse del tuo sfidante.</p>
      <label class="field">
        <span>Il tuo nome</span>
        <input class="name-box" maxlength="18" placeholder="Come ti chiami?" bind:value={gameStore.playerName} />
      </label>
      <button class="cta" onclick={() => challengeStore.playLoaded()}>Accetta la sfida</button>
      <button class="ghost" onclick={() => challengeStore.open()}>Annulla</button>
    </div>

  <!-- ===== INTERSTITIAL between rounds ===== -->
  {:else if challengeStore.phase === 'interstitial'}
    <div class="center">
      <div class="big">🥋</div>
      <h1 class="title">Round {challengeStore.roundNo} di {ROUNDS}</h1>
      <p class="sub center-t">Preparati…</p>
    </div>

  <!-- ===== AWAIT (creator waiting for opponent) ===== -->
  {:else if challengeStore.phase === 'await'}
    <div class="center">
      <div class="big">📨</div>
      {#if challengeStore.isRandom}
        <h1 class="title">In cerca di un avversario…</h1>
        <p class="sub center-t">La tua sfida è in coda. Ti avviseremo qui quando qualcuno risponde.</p>
      {:else}
        <h1 class="title">Sfida pronta!</h1>
        <p class="sub center-t">Manda questo link al tuo avversario. Resta qui: appena risponde vedi il risultato.</p>
        {#if challengeStore.shareUrl}
          <div class="link-box">{challengeStore.shareUrl}</div>
          <button class="cta" onclick={copyLink}>{copied ? '✓ Copiato!' : '🔗 Copia link'}</button>
        {/if}
      {/if}
      <button class="ghost" onclick={() => gameStore.goHome()}>Torna alla home</button>
    </div>

  <!-- ===== RESULT (head-to-head) ===== -->
  {:else if challengeStore.phase === 'result' && challengeStore.result}
    <div class="banner {outcome}">
      {#if outcome === 'win'}🏆 Hai vinto!{:else if outcome === 'loss'}Hai perso{:else}🤝 Pareggio{/if}
    </div>

    <div class="vs">
      <div class="vs-name me">{me().name}</div>
      <div class="vs-mid">vs</div>
      <div class="vs-name">{opp().name}</div>
    </div>

    <div class="rounds">
      {#each Array(ROUNDS) as _, i (i)}
        {@const mp = me().rp[i] ?? 0}
        {@const op = opp().rp[i] ?? 0}
        <div class="rrow">
          <span class="rp" class:won={mp > op}>{mp}</span>
          <span class="rlabel">Round {i + 1}</span>
          <span class="rp" class:won={op > mp}>{op}</span>
        </div>
      {/each}
      <div class="rrow total">
        <span class="rp" class:won={me().score > opp().score}>{me().score}</span>
        <span class="rlabel">Totale</span>
        <span class="rp" class:won={opp().score > me().score}>{opp().score}</span>
      </div>
    </div>

    <div class="actions">
      <button class="cta" onclick={() => challengeStore.rematch()}>🔁 Rivincita</button>
      <button class="ghost" onclick={shareResult}>📤 Condividi</button>
      <button class="ghost" onclick={() => gameStore.goChallengeLadder()}>🏆 Classifica sfide</button>
      <button class="ghost" onclick={() => challengeStore.open()}>⚔️ Nuova sfida</button>
      <button class="ghost" onclick={() => gameStore.goHome()}>← Home</button>
    </div>

  <!-- ===== ERROR ===== -->
  {:else if challengeStore.phase === 'error'}
    <div class="center">
      <div class="big">⚠️</div>
      <p class="sub center-t">{challengeStore.error ?? 'Qualcosa è andato storto.'}</p>
      <button class="cta" onclick={() => challengeStore.open()}>Torna alle sfide</button>
    </div>
  {/if}
</section>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    min-height: 44px;
  }
  .restart-btn,
  .ghost-sm {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--ink);
    font-size: 0.82rem;
    padding: 9px 14px;
    min-height: 40px;
    border-radius: 999px;
    font-weight: 700;
  }
  .title {
    text-align: left;
    margin-bottom: 2px;
  }
  .sub {
    text-align: left;
    color: var(--ink-soft);
    font-size: 0.84rem;
    font-weight: 500;
    margin-bottom: 16px;
  }
  .center-t {
    text-align: center;
  }
  .field {
    display: block;
    margin-bottom: 14px;
  }
  .field span {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  .name-box {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xs);
    font-size: max(16px, 0.98rem);
    font-family: inherit;
    font-weight: 650;
    background: var(--surface);
    color: var(--ink);
  }
  .name-box:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent);
  }
  .cta {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: var(--radius-xs);
    background: var(--primary);
    color: #fff;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.02rem;
    cursor: pointer;
    margin-bottom: 10px;
  }
  .cta.alt {
    background: color-mix(in srgb, var(--primary) 16%, var(--surface));
    color: var(--ink);
    border: 1px solid var(--primary);
  }
  .ghost {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-xs);
    background: transparent;
    color: var(--ink);
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 8px;
  }
  .note {
    font-size: 0.8rem;
    color: var(--ink-soft);
    font-weight: 600;
    text-align: center;
  }
  .center {
    text-align: center;
    padding: 18px 8px;
  }
  .center .big {
    font-size: 3rem;
    margin-bottom: 8px;
  }
  .center .title {
    text-align: center;
  }
  .link-box {
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.78rem;
    word-break: break-all;
    color: var(--ink-soft);
    margin-bottom: 12px;
  }

  .banner {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1.5rem;
    padding: 16px;
    border-radius: var(--radius);
    margin-bottom: 16px;
  }
  .banner.win {
    background: color-mix(in srgb, var(--verde) 22%, var(--surface));
    color: var(--verde-d, var(--verde));
    border: 1px solid var(--verde);
  }
  .banner.loss {
    background: color-mix(in srgb, var(--rosso) 18%, var(--surface));
    color: var(--rosso-d, var(--rosso));
    border: 1px solid var(--rosso);
  }
  .banner.draw {
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--border);
  }
  .vs {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .vs-name {
    flex: 1;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1rem;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vs-name.me {
    color: var(--blu-d);
  }
  .vs-mid {
    color: var(--ink-soft);
    font-weight: 700;
    flex: 0 0 auto;
  }
  .rounds {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 18px;
  }
  .rrow {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 14px;
  }
  .rrow.total {
    background: var(--primary-soft);
    border-color: var(--primary);
  }
  .rlabel {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--ink-soft);
    text-align: center;
  }
  .rp {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--ink-soft);
    text-align: center;
  }
  .rp:first-child {
    text-align: left;
  }
  .rp:last-child {
    text-align: right;
  }
  .rp.won {
    color: var(--verde-d, var(--verde));
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
