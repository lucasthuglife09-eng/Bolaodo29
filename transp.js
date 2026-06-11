// transp.js — página de transparência
let resultMap = new Map();
let viewMode  = 'pessoa';
let timer     = null;
let carregando = false;

document.addEventListener('DOMContentLoaded', async () => {
  await tick();
  loop();
});

function loop() {
  clearTimeout(timer);
  const delay = algumAoVivo(resultMap) ? CFG.tickLive : CFG.tickIdle;
  timer = setTimeout(async () => { await tick(); loop(); }, delay);
}

async function tick() {
  if (carregando) return;
  carregando = true;
  const ts = document.getElementById('upd-ts');
  if (ts) ts.textContent = 'atualizando…';
  try {
    await dbCarregar();

    const scorePromise = buscarResultados();
    const scoreTimeout = new Promise(res => setTimeout(() => res(resultMap), 8000));
    resultMap = await Promise.race([scorePromise, scoreTimeout]);

    const parts = dbParticipantes();
    const pals  = dbPalpites();
    atualizarPremio(parts.length);
    renderConteudo(parts, pals);

    const lv = algumAoVivo(resultMap);
    const pill = document.getElementById('live-pill');
    if (pill) pill.style.display = lv ? 'flex' : 'none';
    const agora = new Date();
    if (ts) ts.textContent =
      `${agora.getHours().toString().padStart(2,'0')}:${agora.getMinutes().toString().padStart(2,'0')}`;
  } catch(e) {
    console.error('[transp tick]', e.message);
    if (ts) ts.textContent = 'erro';
  } finally {
    carregando = false;
  }
}

function atualizarPremio(n) {
  const val = document.getElementById('premio-valor');
  const sub = document.getElementById('premio-sub');
  if (val) val.textContent = n > 0 ? `R$ ${n * CFG.entrada}` : 'R$ –';
  if (sub) sub.textContent = n > 0
    ? `${n} participante${n > 1 ? 's' : ''} · 100% ao vencedor`
    : 'Nenhum participante ainda';
  const nEl = document.getElementById('n-part');
  if (nEl) nEl.textContent = n > 0 ? `· ${n} pessoa${n > 1 ? 's' : ''}` : '';
}

function setView(v) {
  viewMode = v;
  document.getElementById('ft-pessoa').className = 'ftab' + (v === 'pessoa' ? ' ftab-ativo' : '');
  document.getElementById('ft-jogo').className   = 'ftab' + (v === 'jogo'   ? ' ftab-ativo' : '');
  renderConteudo(dbParticipantes(), dbPalpites());
}

function renderConteudo(parts, pals) {
  const wrap = document.getElementById('transp-wrap');
  if (!wrap) return;
  if (!parts.length) {
    wrap.innerHTML = '<div class="empty">Nenhum participante ainda.</div>';
    return;
  }
  wrap.innerHTML = viewMode === 'pessoa'
    ? renderPorPessoa(parts, pals)
    : renderPorJogo(parts, pals);
}

// ── POR PESSOA ────────────────────────────────────────────────────────
function renderPorPessoa(parts, pals) {
  const idx  = indexarPalpites(pals);
  const rank = calcRanking(resultMap);
  const med  = ['🥇','🥈','🥉'];

  return rank.map((p, pos) => {
    const meus = idx[p.apelido] || {};
    const linhas = JOGOS.map(j => {
      const pal = meus[j.id];
      const res = resultMap.get(j.id);
      const pt  = (res?.isFim || res?.isLive) && pal ? calcPontos(pal, res) : null;
      const cls = pt === 25 ? 'tp-exato' : pt >= 7 ? 'tp-parc' : pt === 0 ? 'tp-zero' : '';
      const placarReal = (res?.isFim || res?.isLive) && res.golsCasa != null
        ? `<span class="res-real">${res.golsCasa}–${res.golsFora}</span>` : '<span></span>';
      return `<div class="tp-jogo-row ${cls}">
        <span class="tp-grupo">Gr.${j.g}</span>
        <span class="tp-times">${flag(j.casa)}<span class="tp-tn">${j.casa}</span></span>
        <span class="tp-vs">×</span>
        <span class="tp-times"><span class="tp-tn">${j.fora}</span>${flag(j.fora)}</span>
        <span class="tp-pal">${pal ? `${pal.casa}×${pal.fora}` : '<span style="color:var(--lt)">—</span>'}</span>
        ${placarReal}
        <span class="tp-pts">${pt != null ? `${pt}p` : ''}</span>
      </div>`;
    }).join('');

    return `<div class="tp-pessoa-card">
      <div class="tp-pessoa-hd">
        <div class="tp-pos-av">
          <span class="tp-med">${med[pos] || `${pos+1}°`}</span>
          ${avatarHtml(p.apelido, p.foto, 40)}
          <div>
            <div class="tp-nome">${p.apelido}</div>
            <div class="tp-sub">${p.exatos} exato${p.exatos !== 1 ? 's' : ''} · ${p.pts} pts</div>
          </div>
        </div>
        <button class="tp-toggle" onclick="toggleCard(this)">▾ Ver palpites</button>
      </div>
      <div class="tp-jogos" style="display:none">
        <div class="tp-header-row">
          <span>Gr.</span><span>Casa</span><span></span><span>Fora</span>
          <span>Palpite</span><span>Placar</span><span>Pts</span>
        </div>
        ${linhas}
      </div>
    </div>`;
  }).join('');
}

function toggleCard(btn) {
  const jogos = btn.closest('.tp-pessoa-card').querySelector('.tp-jogos');
  const open  = jogos.style.display !== 'none';
  jogos.style.display = open ? 'none' : '';
  btn.textContent = open ? '▾ Ver palpites' : '▴ Fechar';
}

// ── POR JOGO ──────────────────────────────────────────────────────────
function renderPorJogo(parts, pals) {
  const idx = indexarPalpites(pals);
  let html = '';
  for (const [dia, jogos] of jogosPorDia()) {
    html += `<div class="dia-bloco"><div class="dia-lbl">${dia}</div><div class="jcol">`;
    for (const j of jogos) {
      const res     = resultMap.get(j.id);
      const temPlac = res != null && res.golsCasa != null && res.golsFora != null;
      const placar  = temPlac
        ? `<span class="jg-placar">${res.golsCasa}–${res.golsFora}${res.minuto ? ` <small>${res.minuto}</small>` : ''}</span>` : '';
      const stPill  = res?.statusTxt
        ? `<span class="st-pill ${res.statusCls}">${res.statusTxt}</span>`
        : `<span class="st-pill st-pre">${horaBSB(j.utc)}</span>`;

      const pills = parts.map(p => {
        const pal = idx[p.apelido]?.[j.id];
        if (!pal) return '';
        const pt  = temPlac ? calcPontos(pal, res) : null;
        const cls = pt === 25 ? 'pal-exato' : pt >= 7 ? 'pal-parc' : '';
        return `<div class="pal-pill ${cls}">
          ${avatarHtml(p.apelido, p.foto, 20)}
          <span class="pn">${p.apelido}</span>
          <span class="ps">${pal.casa}×${pal.fora}</span>
          ${pt != null ? `<span class="pp">${pt}p</span>` : ''}
        </div>`;
      }).filter(Boolean).join('') || `<span style="color:var(--lt);font-size:.75rem">Nenhum palpite</span>`;

      html += `<div class="jogo-card ${res?.isLive ? 'j-live' : ''} ${res?.isFim ? 'j-fim' : ''}">
        <div class="jogo-hd">
          <span class="gbadge">Grupo ${j.g}</span>
          <span class="jloc">${j.local}</span>
          ${stPill} ${placar}
        </div>
        <div class="jogo-bd">
          <div class="time tc"><span class="tf">${flag(j.casa)}</span><span class="tn">${j.casa}</span></div>
          <div class="hora-j">${horaBSB(j.utc)}</div>
          <div class="time tf2"><span class="tn">${j.fora}</span><span class="tf">${flag(j.fora)}</span></div>
        </div>
        <div class="pal-row">${pills}</div>
      </div>`;
    }
    html += `</div></div>`;
  }
  return html;
}
