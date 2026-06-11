// ═══════════════════════════════════════════════════════
//  BOLÃO DO 29 · COPA 2026  — edite as linhas marcadas com ←
// ═══════════════════════════════════════════════════════

const CFG = {
  nome:        'Bolão do 29',
  entrada:     10,                             // ← R$ por pessoa
  pix:         'bolao29@maino.com.br',        // ← sua chave PIX
  whatsapp:    '5521999999999',               // ← DDI+DDD+número
  email:       'organizador@maino.com.br',  // ← seu e-mail pra receber comprovantes
  minutesBloq: 10,
  tickLive:    30_000,   // 30s durante jogo ao vivo
  tickIdle:    5 * 60_000, // 5min fora de jogo
};

const SUPA = {
  url:     'https://qzpjdzfjsmgtyyxvjidw.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cGpkemZqc21ndHl5eHZqaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDAxODUsImV4cCI6MjA5Njc3NjE4NX0.cmwTg0YBbY5SmDpyOwujrRVfoVyYmFSE4Iedb_NzWrg',
};

// ─── Supabase REST helpers ───────────────────────────────────────────
const DB = {
  _h() {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPA.anonKey,
      'Authorization': `Bearer ${SUPA.anonKey}`,
    };
  },
  async get(table, query = '') {
    const r = await fetch(`${SUPA.url}/rest/v1/${table}?${query}`, { headers: DB._h() });
    if (!r.ok) throw new Error(`DB.get ${table}: ${r.status}`);
    return r.json();
  },
  async upsert(table, body) {
    const r = await fetch(`${SUPA.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...DB._h(), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`DB.upsert ${table}: ${r.status} ${await r.text()}`);
    return true;
  },
};

// ─── Tempo / bloqueio ────────────────────────────────────────────────
const PRIMEIRO_JOGO_UTC = new Date('2026-06-11T19:00:00Z');
function deadlineTs() { return PRIMEIRO_JOGO_UTC.getTime() - CFG.minutesBloq * 60_000; }
function bloqueado()  { return Date.now() >= deadlineTs(); }
function tempoRestante() {
  const diff = deadlineTs() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000), m = Math.floor((diff % 3_600_000) / 60_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// ─── Avatar ──────────────────────────────────────────────────────────
const CORES = [
  ['#005c2e','#fff'],['#1a3e6b','#fff'],['#7a1a1a','#fff'],
  ['#6b4d1a','#fff'],['#4d1a6b','#fff'],['#1a5e6b','#fff'],
  ['#2e7d32','#fff'],['#b71c1c','#fff'],['#1565c0','#fff'],
];
function avatarCor(s) {
  let h = 0;
  for (const c of (s||'?')) h = (h * 31 + c.charCodeAt(0)) % CORES.length;
  return CORES[Math.abs(h)];
}
function avatarHtml(apelido, foto, size = 36) {
  if (foto) return `<img src="${foto}" alt="${apelido}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0">`;
  const [bg, fg] = avatarCor(apelido);
  const fs = Math.round(size * 0.42);
  return `<div style="width:${size}px;height:${size}px;background:${bg};color:${fg};font-size:${fs}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0">${(apelido||'?')[0].toUpperCase()}</div>`;
}
