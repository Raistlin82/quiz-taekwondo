# 🥋 Quiz Taekwon-Do · Esame Cinture

Gioco a quiz (in italiano) per allenarsi all'esame di cintura di Taekwon-Do ITF.
Si sceglie la **cintura** (Gialla → Nera) e il **livello di difficoltà**, si risponde
alle domande con un **timer di 10 secondi**, e alla fine c'è una **classifica**.

Contenuti tratti dal manuale d'esame ECLIPSE Taekwon-Do Academy.

## ▶️ Come si gioca
Apri `index.html` in un browser (doppio clic) oppure pubblicalo online (vedi sotto).

- Scelta cintura: Gialla, Gialla superiore, Verde, Verde-Blu, Blu, Blu superiore, Rossa, Nera
- Difficoltà: Facile (10 domande), Medio (15), Tosto (20)
- 10 secondi per risposta, punteggio, ripasso degli errori, coriandoli 🎉

## 🌐 Pubblicare su GitHub Pages
1. Crea un repository **pubblico** su GitHub (es. `quiz-taekwondo`), vuoto.
2. Da terminale, in questa cartella:
   ```bash
   git init
   git add -A
   git commit -m "Quiz Taekwon-Do"
   git branch -M main
   git remote add origin https://github.com/TUONOME/quiz-taekwondo.git
   git push -u origin main
   ```
3. Sul repo: **Settings → Pages → Branch: `main` / `(root)` → Save**.
4. Dopo ~1 minuto il gioco è online su `https://TUONOME.github.io/quiz-taekwondo/`.

Per gli aggiornamenti futuri:
```bash
git add -A && git commit -m "aggiornamento" && git push
```

## 🏆 Classifica condivisa (opzionale, con Supabase)
Senza configurazione, la classifica è **locale** (salvata sul dispositivo di chi gioca).
Per una **classifica unica per tutti**, attiva Supabase (gratis):

1. Crea un progetto su https://supabase.com
2. **SQL Editor → New query**, incolla ed esegui:
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
3. Recupera **Project URL** e chiave **anon public**:
   - Project URL = `https://<project-ref>.supabase.co` (il `project-ref` è nel link del browser, dopo `/project/`), oppure pulsante **Connect** in alto.
   - Chiave anon: pulsante **Connect** oppure **Project Settings → API / API Keys**.
4. In `index.html`, in cima allo `<script>`, incolla i due valori:
   ```js
   const SUPABASE_URL="https://<project-ref>.supabase.co";
   const SUPABASE_KEY="<chiave anon public>";
   ```
5. Salva e fai `git push`. Ora la classifica è condivisa (compare "🌍 Classifica online").

> La chiave "anon public" è pensata per stare nel codice del sito: è sicura da pubblicare.
> NON usare mai la chiave `service_role` / `secret`.

## 📄 File
- `index.html` — il gioco completo (un solo file, nessuna dipendenza da installare)
- `README.md` — questo file
