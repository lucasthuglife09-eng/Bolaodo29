// scores.js — busca placares via proxy Netlify → Sofascore
// Estratégia: busca por data (1 request por dia), casa pelo nome dos times

const _cacheDay = new Map(); // date → { ts, events[] }
const LIVE_TTL  = 20_000;   // 20s quando há jogo ao vivo
const IDLE_TTL  = 3 * 60_000; // 3min fora de jogo

const ST = {
  notstarted:    { txt: null,              cls: 'st-pre'  },
  inprogress:    { txt: '🔴 Ao vivo',     cls: 'st-live' },
  halftime:      { txt: '⏸ Intervalo',    cls: 'st-live' },
  finished:      { txt: 'Encerrado',       cls: 'st-fim'  },
  awaitingextra: { txt: '⏸ Prorrogação',  cls: 'st-live' },
  extra:         { txt: '🔴 Prorrogação',  cls: 'st-live' },
  penaltiestime: { txt: '🔴 Pênaltis',    cls: 'st-live' },
  postponed:     { txt: 'Adiado',          cls: 'st-pre'  },
  canceled:      { txt: 'Cancelado',       cls: 'st-pre'  },
};

function norm(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

// Busca eventos de um dia via proxy Netlify (evita CORS do Sofascore)
async function _fetchDia(date) {
  const c = _cacheDay.get(date);
  const hasLive = c?.events?.some(e => {
    const s = (e.status?.type || '').toLowerCase();
    return ['inprogress','halftime','extra','penaltiestime','awaitingextra'].includes(s);
  });
  const ttl = hasLive ? LIVE_TTL : IDLE_TTL;
  if (c && Date.now() - c.ts < ttl) return c.events;

  try {
    const r = await fetch(`/.netlify/functions/scores?date=${date}`,
      { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`proxy ${r.status}`);
    const { events = [] } = await r.json();
    _cacheDay.set(date, { ts: Date.now(), events });
    return events;
  } catch (e) {
    console.warn('[scores]', date, e.message);
    return c?.events ?? [];
  }
}

function _minuto(ev, sc) {
  if (sc === 'halftime')      return 'HT';
  if (sc === 'awaitingextra') return "90'";
  if (sc === 'penaltiestime') return 'Pên.';
  if (!['inprogress','extra'].includes(sc)) return null;

  const t = ev.time;
  if (!t?.currentPeriodStartTimestamp) return null;

  const elapsed = Math.floor((Date.now() / 1000 - t.currentPeriodStartTimestamp) / 60);
  const period  = t.period || 1;

  if (sc === 'extra') {
    const base = period > 3 ? 105 : 90;
    return `${Math.min(base + elapsed, 120)}'`;
  }

  const base = period > 1 ? 45 : 0;
  const raw  = base + elapsed;
  const max  = period > 1 ? 90 : 45;
  return raw > max ? `${max}+${raw - max}'` : `${raw}'`;
}

function _parse(ev) {
  if (!ev) return null;
  const sc     = (ev.status?.type || 'notstarted').toLowerCase();
  const info   = ST[sc] || ST.notstarted;
  const isLive = ['inprogress','halftime','extra','penaltiestime','awaitingextra'].includes(sc);

  return {
    status:     sc,
    statusTxt:  info.txt,
    statusCls:  info.cls,
    minuto:     _minuto(ev, sc),
    golsCasa:   ev.homeScore?.current ?? null,
    golsFora:   ev.awayScore?.current ?? null,
    golsCasaHT: ev.homeScore?.period1 ?? null,
    golsForaHT: ev.awayScore?.period1 ?? null,
    isLive,
    isFim:      sc === 'finished',
  };
}

// Casa jogo local com evento do Sofascore pelo nome dos times (fuzzy)
function _casar(evs, jogo) {
  const jh = norm(jogo.casa);
  const ja = norm(jogo.fora);

  // Tenta match exato primeiro, depois parcial
  for (const strict of [true, false]) {
    const ev = evs.find(e => {
      const h = norm(e.homeTeam?.name || e.homeTeam?.shortName || '');
      const a = norm(e.awayTeam?.name || e.awayTeam?.shortName || '');
      if (strict) {
        return h === jh || a === ja || jh === h && ja === a;
      }
      const matchH = h.includes(jh.slice(0, 4)) || jh.includes(h.slice(0, 4));
      const matchA = a.includes(ja.slice(0, 4)) || ja.includes(a.slice(0, 4));
      return matchH && matchA;
    });
    if (ev) return ev;
  }
  return null;
}

async function buscarResultados() {
  const out  = new Map();
  const datas = [...new Set(JOGOS.map(j => j.utc.slice(0, 10)))];

  await Promise.all(datas.map(async date => {
    const evs = await _fetchDia(date);
    if (!evs.length) return;
    for (const j of JOGOS) {
      if (!j.utc.startsWith(date)) continue;
      const ev = _casar(evs, j);
      if (ev) out.set(j.id, _parse(ev));
    }
  }));

  return out;
}

function datasUnicas() {
  return [...new Set(JOGOS.map(j => j.utc.slice(0, 10)))];
}

function algumAoVivo(m) {
  for (const r of m.values()) if (r?.isLive) return true;
  return false;
}
