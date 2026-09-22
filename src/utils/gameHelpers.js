// Helpers para partidas guardadas (historial).
// Una "partida" guardada tiene la forma:
// {
//   id: string,
//   date: number (epoch ms),
//   durationMin: number,
//   meta: number,
//   teamA: string,           // nombre del equipo A (Nosotros)
//   teamB: string,           // nombre del equipo B (Ellos)
//   rounds: [{ team: 'A'|'B', points: number, after: { A: number, B: number } }],
//   winner: 'A'|'B',
// }

export const gameFinal = (game) => {
  if (!game?.rounds?.length) return { A: 0, B: 0 };
  return game.rounds[game.rounds.length - 1].after;
};

export const gameWinner = (game) => {
  if (game.winner) return game.winner;
  const f = gameFinal(game);
  if (f.A >= game.meta) return 'A';
  if (f.B >= game.meta) return 'B';
  return f.A >= f.B ? 'A' : 'B';
};

export const formatTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export const formatDateLong = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  try {
    return d.toLocaleDateString('es-DO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return d.toDateString();
  }
};

// Devuelve secciones para SectionList: Hoy / Ayer / Esta semana / Anterior.
// Cada partida solo aparece en una sección; secciones vacías se omiten.
export const groupGames = (games, now = Date.now()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yStart = today.getTime() - 24 * 60 * 60 * 1000;
  const weekStart = today.getTime() - 6 * 24 * 60 * 60 * 1000;

  const buckets = { Hoy: [], Ayer: [], 'Esta semana': [], Anterior: [] };
  for (const g of games) {
    const t = typeof g.date === 'number' ? g.date : new Date(g.date).getTime();
    if (t >= today.getTime()) buckets.Hoy.push(g);
    else if (t >= yStart) buckets.Ayer.push(g);
    else if (t >= weekStart) buckets['Esta semana'].push(g);
    else buckets.Anterior.push(g);
  }

  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([title, data]) => ({ title, data }));
};

// Agrupa partidas por fecha formateada (para cuando hay filtro de fecha activo).
// En vez de Hoy/Ayer/Esta semana, agrupa por la fecha real del juego.
export const groupGamesByDate = (games) => {
  const buckets = {};
  for (const g of games) {
    const d = new Date(typeof g.date === 'number' ? g.date : new Date(g.date).getTime());
    const key = formatDateLong(d);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(g);
  }
  return Object.entries(buckets).map(([title, data]) => ({ title, data }));
};

// Convierte el historial in-game (entries más reciente primero, con voided)
// a la forma {rounds:[{team,points,after}]} ordenada cronológicamente.
// Las jugadas anuladas se excluyen (ya no cuentan en el marcador).
export const buildRoundsFromEntries = (entries) => {
  const chronological = [...entries].reverse().filter((e) => !e.voided);
  let A = 0;
  let B = 0;
  return chronological.map((e) => {
    if (e.team === 'A') A += e.points;
    else B += e.points;
    return { team: e.team, points: e.points, after: { A, B } };
  });
};
