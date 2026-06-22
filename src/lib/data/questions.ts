import type { Question } from './belts';

/* ============================================================
   Banco domande — Quiz Taekwon-Do ITF (italiano)
   belt = cintura minima a cui compare · lvl = difficoltà 1/2/3
   Contenuti tratti dal manuale ECLIPSE Taekwon-Do Academy ed
   estesi con nozioni canoniche ITF (Enciclopedia del Gen. Choi).
   Forme→cinture (standard ITF, una forma per grado):
   1 Bianca sup=Chon-Ji · 2 Gialla=Dan-Gun · 3 Gialla sup=Do-San ·
   4 Verde=Won-Hyo · 5 Verde-Blu=Yul-Gok · 6 Blu=Joong-Gun ·
   7 Blu sup=Toi-Gye · 8 Rossa=Hwa-Rang · 9 Rossa sup=Choong-Moo ·
   10 Nera=Kwang-Gae (1° dan).
   ============================================================ */

export const POOL: Question[] = [
  // ===== STORIA & TEORIA =====
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 1, q: 'Chi è il fondatore del Taekwon-Do?', options: ['Il Generale Choi Hong Hi', 'Bruce Lee', 'Ahn Chang Ho', 'Il monaco Won-Hyo'], answer: 0, explain: "Creato dal Generale coreano Choi Hong Hi, 'il padre del Taekwon-Do'." },
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 1, q: 'Da quale Paese arriva il Taekwon-Do?', options: ['Corea', 'Giappone', 'Cina', 'Thailandia'], answer: 0, explain: "È un'arte marziale coreana di difesa personale." },
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 2, q: "Cosa vuol dire, alla lettera, 'Tae Kwon Do'?", options: ['L\'arte di calciare in volo e colpire di pugno', 'La via della spada', 'Il ballo dei guerrieri', 'La forza della tigre'], answer: 0, explain: 'TAE = calciare in volo, KWON = colpire di pugno, DO = arte/via.' },
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 2, q: "Cosa significa la sillaba 'DO' in Taekwon-Do?", options: ['La via, l\'arte, la disciplina', 'Il piede', 'Il pugno', 'Il maestro'], answer: 0, explain: "DO = la via / l'arte: il percorso di crescita dell'allievo." },
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 1, q: 'Come si chiama la divisa del Taekwon-Do?', options: ['Dobok', 'Kimono', 'Gi', 'Hakama'], answer: 0, explain: "La divisa si chiama 'Dobok', cioè 'vestito dell'arte'." },
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 2, q: 'Come si chiama la palestra dove ci si allena?', options: ['Dojang', 'Dobok', 'Tatami', 'Sabum'], answer: 0, explain: 'Dojang = la sala/palestra di allenamento.' },
  { cat: '📜 Storia & Teoria', belt: 2, lvl: 2, q: "Come si chiama l'istruttore (dal 4° al 6° dan)?", options: ['Sabum', 'Dojang', 'Dobok', 'Junbi'], answer: 0, explain: 'Sabum (Nim) = istruttore. Il maestro (7°-8° dan) è Sahyun, il gran maestro (9°) è Saseong.' },
  { cat: '📜 Storia & Teoria', belt: 2, lvl: 2, q: 'Cosa è disegnato dietro la casacca del Dobok?', options: ["L'albero del Taekwon-Do", 'Una tigre', 'Il sole', 'Una spada'], answer: 0, explain: "Dietro la casacca è illustrato l'albero del Taekwon-Do." },
  { cat: '📜 Storia & Teoria', belt: 1, lvl: 1, q: 'Quante forme (tul) esistono nel Taekwon-Do?', options: ['24, come le ore del giorno', '10', '100', '12, come i mesi'], answer: 0, explain: 'Esistono 24 forme, come le 24 ore di un giorno.' },
  { cat: '📜 Storia & Teoria', belt: 2, lvl: 2, q: 'Quanti gradi (gup) di cintura colorata ci sono prima della nera?', options: ['10', '5', '8', '12'], answer: 0, explain: 'Si parte dal 10° gup e si sale fino al 1° gup, poi arriva il 1° dan (cintura nera).' },
  { cat: '📜 Storia & Teoria', belt: 3, lvl: 3, q: 'In che anno fu fondata la Federazione Internazionale (ITF)?', options: ['1966', '1955', '1985', '2002'], answer: 0, explain: 'La International Taekwon-Do Federation fu fondata il 22 marzo 1966.' },
  { cat: '📜 Storia & Teoria', belt: 3, lvl: 3, q: "In quale anno nacque ufficialmente il nome 'Taekwon-Do'?", options: ['1955', '1966', '1918', '1945'], answer: 0, explain: "L'11 aprile 1955 la commissione scelse il nome 'Taekwon-Do'." },
  { cat: '📜 Storia & Teoria', belt: 3, lvl: 3, q: 'In che anno nacque il Generale Choi Hong Hi?', options: ['1918', '1900', '1935', '1945'], answer: 0, explain: 'Il Gen. Choi Hong Hi nacque il 9 novembre 1918.' },
  { cat: '📜 Storia & Teoria', belt: 3, lvl: 3, q: "Come si chiama l'opera in cui il Gen. Choi raccolse tutto il Taekwon-Do?", options: ["L'Enciclopedia del Taekwon-Do", 'Il Libro dei Cinque Anelli', 'Il Tao del pugno', 'Il Bushido'], answer: 0, explain: "Il Gen. Choi scrisse l'Enciclopedia del Taekwon-Do in 15 volumi." },
  { cat: '📜 Storia & Teoria', belt: 7, lvl: 3, q: 'Quale movimento è caratteristico delle tecniche ITF?', options: ['Il movimento ondulatorio (sine wave)', 'Il salto continuo', 'La rotazione dei fianchi a 360°', 'Il passo strisciato'], answer: 0, explain: 'Il movimento ondulatorio (su-giù) genera potenza ed è tipico dello stile ITF.' },

  // ===== LE CINTURE =====
  { cat: '🟢 Le Cinture', belt: 1, lvl: 1, q: 'Cosa rappresenta la cintura VERDE?', options: ['La pianta che comincia a germogliare', 'La notte', 'Il tramonto', 'La terra fertile'], answer: 0, explain: "Il verde è la pianta che germoglia: l'arte comincia a svilupparsi." },
  { cat: '🟢 Le Cinture', belt: 1, lvl: 2, q: 'Cosa rappresenta la cintura BLU?', options: ['La pianta cresciuta, rivolta verso il cielo', 'Il pericolo', "L'ingenuità dell'allievo", 'La terra'], answer: 0, explain: 'Il blu è la pianta cresciuta e rivolta verso il cielo.' },
  { cat: '🟢 Le Cinture', belt: 1, lvl: 1, q: 'Cosa rappresenta la cintura BIANCA?', options: ["L'ingenuità dell'allievo", 'La notte', 'Il sole', 'La forza'], answer: 0, explain: "Il bianco rappresenta l'ingenuità dell'allievo che inizia." },
  { cat: '🟢 Le Cinture', belt: 1, lvl: 1, q: 'Cosa rappresenta la cintura GIALLA?', options: ['La terra fertile dove la pianta mette le radici', 'Il cielo', 'La notte', 'Il fuoco'], answer: 0, explain: "Il giallo è la terra fertile: l'allievo mette le sue radici." },
  { cat: '🟢 Le Cinture', belt: 2, lvl: 2, q: 'Cosa rappresenta la cintura NERA?', options: ['La notte e contiene tutti i colori', 'La primavera', 'Il mare', 'La neve'], answer: 0, explain: 'Il nero è la notte e racchiude tutti i colori delle altre cinture.' },
  { cat: '🟢 Le Cinture', belt: 2, lvl: 2, q: "Qual è l'ordine giusto dei colori delle cinture?", options: ['Bianca, Gialla, Verde, Blu, Rossa, Nera', 'Bianca, Verde, Gialla, Rossa, Blu, Nera', 'Gialla, Bianca, Blu, Verde, Nera, Rossa', 'Verde, Blu, Bianca, Gialla, Nera, Rossa'], answer: 0, explain: 'Bianca → Gialla → Verde → Blu → Rossa → Nera.' },
  { cat: '🟢 Le Cinture', belt: 2, lvl: 2, q: 'Cosa rappresenta la cintura ROSSA?', options: ['Il tramonto e il pericolo: serve autocontrollo', 'La nascita', 'La calma', 'Il vento'], answer: 0, explain: 'La rossa è il tramonto e segnala pericolo: le tecniche sono potenti, serve autocontrollo.' },

  // ===== I 5 PRINCIPI =====
  { cat: '🧭 I 5 Principi', belt: 1, lvl: 1, q: 'Quanti sono i Principi del Taekwon-Do?', options: ['5', '3', '7', '10'], answer: 0, explain: "I principi sono 5 e guidano l'allievo nell'arte e nella vita." },
  { cat: '🧭 I 5 Principi', belt: 1, lvl: 2, q: "Cosa significa 'Ye Ui'?", options: ['Cortesia', 'Perseveranza', 'Autocontrollo', 'Integrità'], answer: 0, explain: 'Ye Ui = Cortesia: essere educati, gentili e rispettare il prossimo.' },
  { cat: '🧭 I 5 Principi', belt: 2, lvl: 2, q: "Come si dice 'Perseveranza' in coreano?", options: ['In Nae', 'Ye Ui', 'Guk Gi', 'Yeom Chi'], answer: 0, explain: 'In Nae = Perseveranza: impegnarsi senza rinunciare.' },
  { cat: '🧭 I 5 Principi', belt: 2, lvl: 2, q: "Cosa significa 'Guk Gi'?", options: ['Autocontrollo', 'Cortesia', 'Spirito Indomito', 'Integrità'], answer: 0, explain: 'Guk Gi = Autocontrollo: controllare comportamento, sensazioni e pensieri.' },
  { cat: '🧭 I 5 Principi', belt: 2, lvl: 2, q: "Cosa significa 'Yeom Chi'?", options: ['Integrità', 'Cortesia', 'Perseveranza', 'Autocontrollo'], answer: 0, explain: 'Yeom Chi = Integrità: capire ciò che è giusto e seguirlo.' },
  { cat: '🧭 I 5 Principi', belt: 3, lvl: 3, q: "Cosa significa 'Baekjul Boolgool'?", options: ['Spirito Indomito', 'Cortesia', 'Autocontrollo', 'Perseveranza'], answer: 0, explain: 'Baekjul Boolgool = Spirito Indomito: fare ciò che è giusto anche quando è difficile.' },
  { cat: '🧭 I 5 Principi', belt: 3, lvl: 3, q: "Qual è l'ordine corretto dei 5 principi?", options: ['Cortesia, Integrità, Perseveranza, Autocontrollo, Spirito Indomito', 'Perseveranza, Cortesia, Integrità, Spirito Indomito, Autocontrollo', 'Autocontrollo, Cortesia, Spirito Indomito, Integrità, Perseveranza', 'Integrità, Perseveranza, Cortesia, Autocontrollo, Spirito Indomito'], answer: 0, explain: 'Ye Ui · Yeom Chi · In Nae · Guk Gi · Baekjul Boolgool.' },

  // ===== NUMERI COREANI =====
  { cat: '🔢 Numeri Coreani', belt: 1, lvl: 1, q: "Come si dice 'UNO' in coreano?", options: ['Hana', 'Dool', 'Set', 'Yol'], answer: 0, explain: '1 = Hana.' },
  { cat: '🔢 Numeri Coreani', belt: 1, lvl: 1, q: "Come si dice 'DUE' in coreano?", options: ['Dool', 'Hana', 'Net', 'Set'], answer: 0, explain: '2 = Dool.' },
  { cat: '🔢 Numeri Coreani', belt: 1, lvl: 1, q: "Come si dice 'TRE' in coreano?", options: ['Set', 'Net', 'Dool', 'Dasot'], answer: 0, explain: '3 = Set.' },
  { cat: '🔢 Numeri Coreani', belt: 1, lvl: 2, q: "Quale numero è 'Net'?", options: ['Quattro', 'Due', 'Sei', 'Otto'], answer: 0, explain: 'Net = 4.' },
  { cat: '🔢 Numeri Coreani', belt: 1, lvl: 2, q: "Quale numero è 'Dasot'?", options: ['Cinque', 'Quattro', 'Sei', 'Otto'], answer: 0, explain: 'Dasot = 5.' },
  { cat: '🔢 Numeri Coreani', belt: 2, lvl: 2, q: "Quale numero è 'Yosot'?", options: ['Sei', 'Cinque', 'Sette', 'Nove'], answer: 0, explain: 'Yosot = 6.' },
  { cat: '🔢 Numeri Coreani', belt: 2, lvl: 3, q: "Come si dice 'SETTE' in coreano?", options: ['Ilgop', 'Yodul', 'Yosot', 'Ahop'], answer: 0, explain: '7 = Ilgop.' },
  { cat: '🔢 Numeri Coreani', belt: 2, lvl: 3, q: "Quale numero è 'Yodul'?", options: ['Otto', 'Sei', 'Nove', 'Quattro'], answer: 0, explain: 'Yodul = 8.' },
  { cat: '🔢 Numeri Coreani', belt: 2, lvl: 3, q: "Quale numero è 'Ahop'?", options: ['Nove', 'Sette', 'Sei', 'Dieci'], answer: 0, explain: 'Ahop = 9.' },
  { cat: '🔢 Numeri Coreani', belt: 1, lvl: 2, q: "Quale numero è 'Yol'?", options: ['Dieci', 'Sette', 'Nove', 'Sei'], answer: 0, explain: 'Yol = 10.' },

  // ===== COMANDI =====
  { cat: '📣 Comandi', belt: 1, lvl: 1, q: "Cosa vuol dire 'Charyot'?", options: ['Attenzione', 'Inchino', 'Pronto', 'Riposo'], answer: 0, explain: 'Charyot = Attenzione (sull\'attenti).' },
  { cat: '📣 Comandi', belt: 1, lvl: 1, q: "Cosa vuol dire 'Kyong-Ye'?", options: ['Inchino', 'Attenzione', 'Calcio', 'Pugno'], answer: 0, explain: 'Kyong-Ye = Inchino (il saluto).' },
  { cat: '📣 Comandi', belt: 1, lvl: 2, q: "Cosa vuol dire 'Junbi'?", options: ['Pronto', 'Riposo', 'Stop', 'Inchino'], answer: 0, explain: 'Junbi = Pronto.' },
  { cat: '📣 Comandi', belt: 2, lvl: 2, q: "Cosa vuol dire 'Si-Jak'?", options: ['Comincia / via', 'Stop', 'Inchino', 'Riposo'], answer: 0, explain: 'Si-Jak = comincia (inizio dell\'esercizio).' },
  { cat: '📣 Comandi', belt: 2, lvl: 2, q: "Cosa vuol dire 'Goman'?", options: ['Stop / fine', 'Comincia', 'Pronto', 'Veloce'], answer: 0, explain: 'Goman = stop / fine dell\'esercizio.' },
  { cat: '📣 Comandi', belt: 2, lvl: 2, q: "Cosa vuol dire 'Swiyo'?", options: ['Relax / riposo', 'Attenzione', 'Veloce', 'Pugno'], answer: 0, explain: 'Swiyo = Relax.' },
  { cat: '📣 Comandi', belt: 2, lvl: 3, q: "Cosa vuol dire 'Bahro'?", options: ['Ritorno (alla posizione di partenza)', 'Saltare', 'Attaccare', 'Inchino'], answer: 0, explain: 'Bahro = ritorno alla posizione precedente / di pronto.' },
  { cat: '📣 Comandi', belt: 3, lvl: 3, q: "Cosa vuol dire 'Dwiyro Torra'?", options: ['Dietro front (girarsi)', 'Saltare', 'Attaccare', 'Sedersi'], answer: 0, explain: 'Dwiyro Torra = girarsi indietro (dietro front).' },

  // ===== TECNICHE =====
  { cat: '👊 Tecniche', belt: 1, lvl: 1, q: "Cosa significa 'Jirugi'?", options: ['Pugno', 'Calcio', 'Parata', 'Posizione'], answer: 0, explain: 'Jirugi = Pugno.' },
  { cat: '👊 Tecniche', belt: 1, lvl: 1, q: "Cosa significa 'Chagi'?", options: ['Calcio', 'Pugno', 'Parata', 'Salto'], answer: 0, explain: 'Chagi = Calcio.' },
  { cat: '👊 Tecniche', belt: 1, lvl: 1, q: "Cosa significa 'Makgi'?", options: ['Parata', 'Attacco', 'Calcio', 'Pugno'], answer: 0, explain: 'Makgi = Parata (difesa).' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "Cosa significa 'Sogi'?", options: ['Posizione', 'Pugno', 'Salto', 'Parata'], answer: 0, explain: 'Sogi = Posizione (delle gambe).' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "L'altezza 'Kaunde' indica un bersaglio...", options: ['Medio', 'Alto', 'Basso', 'Dietro'], answer: 0, explain: 'Kaunde = Medio. (Napunde = Alto, Najunde = Basso)' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "Cosa significa 'Napunde'?", options: ['Alto', 'Medio', 'Basso', 'Veloce'], answer: 0, explain: 'Napunde = Alto.' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "Cosa significa 'Najunde'?", options: ['Basso', 'Alto', 'Medio', 'Forte'], answer: 0, explain: 'Najunde = Basso.' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "Cosa significa 'Ap Chagi'?", options: ['Calcio frontale', 'Calcio laterale', 'Pugno', 'Parata alta'], answer: 0, explain: 'Ap = davanti/frontale → Ap Chagi è il calcio frontale.' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "Cosa significa 'Sonkal'?", options: ['Taglio della mano (mano a coltello)', 'Pugno chiuso', 'Gomito', 'Ginocchio'], answer: 0, explain: 'Sonkal = mano a coltello; Sonkal Taerigi è il colpo con il taglio della mano.' },
  { cat: '👊 Tecniche', belt: 2, lvl: 2, q: "Cosa significa 'Gunnun Sogi'?", options: ['Posizione camminando', 'Posizione a L', 'Posizione seduta', 'Posizione di pronto'], answer: 0, explain: 'Gunnun Sogi = posizione camminando (walking stance).' },
  { cat: '👊 Tecniche', belt: 3, lvl: 2, q: "Cosa significa 'Dollyo Chagi'?", options: ['Calcio circolare (girato)', 'Calcio frontale', 'Calcio laterale', 'Calcio indietro'], answer: 0, explain: 'Dollyo Chagi = calcio circolare/girato.' },
  { cat: '👊 Tecniche', belt: 3, lvl: 2, q: "Cosa significa 'Niunja Sogi'?", options: ['Posizione a L', 'Posizione camminando', 'Posizione seduta', 'Posizione di pronto'], answer: 0, explain: 'Niunja Sogi = posizione a L (L-stance), tipica delle parate.' },
  { cat: '👊 Tecniche', belt: 3, lvl: 3, q: "Cosa significa 'Annun Sogi'?", options: ['Posizione seduta (del cavaliere)', 'Posizione a L', 'Posizione camminando', 'Posizione di pronto'], answer: 0, explain: 'Annun Sogi = posizione seduta (sitting stance), usata per i pugni laterali.' },
  { cat: '👊 Tecniche', belt: 3, lvl: 3, q: "Cosa significa 'Palmok'?", options: ['Avambraccio', 'Caviglia', 'Polso', 'Gomito'], answer: 0, explain: 'Palmok = avambraccio (es. Bakat Palmok = avambraccio esterno).' },
  { cat: '👊 Tecniche', belt: 3, lvl: 3, q: "Cosa significa 'Taerigi'?", options: ['Attacco con taglio di mano', 'Calcio in salto', 'Parata bassa', 'Pugno frontale'], answer: 0, explain: 'Taerigi = attacco con il taglio della mano.' },
  { cat: '👊 Tecniche', belt: 3, lvl: 3, q: "Cosa significa 'Yopcha Jirugi'?", options: ['Calcio laterale', 'Pugno alto', 'Parata doppia', 'Calcio frontale'], answer: 0, explain: 'Yop = laterale; è il calcio laterale (di lato).' },
  { cat: '👊 Tecniche', belt: 3, lvl: 3, q: "Cosa significa 'Naeryo Chagi'?", options: ['Calcio dall\'alto verso il basso (a martello)', 'Calcio frontale', 'Calcio circolare', 'Calcio in salto'], answer: 0, explain: 'Naeryo Chagi = calcio discendente (ad ascia/martello).' },

  // ===== LE FORME (entrano in base alla cintura scelta) =====
  { cat: '🥋 Le Forme', belt: 1, lvl: 1, q: 'Qual è la PRIMA forma che si impara?', options: ['Chon-Ji', 'Dan-Gun', 'Won-Hyo', 'Do-San'], answer: 0, explain: "Chon-Ji è la prima forma: significa 'cielo e terra'." },
  { cat: '🥋 Le Forme', belt: 1, lvl: 1, q: "Cosa sono le 'Forme' (tul) nel Taekwon-Do?", options: ['Un combattimento immaginario contro uno o più avversari', 'Esercizi di stretching', 'Una danza tradizionale', 'Una gara di corsa'], answer: 0, explain: 'Sono un combattimento immaginario per migliorare le tecniche.' },
  { cat: '🥋 Le Forme', belt: 1, lvl: 2, q: "Cosa significa 'Chon-Ji'?", options: ['Cielo e terra', 'Studioso', 'Monaco', 'Guerriero'], answer: 0, explain: "Chon-Ji = 'cielo e terra', la creazione del mondo." },
  { cat: '🥋 Le Forme', belt: 1, lvl: 3, q: 'Quanti movimenti ha la forma Chon-Ji?', options: ['19', '21', '24', '28'], answer: 0, explain: 'Chon-Ji ha 19 movimenti.' },
  { cat: '🥋 Le Forme', belt: 2, lvl: 2, q: "A chi è dedicata la forma 'Dan-Gun'?", options: ['Al leggendario fondatore della Corea (2333 a.C.)', 'A un monaco buddista', 'A un ammiraglio', 'A un filosofo'], answer: 0, explain: 'Dan-Gun è il leggendario fondatore della Corea nel 2333 a.C.' },
  { cat: '🥋 Le Forme', belt: 2, lvl: 3, q: 'Quanti movimenti ha la forma Dan-Gun?', options: ['21', '19', '24', '28'], answer: 0, explain: 'Dan-Gun ha 21 movimenti.' },
  { cat: '🥋 Le Forme', belt: 3, lvl: 2, q: "Da chi prende il nome la forma 'Do-San'?", options: ['Dal patriota Ahn Chang Ho', 'Da un re', 'Da un monaco', 'Da un generale giapponese'], answer: 0, explain: 'Do-San è lo pseudonimo del patriota Ahn Chang Ho.' },
  { cat: '🥋 Le Forme', belt: 3, lvl: 3, q: 'Quanti movimenti ha la forma Do-San?', options: ['24', '21', '28', '19'], answer: 0, explain: 'Do-San ha 24 movimenti.' },
  { cat: '🥋 Le Forme', belt: 4, lvl: 2, q: "Chi era 'Won-Hyo', a cui è dedicata la forma?", options: ['Il monaco che introdusse il Buddismo in Corea', 'Un ammiraglio', 'Il fondatore della Corea', 'Un filosofo confuciano'], answer: 0, explain: 'Won-Hyo introdusse il Buddismo in Corea nel 686 d.C.' },
  { cat: '🥋 Le Forme', belt: 4, lvl: 3, q: 'Quanti movimenti ha la forma Won-Hyo?', options: ['28', '24', '21', '30'], answer: 0, explain: 'Won-Hyo ha 28 movimenti.' },
  { cat: '🥋 Le Forme', belt: 5, lvl: 2, q: 'Qual è la forma della cintura Verde-Blu?', options: ['Yul-Gok', 'Won-Hyo', 'Joong-Gun', 'Chon-Ji'], answer: 0, explain: 'Yul-Gok è la forma del 5° gup (verde con striscia blu).' },
  { cat: '🥋 Le Forme', belt: 5, lvl: 2, q: "A chi è dedicata la forma 'Yul-Gok'?", options: ["Al filosofo Yil, 'il Confucio della Corea'", 'A un ammiraglio', 'A un monaco buddista', 'Al fondatore della Corea'], answer: 0, explain: "Yul-Gok è lo pseudonimo del filosofo Yil, detto 'il Confucio della Corea'." },
  { cat: '🥋 Le Forme', belt: 5, lvl: 3, q: 'Quanti movimenti ha la forma Yul-Gok?', options: ['38', '28', '32', '24'], answer: 0, explain: 'Yul-Gok ha 38 movimenti (come il 38° parallelo).' },
  { cat: '🥋 Le Forme', belt: 6, lvl: 2, q: "A chi è dedicata la forma 'Joong-Gun'?", options: ['Al patriota Ahn Joong Gun', 'A un filosofo', 'A un monaco', 'A un re'], answer: 0, explain: 'Joong-Gun ricorda il patriota Ahn Joong Gun.' },
  { cat: '🥋 Le Forme', belt: 6, lvl: 3, q: 'Quanti movimenti ha la forma Joong-Gun?', options: ['32', '30', '38', '29'], answer: 0, explain: "Joong-Gun ha 32 movimenti (l'età di Ahn quando fu giustiziato, 1910)." },
  { cat: '🥋 Le Forme', belt: 7, lvl: 2, q: "La forma 'Toi-Gye' è dedicata a...", options: ['Lo studioso Yi Hwang, del Neoconfucianesimo', 'Un ammiraglio', 'Un monaco', 'Il fondatore della Corea'], answer: 0, explain: "Toi-Gye è lo pseudonimo dello studioso Yi Hwang del XVI secolo." },
  { cat: '🥋 Le Forme', belt: 7, lvl: 3, q: 'Quanti movimenti ha la forma Toi-Gye?', options: ['37', '32', '29', '38'], answer: 0, explain: 'Toi-Gye ha 37 movimenti (il 37° parallelo, suo luogo di nascita).' },
  { cat: '🥋 Le Forme', belt: 8, lvl: 2, q: "Da cosa prende il nome la forma 'Hwa-Rang'?", options: ['Dal gruppo giovanile Hwa Rang della dinastia Silla', 'Da un ammiraglio', 'Da un filosofo', 'Da un re'], answer: 0, explain: 'Hwa-Rang è il gruppo giovanile nato nella dinastia Silla nel VII secolo.' },
  { cat: '🥋 Le Forme', belt: 8, lvl: 3, q: 'Quanti movimenti ha la forma Hwa-Rang?', options: ['29', '30', '32', '37'], answer: 0, explain: 'Hwa-Rang ha 29 movimenti (la 29ª divisione di fanteria).' },
  { cat: '🥋 Le Forme', belt: 9, lvl: 2, q: "La forma 'Choong-Moo' è dedicata a...", options: ["L'ammiraglio Yi Soon Sin", 'Un filosofo', 'Un monaco buddista', 'Un re'], answer: 0, explain: 'Choong-Moo ricorda l\'ammiraglio Yi Soon Sin, inventore della prima nave corazzata (1592).' },
  { cat: '🥋 Le Forme', belt: 9, lvl: 3, q: 'Quanti movimenti ha la forma Choong-Moo?', options: ['30', '29', '32', '37'], answer: 0, explain: 'Choong-Moo ha 30 movimenti.' },
  { cat: '🥋 Le Forme', belt: 9, lvl: 3, q: 'Quante forme (tul) si imparano prima della cintura nera?', options: ['9', '6', '12', '5'], answer: 0, explain: 'Le 9 forme dei gup: Chon-Ji, Dan-Gun, Do-San, Won-Hyo, Yul-Gok, Joong-Gun, Toi-Gye, Hwa-Rang, Choong-Moo.' },

  // ===== CINTURA NERA (1° dan) =====
  { cat: '🥋 Le Forme', belt: 10, lvl: 2, q: 'Qual è la prima forma della cintura nera (1° dan)?', options: ['Kwang-Gae', 'Choong-Moo', 'Hwa-Rang', 'Chon-Ji'], answer: 0, explain: 'Dopo le 9 forme dei gup, il 1° dan inizia con Kwang-Gae.' },
  { cat: '🥋 Le Forme', belt: 10, lvl: 3, q: "A chi è dedicata la forma 'Kwang-Gae'?", options: ['Al re Kwang-Gae-Toh il Grande di Goguryeo', 'A un ammiraglio', 'A un monaco', 'A un filosofo'], answer: 0, explain: 'Kwang-Gae ricorda il re Gwanggaeto il Grande, che ampliò i territori della Corea.' },
  { cat: '🥋 Le Forme', belt: 10, lvl: 3, q: 'Quanti movimenti ha la forma Kwang-Gae?', options: ['39', '30', '44', '29'], answer: 0, explain: 'Kwang-Gae ha 39 movimenti (riferimento al 391 d.C., anno della sua ascesa al trono).' },
];
