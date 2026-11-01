import catalogue from './catalogue.json' with { type: 'json' };

export const factions = catalogue.factions;
export const roninThemes = catalogue.ronin.themes;
export const scenarios = ['Depletion', 'Omaju', 'Sacred Idols', 'Shin Keii', 'Ryodo', 'Ryu-Seikyuu', 'Botokú', 'Ichi no Riten', 'Muzukashi', 'Ninki', 'Õsatsu', 'Seigyo'];
export const factionName = id => factions.find(f => f.id === id)?.name ?? id;
export const initials = id => factionName(id).replace(/^The /, '').split(/[\s-]+/).slice(0, 2).map(s => s[0]).join('');
export const colors = ['#8a719b','#ba8952','#72966d','#678f9c','#9e7771','#7a8999','#a76d5d','#8b9970','#717c92','#b19659','#a57c92','#568e7e','#a78e76','#729899','#9b8b62'];
export const factionColor = id => colors[Math.max(0, factions.findIndex(f => f.id === id)) % colors.length];
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const outcome = game => game.ownVp > game.opponentVp ? 'win' : game.ownVp < game.opponentVp ? 'loss' : 'draw';
export const pct = n => n == null ? '—' : `${(n * 100).toFixed(1)}%`;

export function validateGame(game) {
  for (const side of ['own', 'opponent']) {
    const faction = factions.find(f => f.id === game[`${side}Faction`]);
    if (!faction) throw new Error('Choose both factions.');
    if (!['No theme', ...faction.themes, ...roninThemes].includes(game[`${side}Theme`])) throw new Error('Choose a valid theme for each faction.');
    if (!Number.isInteger(game[`${side}Vp`]) || game[`${side}Vp`] < 0 || game[`${side}Vp`] > 3) throw new Error('VPs must be whole numbers between 0 and 3.');
  }
  if (game.ownVp + game.opponentVp > 3) throw new Error('Only 3 VPs are available in total. The two scores must add up to 3 or less.');
  if (!scenarios.includes(game.scenario)) throw new Error('Choose a scenario from Tournament Pack 2510.1.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(game.date) || Number.isNaN(Date.parse(game.date)) || new Date(game.date).toISOString().slice(0,10) !== game.date || game.date > localDate() || game.date < '2000-01-01') throw new Error('Choose a valid date, from 2000 through today.');
  if (![50,75,100].includes(game.rice)) throw new Error('Choose 50, 75 or 100 Rice.');
  if (!['Casual','Tournament'].includes(game.format)) throw new Error('Choose a game type.');
  if (typeof game.notes !== 'string' || game.notes.length > 500) throw new Error('Notes must be 500 characters or less.');
  return Object.fromEntries(['ownFaction','ownTheme','opponentFaction','opponentTheme','ownVp','opponentVp','date','scenario','rice','format','notes'].map(key => [key,game[key]]));
}

export function filterGames(games, filters) {
  const today = new Date(`${localDate()}T12:00:00`);
  const start = new Date(today); start.setDate(start.getDate() - Number(filters.days || 0));
  const cutoff = localDate(start);
  return games.filter(g => (!filters.days || g.date >= cutoff) && (!filters.faction || g.ownFaction === filters.faction || g.opponentFaction === filters.faction) && (!filters.scenario || g.scenario === filters.scenario) && (!filters.rice || g.rice === Number(filters.rice)) && (!filters.format || g.format === filters.format));
}

// Each non-mirror match contributes one observation to each faction. Draws stay in the denominator.
export function standings(games, byTheme = false) {
  const rows = new Map();
  for (const game of games) {
    if (game.ownFaction === game.opponentFaction && !byTheme) continue;
    if (byTheme && game.ownFaction === game.opponentFaction && game.ownTheme === game.opponentTheme) continue;
    for (const own of [true, false]) {
      const faction = own ? game.ownFaction : game.opponentFaction;
      const theme = own ? game.ownTheme : game.opponentTheme;
      const key = byTheme ? `${faction}/${theme}` : faction;
      const row = rows.get(key) ?? { key, faction, theme, games: 0, wins: 0, losses: 0, draws: 0, vp: 0 };
      const scored = own ? game.ownVp : game.opponentVp, conceded = own ? game.opponentVp : game.ownVp;
      row.games++; row.vp += scored;
      row[scored > conceded ? 'wins' : scored < conceded ? 'losses' : 'draws']++;
      rows.set(key, row);
    }
  }
  const total = [...rows.values()].reduce((sum,r) => sum+r.games,0);
  return [...rows.values()].map(row => ({...row, winrate: row.wins/row.games, playrate: row.games/(total || 1), avgVp: row.vp/row.games}));
}

export function matchup(games, faction, opponent) {
  if (faction === opponent) return null;
  let n = 0, wins = 0, draws = 0;
  for (const g of games) {
    const forward = g.ownFaction === faction && g.opponentFaction === opponent;
    const reverse = g.opponentFaction === faction && g.ownFaction === opponent;
    if (!forward && !reverse) continue;
    n++;
    const delta = (g.ownVp-g.opponentVp)*(forward ? 1 : -1);
    if (delta > 0) wins++; else if (delta === 0) draws++;
  }
  return n ? {games:n, wins, draws, winrate:wins/n} : null;
}

export function personalStats(games) {
  const wins = games.filter(g => outcome(g) === 'win').length;
  const draws = games.filter(g => outcome(g) === 'draw').length;
  return {games:games.length,wins,draws,losses:games.length-wins-draws,winrate:games.length ? wins/games.length : null,avgVp:games.length ? games.reduce((s,g)=>s+g.ownVp,0)/games.length : null};
}

export function csv(games) {
  const keys = ['date','ownFaction','ownTheme','opponentFaction','opponentTheme','scenario','ownVp','opponentVp','rice','format'];
  const cell = value => `"${String(value).replaceAll('"','""')}"`;
  return [keys.join(','),...games.map(g=>keys.map(k=>cell(k.endsWith('Faction')?factionName(g[k]):g[k])).join(','))].join('\r\n');
}

export function demoGames() {
  let seed = 24816;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  const weights = [10,4,15,9,3,11,16,13,7,8,9,12,3,7,2];
  const pick = () => { let r = random()*weights.reduce((a,b)=>a+b,0); return factions[weights.findIndex(w => (r-=w)<0)] ?? factions[0]; };
  return Array.from({length:384},(_,i)=>{
    const own = pick(), opponent = pick();
    const value = random();
    const ownWins = value > .10 && random() < .50 + (factions.indexOf(own)%5-2)*.035;
    const scores = value < .10 ? [1,1] : ownWins ? [[3,0],[2,1],[2,0],[1,0]][Math.floor(random()*4)] : [[0,3],[1,2],[0,2],[0,1]][Math.floor(random()*4)];
    const date = new Date(); date.setDate(date.getDate()-Math.floor(random()*88));
    return {id:`demo-${i}`,date:localDate(date),ownFaction:own.id,opponentFaction:opponent.id,ownTheme:own.themes[Math.floor(random()*own.themes.length)],opponentTheme:opponent.themes[Math.floor(random()*opponent.themes.length)],ownVp:scores[0],opponentVp:scores[1],scenario:scenarios[Math.floor(random()*scenarios.length)],rice:random()<.85?100:75,format:random()<.6?'Tournament':'Casual',notes:''};
  }).sort((a,b)=>b.date.localeCompare(a.date));
}
