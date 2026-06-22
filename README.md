# 🥋 Quiz Taekwon-Do · Esame Cinture

Gioco a quiz (in italiano) per allenarsi all'esame di cintura di Taekwon-Do ITF.
Scegli la **cintura** (Gialla → Nera) e il **livello di difficoltà**, rispondi con un
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
- **Cintura**: Gialla, Gialla superiore, Verde, Verde-Blu, Blu, Blu superiore, Rossa, Nera
  (cumulativa: ogni cintura include le domande delle cinture inferiori).
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

## 📁 Struttura
- `src/` — codice dell'app (componenti Svelte, store, dati, servizi)
- `src/lib/data/questions.ts` — il banco domande
- `docs/superpowers/specs/` — documento di design dell'architettura
- `index.html` — entry point Vite
- `.github/workflows/deploy.yml` — deploy automatico su GitHub Pages
