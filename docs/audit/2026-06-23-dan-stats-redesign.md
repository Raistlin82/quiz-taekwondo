# Report d'implementazione — Forme 2°/3° dan · Statistiche per categoria · Redesign

**Data:** 2026-06-23
**App:** Quiz Taekwon-Do ITF (Svelte 5 runes + Vite + TypeScript)
**Percorso:** `/Users/gabriele.rendina/tools/quiz-taekwondo`

Questo documento consolida tre filoni di lavoro:

1. le nuove forme del **2° dan (belt 11)** e **3° dan (belt 12)**, con dedica e numero di movimenti **verificati** contro il canone ITF, più le domande pronte da inserire in `src/lib/data/questions.ts`;
2. il **piano per le statistiche per categoria** (data model, UI, file toccati, pseudocodice);
3. la **scelta di redesign** dell'identità visiva, con le tre direzioni, la classifica del giudice e la raccomandazione.

In coda, un **piano d'azione** per l'implementazione.

---

## 1. Forme 2° / 3° dan — dati verificati e domande pronte

### 1.1 Premessa sul modello cinture

Lo schema cinture attuale (`src/lib/data/belts.ts`, array `BELTS`) arriva fino a **belt 10 = Nera / 1° dan = Kwang-Gae**. Per i nuovi gradi dan il task introduce:

- **belt 11 = Nera 2° dan**
- **belt 12 = Nera 3° dan**

Tutte le domande qui sotto usano la categoria **già esistente** `🥋 Le Forme` (riuso, nessuna categoria nuova). `belt` = cintura minima a cui la domanda compare; il filtro di gioco è cumulativo (`q.belt <= selBelt`), quindi le forme dan compaiono solo per chi seleziona belt 11/12.

> **Nota implementativa (bloccante per far comparire le domande):** l'array `BELTS` si ferma a `id: 10`. Le domande con `belt: 11/12` esistono nel `POOL` ma **non saranno mai selezionabili** finché non si aggiungono le voci 11 e 12 a `BELTS` (lo Start le offre iterando `BELTS`). Vedi §4.

### 1.2 Tabella forme — dedica + movimenti VERIFICATI

Tutti i verdetti del verificatore sono **`confidence: high`** con `movementsOk = true` e `dedicationOk = true`. Dove il verificatore ha suggerito una **correzione** o un **arricchimento canonico**, sotto si usa il **valore verificato** e lo si segnala in nota.

| Forma | Dan | Belt | Movimenti (verificati) | Dedica (verificata) | Esito verifica |
|---|---|---|---|---|---|
| **Eui-Am** | 2° | 11 | **45** | Son Byong Hi, leader del movimento d'indipendenza coreano del 1° marzo 1919 (Eui-Am era il suo pseudonimo) | OK — entrambi confermati (ITF ufficiale + 3 fonti). I 45 movimenti = età nel 1905, quando rinominò il Dong Hak in Chondo Kyo |
| **Choong-Jang** | 2° | 11 | **52** | Generale Kim Duk Ryang, Dinastia Yi, XIV secolo (Choong-Jang era il suo pseudonimo) | OK — confermati all'unanimità. La forma termina con attacco di mano sinistra: morte in prigione a 27 anni |
| **Juche** | 2° | 11 | **45** | Filosofia Juche: l'uomo è padrone di tutto e del proprio destino; introdotta nel 1986 al posto di Ko-Dang | OK — confermati (4 fonti). Diagramma = Monte Baekdu, spirito del popolo coreano |
| **Sam-Il** | 3° | 12 | **33** | La data del movimento per l'indipendenza coreana (1° marzo 1919) | OK — confermati (3 fonti ITF). I 33 movimenti = i 33 patrioti firmatari della Dichiarazione d'Indipendenza |
| **Yoo-Sin** | 3° | 12 | **68** | Generale **Kim Yoo Sin, generale al comando** durante la dinastia Silla; i 68 movimenti = ultime due cifre del 668 d.C., anno dell'unificazione | OK con **correzione di dicitura** applicata: il canone ITF recita "commanding general" (generale al comando), non "comandante supremo". Vedi §1.4 |
| **Choi-Yong** | 3° | 12 | **46** | Generale Choi Yong, Primo Ministro e comandante supremo delle armate, dinastia Koryo (XIV sec.) | OK — 46 è il valore canonico **moderno** (storicamente 45, poi aggiunto il 46° passo). Giustiziato da Yi Sung Gae, futuro re della dinastia Yi. Vedi §1.4 |

**Riepilogo per grado**

- **2° dan (belt 11):** Eui-Am (45) · Choong-Jang (52) · Juche (45) — 3 forme.
- **3° dan (belt 12):** Sam-Il (33) · Yoo-Sin (68) · Choi-Yong (46) — 3 forme.

> Attenzione a non confondere la dinastia **Koryo** (Choi-Yong) con **Koguryo/Goguryeo** (Kwang-Gae). Sono regni diversi.

### 1.3 Elenco domande pronte da inserire

Formato identico al tipo `Question` in `src/lib/data/belts.ts` / `src/lib/data/questions.ts`:
`{ cat, belt, lvl, q, options[4], answer (0..3), explain }`. La `answer` è sempre l'indice dell'opzione corretta **prima** dello shuffle (il game store rimescola le opzioni a runtime, vedi `shuffleOptions` in `game.svelte.ts`).

**Totale domande dan pronte: 22** (belt 11: 12 · belt 12: 10).

#### 2° dan — belt 11

```ts
// ===== LE FORME · 2° DAN (belt 11) =====
{ cat: '🥋 Le Forme', belt: 11, lvl: 2, q: 'A chi è dedicata la forma Eui-Am?', options: ["A Son Byong Hi, leader del movimento per l'indipendenza coreana", 'Al Generale Kim Duk Ryang', 'Al monaco Won-Hyo', 'Al re Kwang-Gae'], answer: 0, explain: "Eui-Am è lo pseudonimo di Son Byong Hi, leader del movimento d'indipendenza del 1° marzo 1919." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'Quanti movimenti ha la forma Eui-Am?', options: ['45', '52', '37', '30'], answer: 0, explain: "Eui-Am ha 45 movimenti, pari all'età di Son Byong Hi nel 1905." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'A cosa corrispondono i 45 movimenti di Eui-Am?', options: ["All'età di Son Byong Hi quando rinominò il Dong Hak in Chondo Kyo (1905)", 'Agli anni di prigionia di Son Byong Hi', 'Al numero di battaglie vinte', "All'anno del movimento d'indipendenza"], answer: 0, explain: "I 45 movimenti indicano l'età che Son Byong Hi aveva nel 1905, quando cambiò il nome del Dong Hak in Chondo Kyo." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 2, q: 'Cosa rappresenta il diagramma della forma Eui-Am?', options: ['Lo spirito indomito di Son Byong Hi al servizio della sua nazione', 'La montagna Baekdu', 'Una spada coreana', 'Il sole nascente'], answer: 0, explain: "Il diagramma simboleggia lo spirito indomito mostrato da Son Byong Hi mentre si dedicava alla prosperità della nazione." },

{ cat: '🥋 Le Forme', belt: 11, lvl: 2, q: 'A chi è dedicata la forma Choong-Jang?', options: ['Al Generale Kim Duk Ryang', 'A Son Byong Hi', "All'ammiraglio Yi Sun-Sin", 'Al re Kwang-Gae'], answer: 0, explain: 'Choong-Jang è lo pseudonimo del Generale Kim Duk Ryang, vissuto durante la Dinastia Yi nel XIV secolo.' },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'Quanti movimenti ha la forma Choong-Jang?', options: ['52', '45', '38', '44'], answer: 0, explain: 'Choong-Jang ha 52 movimenti.' },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'Cosa simboleggia il fatto che Choong-Jang termini con un attacco di mano sinistra?', options: ['La tragedia della morte di Kim Duk Ryang in prigione a 27 anni', 'La vittoria finale in battaglia', "L'inizio di una nuova dinastia", 'Il rispetto verso il maestro'], answer: 0, explain: "L'attacco finale di mano sinistra simboleggia la morte prematura di Kim Duk Ryang, deceduto in prigione a 27 anni prima di raggiungere la piena maturità." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 2, q: 'In quale epoca visse il Generale Kim Duk Ryang, a cui è dedicata Choong-Jang?', options: ['Durante la Dinastia Yi, nel XIV secolo', 'Durante la Dinastia Goguryeo, nel IV secolo', 'Durante la guerra di Corea, nel XX secolo', 'Durante la Dinastia Silla, nel VII secolo'], answer: 0, explain: 'Kim Duk Ryang visse sotto la Dinastia Yi, nel XIV secolo.' },

{ cat: '🥋 Le Forme', belt: 11, lvl: 2, q: 'Qual è il significato della forma Juche?', options: ["L'idea che l'uomo è padrone di tutto e del proprio destino", 'La via della spada del guerriero', 'Il rispetto per gli antenati', 'La forza della tigre'], answer: 0, explain: "Juche è l'idea filosofica secondo cui l'uomo è il padrone di tutto e decide di ogni cosa, padrone del mondo e del proprio destino." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'Quanti movimenti ha la forma Juche?', options: ['45', '52', '30', '68'], answer: 0, explain: "Juche ha 45 movimenti, con il piede destro che torna alla posizione iniziale." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'Cosa rappresenta il diagramma della forma Juche?', options: ['Il Monte Baekdu, simbolo dello spirito del popolo coreano', 'Una pagoda buddista', 'Il fiume Han', 'Una spada incrociata'], answer: 0, explain: "Il diagramma rappresenta il Monte Baekdu, in cui l'idea Juche affonda le sue radici e che simboleggia lo spirito del popolo coreano." },
{ cat: '🥋 Le Forme', belt: 11, lvl: 3, q: 'Quale forma sostituì Juche quando fu introdotta nel 1986?', options: ['Ko-Dang', 'Kwang-Gae', 'Choong-Moo', 'Hwa-Rang'], answer: 0, explain: 'Juche fu introdotta dal Gen. Choi Hong Hi nel 1986 al posto della precedente forma Ko-Dang.' },
```

#### 3° dan — belt 12

```ts
// ===== LE FORME · 3° DAN (belt 12) =====
{ cat: '🥋 Le Forme', belt: 12, lvl: 2, q: "A quale evento storico è dedicata la forma 'Sam-Il'?", options: ["Al movimento per l'indipendenza coreana del 1° marzo 1919", 'Alla fondazione della dinastia Silla', 'Alla guerra di Corea del 1950', "All'incoronazione del re Sejong"], answer: 0, explain: "Sam-Il ('3-1') indica il 1° marzo 1919, data del movimento per l'indipendenza della Corea dall'occupazione giapponese." },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Quanti movimenti ha la forma Sam-Il?', options: ['33', '29', '38', '46'], answer: 0, explain: 'Sam-Il ha 33 movimenti, che rappresentano i 33 patrioti che organizzarono il movimento per l\'indipendenza.' },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Cosa rappresentano i 33 movimenti della forma Sam-Il?', options: ["I 33 patrioti che pianificarono il movimento per l'indipendenza", "I 33 anni di occupazione straniera", 'Le 33 province della Corea antica', 'I 33 generali della dinastia Silla'], answer: 0, explain: "I 33 movimenti simboleggiano i 33 patrioti che organizzarono il movimento del 1° marzo 1919 e firmarono la Dichiarazione di Indipendenza." },

{ cat: '🥋 Le Forme', belt: 12, lvl: 2, q: "A chi è dedicata la forma 'Yoo-Sin'?", options: ['Al generale Kim Yoo Sin della dinastia Silla', 'A un monaco buddista', 'Al fondatore della Corea', 'A un filosofo confuciano'], answer: 0, explain: 'Yoo-Sin ricorda il generale Kim Yoo Sin, generale al comando delle armate durante la dinastia Silla.' },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Quanti movimenti ha la forma Yoo-Sin?', options: ['68', '46', '33', '72'], answer: 0, explain: "Yoo-Sin ha 68 movimenti, dalle ultime due cifre del 668 d.C., anno dell'unificazione della Corea." },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Cosa rappresenta il numero 68 dei movimenti di Yoo-Sin?', options: ["Le ultime due cifre del 668 d.C., anno dell'unificazione della Corea", "L'età del generale alla sua morte", 'Il numero delle battaglie da lui vinte', 'Gli anni della dinastia Silla'], answer: 0, explain: "I 68 movimenti richiamano il 668 d.C., quando i tre regni furono unificati sotto il comando di Kim Yoo Sin." },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Cosa simboleggia la posizione di pronti di Yoo-Sin, con la spada impugnata a destra?', options: ["L'errore di Yoo Sin nel combattere il proprio popolo per ordine del re", 'La sua abilità nel combattere con entrambe le mani', 'Il suo rango di comandante supremo', 'La direzione del sorgere del sole'], answer: 0, explain: "La spada impugnata a destra anziché a sinistra ricorda l'errore di Yoo Sin nel seguire l'ordine del re di combattere il proprio popolo a fianco delle forze straniere Tang." },

{ cat: '🥋 Le Forme', belt: 12, lvl: 2, q: "Chi era 'Choi Yong', a cui è dedicata la forma?", options: ['Primo Ministro e comandante supremo durante la dinastia Koryo', 'Un ammiraglio inventore della nave corazzata', 'Un monaco che introdusse il Buddismo', 'Il leggendario fondatore della Corea'], answer: 0, explain: "Choi Yong fu Primo Ministro e comandante supremo delle armate durante la dinastia Koryo nel XIV secolo, noto per lealtà e umiltà." },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Quanti movimenti ha la forma Choi-Yong?', options: ['46', '33', '68', '39'], answer: 0, explain: "Choi-Yong ha 46 movimenti (in origine 45, con l'aggiunta successiva del 46°)." },
{ cat: '🥋 Le Forme', belt: 12, lvl: 3, q: 'Quale sorte toccò al generale Choi Yong, ricordato nella forma?', options: ['Fu giustiziato dai suoi subordinati guidati da Yi Sung Gae', 'Morì in battaglia contro i Mongoli', 'Si ritirò in un monastero buddista', 'Divenne re della dinastia Koryo'], answer: 0, explain: "Choi Yong fu giustiziato dai suoi subordinati guidati dal generale Yi Sung Gae, che fondò poi la dinastia Yi (Joseon)." },
```

### 1.4 Fatti da ricontrollare a mano (low-confidence / corretti dal verificatore)

Nessun verdetto è risultato `low-confidence`: tutti e sei sono `confidence: high`. Restano però **due punti** in cui il verificatore ha applicato una **correzione/precisazione canonica** — il valore usato sopra è già quello verificato, ma vale la pena un'occhiata umana prima del merge:

1. **Yoo-Sin — dedica:** la dicitura proposta usava "comandante supremo"; il canone ITF recita **"commanding general" (generale al comando)**. Nelle domande/`explain` è stata adottata la forma verificata "generale al comando". Storicamente Kim Yoo-Sin comandò le forze armate di Silla, quindi non era un errore di merito, ma di dicitura. *(Da confermare manualmente: che la formulazione italiana scelta soddisfi il vostro istruttore.)*
2. **Choi-Yong — numero di movimenti:** valore canonico **moderno = 46**; storicamente la forma aveva **45** movimenti (terminava con un colpo di taglio della mano destra), poi è stato aggiunto il 46° passo (spostando il cambio di direzione al passo 32). Alcune tabelle rapide riportano ancora 45 (valore obsoleto). Si è usato **46**. *(Da verificare manualmente contro il programma d'esame della vostra federazione, nel caso adotti ancora la versione a 45.)*

Suggerimenti di arricchimento (facoltativi, non errori) emersi dai verdetti: nelle `explain` si possono aggiungere il Monte Baekdu per Juche e i dettagli "lealtà/patriottismo/umiltà" per Choi-Yong — già in parte inclusi sopra.

---

## 2. Statistiche per categoria — piano

**Obiettivo:** a fine partita (e/o nel profilo) mostrare per ciascuna categoria (`🥋 Le Forme`, `📜 Storia & Teoria`, `🔢 Numeri Coreani`, `📣 Comandi`, `👊 Tecniche`, `🟢 Le Cinture`, `🧭 I 5 Principi`, …) quante risposte sono state date e quante corrette, per capire i punti deboli. La categoria è il campo `cat` di ogni `Question`, già usato come chiave per il round-robin: è la chiave di aggregazione naturale.

### 2.1 Data model

Due livelli, **per-partita** (immediato, già disponibile) e **all-time** (persistente, opzionale):

```ts
// Per-categoria, una partita
export interface CatStat {
  cat: string;     // etichetta categoria (chiave)
  total: number;   // domande viste in quella categoria
  correct: number; // risposte corrette
}

// Per-partita: derivabile SENZA persistenza dallo stato già esistente
// (gameStore.questions + correctKeys/wrong). Nessun nuovo storage richiesto.

// All-time (persistente): estende ProgressData in progress.svelte.ts
interface ProgressData {
  // ...campi esistenti...
  catStats: Record<string, { total: number; correct: number }>; // NEW
}
```

Il payload `GameResult` (in `progress.svelte.ts`) si arricchisce di un campo già calcolabile dal game store:

```ts
export interface GameResult {
  // ...campi esistenti...
  perCat: CatStat[]; // NEW — breakdown della partita
}
```

**Fonti dati già presenti (nessuna nuova traccia da loggare):**
- `gameStore.questions` — l'elenco completo delle domande della partita, ciascuna con `.cat`.
- `gameStore.wrong: Question[]` — le domande sbagliate, **con `.cat`** già accessibile.
- `private correctKeys: string[]` + `qKey(q)` — le chiavi corrette.

Quindi il breakdown per-categoria si ricava al 100% da stato esistente: si itera `questions`, si conta per `cat`, e si marca corretta se `qKey(q)` ∈ `correctKeys`.

### 2.2 UI plan

- **EndScreen** (`src/lib/components/screens/EndScreen.svelte`): nuova sezione "Per categoria" sotto al `ScoreRing`/verdetto e sopra/accanto al `BadgeShelf`. Una riga per categoria: emoji+etichetta (già nel `cat`), barra di riempimento `correct/total`, e il rapporto `N/M`. Le barre riusano i token CSS esistenti (gradiente verde→blu in light, token `--*` in `src/app.css`); la categoria con la percentuale più bassa può essere evidenziata come "da ripassare".
- **Coerenza a11y/identità:** stessa palette e componenti glass attuali; la percentuale è sempre mostrata come testo (mai solo colore), allineata alle scelte di accessibilità già adottate nel progetto. Reduced-motion: nessuna animazione obbligatoria; eventuale riempimento barra sotto `prefers-reduced-motion`.
- **(Opzionale) StudyScreen** (`src/lib/components/screens/StudyScreen.svelte`): mostrare lo storico all-time per categoria, per orientare il ripasso. Si lega bene alla coda SRS già presente.
- **(Opzionale) StartScreen:** badge "punto debole: <categoria>" derivato dalle stats all-time.

### 2.3 File toccati

| File | Modifica |
|---|---|
| `src/lib/stores/game.svelte.ts` | Metodo `perCatBreakdown(): CatStat[]` (itera `questions`, conta per `cat` usando `correctKeys`); aggiungere `perCat` al `GameResult` costruito in `endGame()`. Esporre un getter per la UI (es. `get lastPerCat()`), così l'EndScreen non ricalcola. |
| `src/lib/stores/progress.svelte.ts` | Estendere `ProgressData` con `catStats`; in `load()` idratare/migrare (default `{}`); in `recordGame()` accumulare `r.perCat` in `data.catStats`; getter `get catStats()`. La migrazione segue il pattern difensivo già usato per `srs`/`badges`. |
| `src/lib/components/screens/EndScreen.svelte` | Render della sezione "Per categoria" (lista barre). |
| `src/lib/data/belts.ts` *(opz.)* | Eventuale `CatStat` interface se la si vuole condivisa (oppure tenerla in `progress.svelte.ts`). |
| `src/app.css` *(opz.)* | Eventuali utility per la barra categoria (riuso dei token esistenti, nessun nuovo colore). |

### 2.4 Pseudocodice

```ts
// --- game.svelte.ts ---------------------------------------------------------
perCatBreakdown(): CatStat[] {
  const correct = new Set(this.correctKeys);
  const acc = new Map<string, { total: number; correct: number }>();
  for (const q of this.questions) {
    const e = acc.get(q.cat) ?? { total: 0, correct: 0 };
    e.total += 1;
    if (correct.has(qKey(q))) e.correct += 1;
    acc.set(q.cat, e);
  }
  return [...acc.entries()]
    .map(([cat, v]) => ({ cat, ...v }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total); // peggiori in cima
}

// in endGame(), ramo quiz:
const result: GameResult = { /* ...campi esistenti... */, perCat: this.perCatBreakdown() };

// --- progress.svelte.ts -----------------------------------------------------
// load(): catStats: (saved.catStats && typeof saved.catStats === 'object'
//                    && !Array.isArray(saved.catStats)) ? saved.catStats : {}
// recordGame(r):
for (const c of r.perCat) {
  const e = this.data.catStats[c.cat] ?? { total: 0, correct: 0 };
  e.total += c.total; e.correct += c.correct;
  this.data.catStats[c.cat] = e;
}
```

```svelte
<!-- EndScreen.svelte : sezione "Per categoria" -->
{#each gameStore.lastPerCat as s (s.cat)}
  <div class="cat-row">
    <span class="cat-name">{s.cat}</span>
    <div class="cat-bar"><div class="cat-fill" style="width:{Math.round(100*s.correct/s.total)}%"></div></div>
    <span class="cat-num">{s.correct}/{s.total}</span>
  </div>
{/each}
```

**Nota:** in modalità *review* il breakdown è comunque calcolabile, ma non confluisce nelle stats all-time del quiz (coerente con `endGame()` che già distingue il ramo review).

---

## 3. Redesign dell'identità visiva

Sono state esplorate tre direzioni, tutte mobile-first, tutte che abbandonano i blob luminosi/gradienti verde→blu attuali e tutte con `risk: medium`. Sintesi e classifica del giudice qui sotto.

### 3.1 Le tre direzioni (sintesi)

1. **Hanji — Sumi & Cinnabar.** L'app diventa un foglio di carta di riso (hanji) su cui un maestro annota a inchiostro sumi con un sigillo rosso cinabro. Superficie opaca e calda, niente vetro/blur, griglia tipografica asimmetrica, trigrammi/taegeuk come filigrane. Stato risposta mai affidato al solo colore: corretto = sigillo cinabro pieno, sbagliato = barratura a inchiostro. Tipografia tutta serif (Fraunces + Newsreader + Nanum Myeongjo). Contrasto verificato (~13:1 light, ~12:1 dark), tap ≥56px.

2. **DOJANG ARCADE — Carta & Cintura.** Neobrutalismo "dojo + cabinato anni '80" su carta avorio: bordi neri 3px, ombre solide offset, "press fisico" al tap, badge-toppe ruotati, numeri monospace tabulari. La variabile `--belt` (mappata 1:1 su `belts.ts`) ricolora l'intera "uniforme" della UI. Font Darker Grotesque + Space Grotesk + Space Mono.

3. **Hwarang Midnight Lacquer.** Dark luxury da dojo notturno: lacca nera, bordi d'ottone, accenti giada/oro, "gold pour" che riempie dal basso la risposta corretta. Esecuzione raffinata, a11y forte (stati mai solo-colore, contrasto ~14:1). Default dark; light "pergamena" opzionale. Font Fraunces + Archivo.

### 3.2 Classifica del giudice

| # | Direzione | Boldness | Usability | Fit TKD | Totale |
|---|---|---|---|---|---|
| 1 | **Hanji — Sumi & Cinnabar** | 9 | 8 | 10 | **27** |
| 2 | DOJANG ARCADE — Carta & Cintura | 8 | 6 | 8 | 22 |
| 3 | Hwarang Midnight Lacquer | 6 | 8 | 7 | 21 |

### 3.3 Direzione raccomandata — **Hanji — Sumi & Cinnabar**

**Motivazione (dal giudice).** Hanji è l'unica direzione che massimizza tutti e tre gli assi senza barattare l'usabilità per l'audacia:

- **Fit:** è la più profondamente Taekwon-Do — carta di riso, inchiostro sumi, sigillo cinabro, filigrane di trigrammi e cerchio taegeuk trasformano l'app in un "trattato d'arte marziale", l'opposto del registro fitness generico. Abbandona davvero i gradienti verde-blu e i blob invece di limitarsi a ricolorarli. (Lacquer evoca un lusso est-asiatico più generico; Arcade vira sul pop/flipper.)
- **Usabilità:** robusta e onesta su mobile — contrasto verificato (~13:1 light, ~12:1 dark), tap ≥56px, e **stato mai affidato al solo colore** (sigillo pieno per il corretto, barratura per lo sbagliato), in aggiunta al ✅/❌ già nel DOM di `AnswerButton`. WCAG 1.4.1 rispettato **senza toccare l'API** `letter/text/state/locked` dei componenti. Tutte le micro-animazioni ricadono sotto il blocco `prefers-reduced-motion` già in `src/app.css`.
- **Boldness:** la più coraggiosa e memorabile delle tre.

Penalità altrui: **Arcade** ha un difetto reale e auto-ammesso — i suoi colori-stato (verde ok / rosso no) **coincidono con due colori-cintura**, creando attrito percettivo che Hanji evita per costruzione. **Lacquer**, pur impeccabile, è la meno bold (dark-luxury è un cliché premium) e parte solo-dark con light "opzionale", un passo indietro rispetto al supporto light/dark già paritario del progetto.

**Caveat da tenere a mente (non bloccanti):**
- Sia Hanji sia Lacquer propongono un **timer ad anello**, mentre l'attuale `Timer.svelte` è una **barra track+fill**: è un cambio di DOM, non un puro reskin di token. `ScoreRing.svelte` dimostra però che gli anelli SVG sono già in casa.
- Hanji carica **tre famiglie serif Google** (Fraunces + Newsreader + Nanum Myeongjo): sorvegliare il peso su mobile, mitigabile con `font-display: swap` e fallback Georgia/serif.

---

## 4. Piano d'azione per l'implementazione

**A. Forme dan (contenuti)**
1. In `src/lib/data/belts.ts`, estendere `BELTS` con `{ id: 11, name: 'Nera 2° dan', main: '#1f2937', stripe: '#fbbf24' }` e `{ id: 12, name: 'Nera 3° dan', main: '#1f2937', stripe: '#ef4444' }` (colori a scelta del designer; **necessario** perché lo Start renda selezionabili belt 11/12). Aggiornare il commento "1..8"/"1..10" nei tipi.
2. In `src/lib/data/questions.ts`, appendere le 22 domande di §1.3 nel blocco `🥋 Le Forme`, dopo Kwang-Gae. Aggiornare l'header-commento delle forme (oggi si ferma a Kwang-Gae) con: 11 = 2° dan (Eui-Am/Choong-Jang/Juche), 12 = 3° dan (Sam-Il/Yoo-Sin/Choi-Yong).
3. Verifica manuale dei due punti di §1.4 (Yoo-Sin dicitura, Choi-Yong 45 vs 46) contro il programma della federazione.
4. Sanity check: `npm run build` / type-check (le opzioni devono essere esattamente 4 e `answer` ∈ 0..3 — già rispettato).

**B. Statistiche per categoria**
1. `game.svelte.ts`: aggiungere `perCatBreakdown()` + getter `lastPerCat`; includere `perCat` nel `GameResult`.
2. `progress.svelte.ts`: estendere `ProgressData.catStats`, idratazione difensiva in `load()`, accumulo in `recordGame()`, getter `catStats`.
3. `EndScreen.svelte`: sezione "Per categoria" (riuso token CSS, percentuale come testo).
4. (Opz.) StudyScreen/StartScreen: punto debole all-time.
5. Test: una partita → verificare somma `total` = numero domande e `correct` = punteggio.

**C. Redesign (Hanji)**
1. Trattare come **re-tokenizzazione** di `src/app.css` (palette carta/sumi/cinabro/celadon, raggi quasi-quadrati, font serif), mantenendo invariate le **API dei componenti** (`AnswerButton` continua a ricevere `letter/text/state/locked`).
2. Punto di attenzione isolato: il **Timer** (barra → anello) è l'unico cambio di DOM; valutarlo come task a sé riusando il pattern SVG di `ScoreRing.svelte`.
3. Caricamento font con `font-display: swap` + fallback; verificare il peso mobile delle tre serif.
4. Verifica a11y: contrasto, `prefers-reduced-motion`, stato mai solo-colore (già garantito dal ✅/❌ nel DOM).

**Ordine consigliato:** A (contenuti, indipendente e a basso rischio) → B (feature isolata su store+EndScreen) → C (redesign trasversale, da fare come ultimo step così non interferisce con A/B).
