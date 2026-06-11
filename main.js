// main.js — página principal
let resultMap = new Map();
let timer = null;
let carregando = false;

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('pix-key').textContent = CFG.pix;
  // Preenche spans dinâmicos com CFG.entrada
  const inscVal = document.getElementById('inscr-val-num');
  if (inscVal) inscVal.textContent = CFG.entrada;
  atualizarDeadline();
  await tick();
  loop();
});

// ─── Loop de atualização ─────────────────────────────────────────────
function loop() {
  clearTimeout(timer);
  const delay = algumAoVivo(resultMap) ? CFG.tickLive : CFG.tickIdle;
  timer = setTimeout(async () => { await tick(); loop(); }, delay);
}

async function tick() {
  if (carregando) return; // evita sobreposição
  carregando = true;
  const ts = document.getElementById('upd-ts');
  if (ts) ts.textContent = 'atualizando…';

  try {
    // 1. Carrega banco (com cache — não refaz se recente)
    await dbCarregar();

    // 2. Busca resultados Sofascore (sem esperar infinito)
    const scorePromise = buscarResultados();
    const scoreTimeout = new Promise(res => setTimeout(() => res(resultMap), 8000));
    resultMap = await Promise.race([scorePromise, scoreTimeout]);

    // 3. Renderiza tudo com dados em mãos
    const parts = dbParticipantes();
    const pals  = dbPalpites();
    atualizarPremio(parts.length);
    atualizarHero(parts.length);
    renderJogos(parts, pals);
    renderRanking(parts);

    const lv = algumAoVivo(resultMap);
    const pill = document.getElementById('live-pill');
    if (pill) pill.style.display = lv ? 'flex' : 'none';
    const agora = new Date();
    if (ts) ts.textContent =
      `${agora.getHours().toString().padStart(2,'0')}:${agora.getMinutes().toString().padStart(2,'0')}`;
  } catch(e) {
    console.error('[tick]', e.message);
    if (ts) ts.textContent = 'erro — tentando novamente';
  } finally {
    carregando = false;
  }
}

// ─── Prêmio ──────────────────────────────────────────────────────────
function atualizarPremio(n) {
  const val = document.getElementById('premio-valor');
  const sub = document.getElementById('premio-sub');
  const total = n * CFG.entrada;
  if (val) val.textContent = n > 0 ? `R$ ${total}` : 'R$ –';
  if (sub) sub.textContent = n > 0
    ? `${n} participante${n > 1 ? 's' : ''} × R$ ${CFG.entrada} · 100% ao vencedor`
    : 'Nenhum participante ainda';
}

// ─── Hero bar ────────────────────────────────────────────────────────
function atualizarHero(n) {
  const elP = document.getElementById('h-part');
  if (elP) elP.textContent = n;
  atualizarDeadline();
}

function atualizarDeadline() {
  const el  = document.getElementById('h-dl');
  const btn = document.getElementById('btn-entrar');
  if (!el) return;
  const t = tempoRestante();
  if (t) { el.textContent = t; el.style.color = ''; if (btn) btn.style.display = ''; }
  else   { el.textContent = 'Encerrado'; el.style.color = 'var(--red)'; if (btn) btn.style.display = 'none'; }
}

// ─── Jogos ───────────────────────────────────────────────────────────
function renderJogos(parts, pals) {
  const wrap = document.getElementById('jogos-wrap');
  if (!wrap) return;
  const idx = indexarPalpites(pals);
  let html = '';
  for (const [dia, jogos] of jogosPorDia()) {
    html += `<div class="dia-bloco"><div class="dia-lbl">${dia}</div><div class="jcol">`;
    for (const j of jogos) html += jogoCard(j, parts, idx);
    html += `</div></div>`;
  }
  wrap.innerHTML = html;
}

function jogoCard(j, parts, idx) {
  const r       = resultMap.get(j.id);
  const temPlac = r != null && r.golsCasa != null && r.golsFora != null;

  // Centro: placar com minuto, ou horário
  let centro;
  if (temPlac) {
    const minTag = r.minuto
      ? `<span class="placar-min ${r.isFim ? 'min-fim' : ''}">${r.minuto}</span>` : '';
    const htTag = (r.isFim && r.golsCasaHT != null)
      ? `<div class="placar-ht">HT ${r.golsCasaHT}–${r.golsForaHT}</div>` : '';
    centro = `<div class="placar-wrap">${minTag}<div class="placar">
      <span>${r.golsCasa}</span><span class="sep">–</span><span>${r.golsFora}</span>
    </div>${htTag}</div>`;
  } else {
    centro = `<div class="hora-j">${horaBSB(j.utc)}</div>`;
  }

  // Status pill
  const stPill = r?.statusTxt
    ? `<span class="st-pill ${r.statusCls}">${r.statusTxt}</span>`
    : `<span class="st-pill st-pre">${horaBSB(j.utc)}</span>`;

  // Palpites das pessoas embaixo do card
  const palPills = parts.map(p => {
    const pal = idx[p.apelido]?.[j.id];
    if (!pal) return '';
    const pt  = (r?.isFim || r?.isLive) ? calcPontos(pal, r) : null;
    const cls = pt === 25 ? 'pal-exato' : pt >= 7 ? 'pal-parc' : '';
    return `<div class="pal-pill ${cls}">
      ${avatarHtml(p.apelido, p.foto, 16)}
      <span class="pn">${p.apelido}</span>
      <span class="ps">${pal.casa}×${pal.fora}</span>
      ${pt != null ? `<span class="pp">${pt}p</span>` : ''}
    </div>`;
  }).filter(Boolean).join('');

  return `<div class="jogo-card ${r?.isLive ? 'j-live' : ''} ${r?.isFim ? 'j-fim' : ''}">
    <div class="jogo-hd">
      <span class="gbadge">Grupo ${j.g}</span>
      <span class="jloc">${j.local}</span>
      ${stPill}
    </div>
    <div class="jogo-bd">
      <div class="time tc"><span class="tf">${flag(j.casa)}</span><span class="tn">${j.casa}</span></div>
      ${centro}
      <div class="time tf2"><span class="tn">${j.fora}</span><span class="tf">${flag(j.fora)}</span></div>
    </div>
    ${palPills ? `<div class="pal-row">${palPills}</div>` : ''}
  </div>`;
}

// ─── Ranking (síncrono — sem await) ──────────────────────────────────
function renderRanking(parts) {
  const wrap = document.getElementById('rank-wrap');
  const pBar = document.getElementById('rank-premio');
  const pVal = document.getElementById('rank-premio-val');
  if (!wrap) return;

  if (!parts.length) {
    wrap.innerHTML = `<div class="empty">Nenhum participante ainda. <a href="entrar.html">Seja o primeiro!</a></div>`;
    if (pBar) pBar.style.display = 'none';
    return;
  }

  const rank = calcRanking(resultMap); // síncrono agora
  const med  = ['🥇','🥈','🥉'];
  wrap.innerHTML = `<div class="rk-lista">${rank.map((p, i) => `
    <div class="rk-row ${i === 0 && p.pts > 0 ? 'rk-lider' : ''}">
      <span class="rk-pos">${med[i] || `${i+1}°`}</span>
      ${avatarHtml(p.apelido, p.foto, 30)}
      <span class="rk-nome">${p.apelido}</span>
      <span class="rk-ex">${p.exatos > 0 ? `${p.exatos}✓` : ''}</span>
      <span class="rk-pts">${p.pts}<small>pts</small></span>
    </div>`).join('')}</div>`;

  if (pBar) {
    pBar.style.display = '';
    if (pVal) pVal.textContent = `R$ ${parts.length * CFG.entrada}`;
  }
}
