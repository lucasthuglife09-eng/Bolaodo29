// entrar.js — fluxo em 3 passos: palpite → PIX → comprovante

let fotoDataURL  = null;
let comprovFile  = null;
let apelidoSalvo = null;

// ─── BOOT ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const pf = document.getElementById('pix-form');
  const ps = document.getElementById('pix-step2');
  const vp = document.getElementById('val-pix-step2');
  const ve = document.getElementById('val-entrada');
  if (pf) pf.textContent = CFG.pix;
  if (ps) ps.textContent = CFG.pix;
  if (vp) vp.textContent = CFG.entrada;
  if (ve) ve.textContent = CFG.entrada;

  if (bloqueado()) {
    document.getElementById('tela-bloq').style.display = '';
    document.getElementById('tela-form').style.display = 'none';
    return;
  }

  const prazo = tempoRestante();
  if (prazo) {
    const b = document.getElementById('banner-dl');
    if (b) {
      b.style.display = '';
      document.getElementById('dl-count').textContent = prazo;
      setInterval(() => {
        if (bloqueado()) { location.reload(); return; }
        const el = document.getElementById('dl-count');
        const t  = tempoRestante();
        if (el && t) el.textContent = t;
      }, 30_000);
    }
  }

  renderForm();
  setupFotoPerfil();
});

// ─── FOTO DE PERFIL ────────────────────────────────────────────────────
function setupFotoPerfil() {
  document.getElementById('foto-inp').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    redimensionar(f, 120, dataURL => {
      fotoDataURL = dataURL;
      document.getElementById('av-img').src = dataURL;
      document.getElementById('av-img').style.display = 'block';
      document.getElementById('av-init').style.display = 'none';
      document.getElementById('btn-rm').style.display = '';
    });
  });
}

function rmFoto() {
  fotoDataURL = null;
  document.getElementById('av-img').style.display = 'none';
  document.getElementById('av-img').src = '';
  document.getElementById('av-init').style.display = '';
  document.getElementById('btn-rm').style.display = 'none';
  document.getElementById('foto-inp').value = '';
  onApelido(document.getElementById('apelido').value);
}

function onApelido(v) {
  const el = document.getElementById('av-init');
  if (!el || fotoDataURL) return;
  el.textContent = (v || '?')[0].toUpperCase();
  const [bg, fg] = avatarCor(v || '?');
  const prev = document.getElementById('av-preview');
  if (prev) Object.assign(prev.style, { background: bg, color: fg });
}

// ─── FORM DE PALPITES ─────────────────────────────────────────────────
function renderForm() {
  const wrap = document.getElementById('palpites-wrap');
  if (!wrap) return;
  let html = '';
  for (const [dia, jogos] of jogosPorDia()) {
    html += `<div class="dia-bloco"><div class="dia-lbl">${dia}</div><div class="jcol">`;
    for (const j of jogos) {
      html += `<div class="jogo-card">
        <div class="jogo-hd">
          <span class="gbadge">Grupo ${j.g}</span>
          <span class="jloc">${j.local} · ${horaBSB(j.utc)}</span>
        </div>
        <div class="jogo-bd">
          <div class="time tc"><span class="tf">${flag(j.casa)}</span><span class="tn">${j.casa}</span></div>
          <div class="inp-wr">
            <input class="pi" type="number" min="0" max="30" id="c${j.id}" placeholder="–"/>
            <span class="px">×</span>
            <input class="pi" type="number" min="0" max="30" id="f${j.id}" placeholder="–"/>
          </div>
          <div class="time tf2"><span class="tn">${j.fora}</span><span class="tf">${flag(j.fora)}</span></div>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }
  wrap.innerHTML = html;
}

// ─── PASSO 1: SALVAR PALPITE ──────────────────────────────────────────
async function salvarPalpite() {
  const apelido = document.getElementById('apelido').value.trim();
  if (!apelido) { alert('Escolha um apelido!'); document.getElementById('apelido').focus(); return; }
  if (bloqueado()) { alert('Inscrições encerradas!'); return; }

  const palpites = {};
  let n = 0;
  for (const j of JOGOS) {
    const vc = document.getElementById(`c${j.id}`)?.value?.trim();
    const vf = document.getElementById(`f${j.id}`)?.value?.trim();
    if (vc !== '' && vf !== '' && vc != null && !isNaN(vc) && !isNaN(vf)) {
      palpites[j.id] = { casa: +vc, fora: +vf };
      n++;
    }
  }
  if (!n) { alert('Preencha pelo menos 1 palpite!'); return; }
  if (n < JOGOS.length && !confirm(`Você preencheu ${n}/${JOGOS.length} jogos. Continuar?`)) return;

  const btn = document.getElementById('btn-env');
  const st  = document.getElementById('env-status');
  btn.disabled = true;
  btn.textContent = 'Salvando…';
  st.style.display = '';
  st.className = 'env-status env-saving';
  st.textContent = '⏳ Salvando no banco…';

  try {
    await salvarParticipante(apelido, fotoDataURL);
    await salvarPalpites(apelido, palpites);
    apelidoSalvo = apelido;
    // Avança para o passo 2
    document.getElementById('step-palpite').style.display = 'none';
    document.getElementById('step-comprovante').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Salvar palpite e continuar →';
    st.className = 'env-status env-err';
    st.textContent = `❌ Erro: ${e.message}`;
    console.error(e);
  }
}

// ─── PASSO 2: COMPROVANTE ─────────────────────────────────────────────

// Drag & drop
function onDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('dz-over');
}
function onDragLeave(e) {
  document.getElementById('dropzone').classList.remove('dz-over');
}
function onDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('dz-over');
  const f = e.dataTransfer.files[0];
  if (f) onComprovFile(f);
}

function onComprovFile(f) {
  if (!f) return;
  const ok = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
  if (!ok.includes(f.type)) { alert('Use JPG, PNG ou PDF.'); return; }
  if (f.size > 8 * 1024 * 1024) { alert('Arquivo muito grande (máx 8 MB).'); return; }

  comprovFile = f;
  document.getElementById('drop-idle').style.display = 'none';
  document.getElementById('drop-preview').style.display = '';

  if (f.type.startsWith('image/')) {
    const url = URL.createObjectURL(f);
    document.getElementById('prev-img').src = url;
    document.getElementById('prev-img').style.display = 'block';
    document.getElementById('prev-pdf').style.display = 'none';
  } else {
    document.getElementById('prev-img').style.display = 'none';
    document.getElementById('prev-pdf').style.display = '';
    document.getElementById('prev-nome').textContent = f.name;
  }

  document.getElementById('btn-upload').disabled = false;
}

function limparComprov() {
  comprovFile = null;
  document.getElementById('comprov-inp').value = '';
  document.getElementById('drop-idle').style.display = '';
  document.getElementById('drop-preview').style.display = 'none';
  document.getElementById('prev-img').src = '';
  document.getElementById('btn-upload').disabled = true;
}

async function enviarComprovante() {
  if (!comprovFile) return;

  const btn = document.getElementById('btn-upload');
  const st  = document.getElementById('up-status');
  btn.disabled = true;
  btn.textContent = 'Enviando…';
  st.style.display = '';
  st.className = 'up-status up-saving';
  st.innerHTML = '<span class="up-spin"></span> Fazendo upload…';

  try {
    const apelido = apelidoSalvo || 'anonimo';
    const ext  = comprovFile.name.split('.').pop().toLowerCase() || 'jpg';
    const nome = `${apelido.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}.${ext}`;
    const path = `comprovantes/${nome}`;

    // Upload via Supabase Storage REST API
    const r = await fetch(
      `${SUPA.url}/storage/v1/object/bolao29/${path}`,
      {
        method: 'POST',
        headers: {
          'apikey':        SUPA.anonKey,
          'Authorization': `Bearer ${SUPA.anonKey}`,
          'Content-Type':  comprovFile.type,
          'x-upsert':      'true',
        },
        body: comprovFile,
      }
    );

    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Storage: ${r.status} — ${err}`);
    }

    // Salva referência na tabela comprovantes
    await DB.upsert('comprovantes', {
      apelido:   apelidoSalvo,
      arquivo:   path,
      tamanho:   comprovFile.size,
    });

    // Passo 3: sucesso
    document.getElementById('step-comprovante').style.display = 'none';
    document.getElementById('step-sucesso').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Enviar comprovante ✓';
    st.className = 'up-status up-err';
    st.textContent = `❌ ${e.message}`;
    console.error(e);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────
function copiarPix() {
  navigator.clipboard.writeText(CFG.pix)
    .then(() => alert('Chave PIX copiada!'))
    .catch(() => alert(CFG.pix));
}

function redimensionar(file, maxPx, cb) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const r = Math.min(maxPx / img.width, maxPx / img.height, 1);
    canvas.width  = Math.round(img.width  * r);
    canvas.height = Math.round(img.height * r);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    cb(canvas.toDataURL('image/jpeg', 0.8));
  };
  img.src = URL.createObjectURL(file);
}
