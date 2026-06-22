export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

/** Achievements the player can unlock. Order = display order. */
export const BADGES: BadgeDef[] = [
  { id: 'first_game', name: 'Primo passo', emoji: '🥋', desc: 'Hai giocato la tua prima partita.' },
  { id: 'streak10', name: 'Serie da 10', emoji: '🔥', desc: '10 risposte corrette di fila.' },
  { id: 'speed', name: 'Fulmine', emoji: '⚡', desc: 'Risposta corretta con più di 7 secondi di tempo.' },
  { id: 'perfect', name: 'Esame perfetto', emoji: '🏆', desc: 'Punteggio pieno in una partita.' },
  { id: 'scholar', name: 'Studioso', emoji: '📚', desc: 'Hai completato una sessione di ripasso.' },
  { id: 'xp500', name: "Veterano", emoji: '⭐', desc: 'Hai raggiunto 500 XP.' },
  { id: 'blackbelt', name: 'Maestro', emoji: '🥷', desc: 'Esame superato per la cintura Nera.' },
];

export const badgeById = (id: string): BadgeDef | undefined => BADGES.find((b) => b.id === id);
