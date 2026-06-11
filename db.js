// db.js — dados centralizados no Supabase, com cache robusto

let _parts = [];
let _pals  = [];
let _cacheTs = 0;
const CACHE_TTL = 20_000; // 20s — não fica repetindo requests

// ─── Leitura ─────────────────────────────────────────────────────────
async function dbCarregar(force = false) {
  if (!force && _cacheTs > 0 && Date.now() - _cacheTs < CACHE_TTL) return;
  // Busca os dois em paralelo
  const [parts, pals] = await Promise.all([
    DB.get('participantes', 'order=criado_em.asc'),
    DB.get('palpites',      'order=apelido.asc,jogo_id.asc'),
  ]);
  _parts   = parts  || [];
  _pals    = pals   || [];
  _cacheTs = Date.now();
}

function dbParticipantes() { return _parts; }
function dbPalpites()      { return _pals;  }

// ─── Índice de palpites ───────────────────────────────────────────────
// { apelido -> { jogoId -> { casa, fora } } }
function indexarPalpites(rows) {
  const idx = {};
  for (const r of (rows || [])) {
    if (!idx[r.apelido]) idx[r.apelido] = {};
    idx[r.apelido][r.jogo_id] = { casa: r.gols_casa, fora: r.gols_fora };
  }
  return idx;
}

// ─── Escrita ─────────────────────────────────────────────────────────
async function salvarParticipante(apelido, foto) {
  await DB.upsert('participantes', { apelido, foto });
  _cacheTs = 0; // invalida cache
}

async function salvarPalpites(apelido, palpites) {
  const rows = Object.entries(palpites).map(([jogo_id, p]) => ({
    apelido,
    jogo_id:   +jogo_id,
    gols_casa: +p.casa,
    gols_fora: +p.fora,
  }));
  if (!rows.length) return;
  await DB.upsert('palpites', rows);
  _cacheTs = 0;
}

// ─── Pontuação ────────────────────────────────────────────────────────
function calcPontos(pal, res) {
  if (!pal || res?.golsCasa == null || res?.golsFora == null) return null;
  const pc = +pal.casa, pf = +pal.fora;
  const rc = +res.golsCasa, rf = +res.golsFora;
  if (pc === rc && pf === rf)                 return 25;
  if (Math.sign(pc-pf) !== Math.sign(rc-rf)) return 0;
  if (pc === rc || pf === rf)                 return 10;
  return 7;
}

// ─── Ranking síncrono (usa cache local) ───────────────────────────────
function calcRanking(resultMap) {
  const idx = indexarPalpites(_pals);
  return _parts.map(p => {
    const meus = idx[p.apelido] || {};
    let pts = 0, exatos = 0;
    for (const j of JOGOS) {
      const pal = meus[j.id];
      const res = resultMap.get(j.id);
      if (!pal || !res) continue;
      const pt = calcPontos(pal, res);
      if (pt == null) continue;
      pts += pt;
      if (pt === 25) exatos++;
    }
    return { apelido: p.apelido, foto: p.foto, pts, exatos, ts: p.criado_em };
  }).sort((a,b) => b.pts - a.pts || b.exatos - a.exatos
    || new Date(a.ts) - new Date(b.ts));
}

// ─── Comprovantes ─────────────────────────────────────────────────────
async function listarComprovantes() {
  return DB.get('comprovantes', 'order=criado_em.desc');
}

// URL pública assinada para ver um comprovante (válida por 1h)
async function urlComprovante(path) {
  const r = await fetch(
    `${SUPA.url}/storage/v1/object/sign/bolao29/${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPA.anonKey,
        'Authorization': `Bearer ${SUPA.anonKey}`,
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );
  if (!r.ok) throw new Error('Erro ao gerar URL');
  const { signedURL } = await r.json();
  return SUPA.url + signedURL;
}
