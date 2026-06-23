# 🥋 Quiz Taekwon-Do · Esame Cinture

Gioco a quiz (in italiano) per allenarsi all'esame di cintura di Taekwon-Do ITF.
Scegli la **cintura** (Bianca sup. → Nera) e il **livello di difficoltà**, rispondi con un
**timer di 10 secondi**, accumula **XP, serie (streak) e traguardi**, ripassa gli errori
con la **modalità studio** e scala la **classifica**.

Contenuti tratti dal manuale d'esame ECLIPSE Taekwon-Do Academy ed estesi con nozioni ITF.

Costruito con **Svelte 5 + Vite + TypeScript**. Tema chiaro/scuro, feedback audio e aptico,
PWA-friendly, classifica online opzionale via Supabase.

## ▶️ Sviluppo

Richiede Node 20+.

```bash
npm install      # installa le dipendenze
npm run dev      # server di sviluppo (http://localhost:5173)
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build
npm run check    # type-check (svelte-check + tsc)
```

## 🎮 Come si gioca
- **Cintura**: Bianca superiore, Gialla, Gialla superiore, Verde, Verde-Blu, Blu, Blu superiore,
  Rossa, Rossa superiore, Nera — 10 gradi (cumulativa: ogni cintura include le domande dei gradi inferiori).
- **Difficoltà**: Facile (10 domande, livello 1), Medio (15, liv. 1-2), Tosto (20, tutti i livelli).
- **Quiz**: 10 secondi per risposta, punteggio, serie 🔥, XP con bonus velocità, coriandoli 🎉.
- **Traguardi**: badge sbloccabili (esame perfetto, fulmine, serie da 10, maestro…).
- **Studia**: sfoglia le domande senza timer; segna quelle da ripassare.
- **Ripasso**: le domande sbagliate tornano con ripetizione dilazionata (spaced repetition).

## 🌐 Pubblicare su GitHub Pages (automatico)
Il repository include un workflow GitHub Actions (`.github/workflows/deploy.yml`) che
**builda e pubblica automaticamente** ad ogni push su `main`.

1. Push del codice su un repository GitHub.
2. Su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Ad ogni push su `main`, l'app viene pubblicata su
   `https://TUONOME.github.io/quiz-taekwondo/`.

> La `base` di Vite è relativa (`./`), quindi l'app funziona sotto qualsiasi sottocartella
> di GitHub Pages senza configurazione aggiuntiva.

## 🏆 Classifica condivisa (Supabase)
La classifica online è **già attiva**: l'URL del progetto e la chiave **anon public** sono
in `src/lib/config.ts` (la chiave anon è pensata per stare nel codice del sito — è protetta
da Row Level Security). Se Supabase non è raggiungibile, l'app usa automaticamente una
**classifica locale** sul dispositivo.

Per puntare a un altro progetto Supabase, sovrascrivi i valori al build via variabili
d'ambiente Vite (file `.env.local` oppure secret della GitHub Action):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_KEY=<chiave anon public>
```

La tabella `scores` va creata una volta sola nel progetto Supabase (**SQL Editor → New query**):

```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  name text,
  score int,
  total int,
  pct int,
  belt int,
  diff text,
  created_at timestamptz default now()
);
alter table scores enable row level security;
create policy "lettura pubblica"     on scores for select using (true);
create policy "inserimento pubblico" on scores for insert with check (true);
```

> ⚠️ Non usare mai la chiave `service_role` / `secret` nel client.

## 🔐 Accesso (Supabase Auth) — ospite + magic link
Il login è **facoltativo e guest-first**: all'avvio l'app crea una sessione
**anonima** (ospite), così ogni giocatore ha un id stabile. Dalla schermata
iniziale, con **💾 Salva i progressi** si inserisce l'email e si riceve un
**magic link** (nessuna password) che converte l'ospite in account permanente,
ritrovabile su ogni dispositivo. Se Supabase Auth non è raggiungibile o non è
configurato, l'app continua a funzionare in **modalità locale** senza login.

Per attivarlo servono tre passaggi una tantum nel dashboard Supabase:

1. **Authentication → Sign In / Providers**
   - abilitare **Email** (con *magic link* / OTP);
   - abilitare **Anonymous sign-ins**.
2. **Authentication → URL Configuration**
   - aggiungere l'URL pubblico (es. `https://TUONOME.github.io/quiz-taekwondo/`)
     tra i **Redirect URLs** (così il magic link riporta all'app).
3. **SQL Editor → New query** — aggiungere la colonna che lega i punteggi
   all'utente (l'app funziona anche senza, ma i punteggi non sarebbero collegati
   all'account):

```sql
alter table scores add column if not exists user_id uuid references auth.users(id);
create index if not exists scores_user_id_idx on scores(user_id);

-- Tempo totale della partita (secondi): spareggio della classifica — a parità
-- di punti, chi ci ha messo meno sta sopra.
alter table scores add column if not exists secs real;

-- (consigliato) policy di inserimento più stretta: ognuno scrive solo i propri
-- punteggi (o righe anonime senza user_id). Sostituisce "inserimento pubblico".
drop policy if exists "inserimento pubblico" on scores;
create policy "inserimento proprio"
  on scores for insert
  with check (user_id is null or auth.uid() = user_id);
```

> La lettura resta pubblica (classifica visibile a tutti). L'app invia comunque
> il punteggio anche prima delle migrazioni: se le colonne `user_id`/`secs` non
> esistono ancora, l'inserimento viene ritentato automaticamente senza di esse.
> Le classifiche sono **separate per gruppo-cintura** (colore + grado superiore)
> e ordinate per punti pesati sulla difficoltà, poi per tempo totale (più veloce
> = più in alto), poi per accuratezza.

### Salvataggio automatico dei progressi nel cloud
XP, livello, badge e coda di ripasso si salvano in automatico nel cloud, legati
all'utente (anonimo o permanente): al primo accesso vengono caricati e uniti a
quelli locali, poi tenuti aggiornati ad ogni partita. Si ritrovano così su ogni
dispositivo dopo aver collegato l'email. Crea la tabella una volta sola:

```sql
create table if not exists progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table progress enable row level security;

-- Ognuno legge/scrive SOLO la propria riga.
create policy "progress: leggi i propri"  on progress for select using (auth.uid() = user_id);
create policy "progress: crea i propri"   on progress for insert with check (auth.uid() = user_id);
create policy "progress: aggiorna i propri" on progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Se questa tabella non esiste, il sync cloud resta semplicemente inattivo e i
> progressi continuano a salvarsi in locale (per dispositivo): nessun errore
> bloccante.

### Classifica giocatori (carriera)
La schermata **🏆 Classifica giocatori** ordina i giocatori per un *punteggio
carriera* (XP + trofei + punti cumulati) e mostra il cumulato per colore di
cintura. Serve una tabella **pubblica** `profiles` (un record per giocatore,
scritto dal client a fine partita; lettura pubblica, scrittura solo della
propria riga). Crea la tabella una volta sola:

```sql
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  xp int not null default 0,
  level int not null default 1,
  badges int not null default 0,
  cum_points int not null default 0,
  by_color jsonb not null default '{}',
  career int not null default 0,
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;

-- Lettura pubblica (classifica visibile a tutti).
create policy "profiles: lettura pubblica" on profiles for select using (true);
-- Scrittura solo della propria riga (richiede sessione: il client usa il JWT).
create policy "profiles: crea i propri"    on profiles for insert with check (auth.uid() = user_id);
create policy "profiles: aggiorna i propri" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Senza questa tabella la classifica giocatori resta semplicemente vuota
> ("non ancora attiva"): nessun errore bloccante. Il cumulato per colore parte
> dal momento dell'attivazione (le partite successive si accumulano).

## 📁 Struttura
- `src/` — codice dell'app (componenti Svelte, store, dati, servizi)
- `src/lib/data/questions.ts` — il banco domande
- `docs/superpowers/specs/` — documento di design dell'architettura
- `index.html` — entry point Vite
- `.github/workflows/deploy.yml` — deploy automatico su GitHub Pages
