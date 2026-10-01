#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_pages.py — genera el portal Eternal Reapers (ejecutar una sola vez)."""
import io, os

OUT = '/workspace'

HEAD = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#0a0b10">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="er.css">
<script src="config.js"></script>
<script src="firebase-init.js"></script>
<script src="er-ui.js" defer></script>
<script src="er-shell.js" defer></script>
<script src="er-db.js" defer></script>
<style>{style}</style>
</head>
<body>
"""

FOOT = """
<footer class="er-footer"><b>Eternal Reapers</b> · La cosecha es eterna · Pulsa <b class="gold">Ctrl+K</b> para buscar en toda la hermandad</footer>
<script>if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});</script>
</body>
</html>
"""

def write(fname, title, desc, style, body):
    html = HEAD.format(title=title, desc=desc, style=style) + body + FOOT
    with io.open(os.path.join(OUT, fname), 'w', encoding='utf-8') as f:
        f.write(html)
    print(fname, len(html))

BOOT = """import './firebase-init.js';
const { erDbReady } = await import('./firebase-init.js');
const fs = await import('firebase/firestore');
const { auth, db } = await erDbReady();
const { collection, doc, getDoc, getDocs, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } = fs;
const esc = window.erEsc;
let ME = null, PROFILE = null, IS_ADMIN = false;
try { const { rows } = await erGet('users'); if (auth.currentUser) PROFILE = rows.find(u => u.id === auth.currentUser.uid) || null; } catch (e) {}
ME = auth.currentUser;
IS_ADMIN = !!(PROFILE && (PROFILE.role === 'GM' || PROFILE.role === 'Oficial'));
document.body.classList.toggle('er-is-admin', IS_ADMIN);
"""

# =====================================================================
# LOGIN
# =====================================================================
login_style = """
.login-wrap { max-width: 460px; margin: 6vh auto 0; }
.orb { position:absolute; width:220px; height:220px; border-radius:50%; filter:blur(70px); opacity:.35; pointer-events:none; }
.divider-or { display:flex; align-items:center; gap:14px; color:var(--muted); font-size:.75rem; text-transform:uppercase; margin:18px 0; }
.divider-or::before,.divider-or::after{content:'';flex:1;height:1px;background:var(--line);}
"""
login_body = """
<main class="container">
<div class="login-wrap">
  <div class="card" style="position:relative;overflow:hidden;padding:34px">
    <span class="orb" style="background:var(--gold);top:-80px;right:-60px"></span>
    <span class="orb" style="background:var(--reaper);bottom:-90px;left:-70px"></span>
    <div style="text-align:center;margin-bottom:24px">
      <span class="er-brand-sigil" style="width:64px;height:64px;font-size:2rem;display:inline-grid;border-radius:18px"><i class="fas fa-scythe"></i></span>
      <h2 style="margin-top:14px" id="login-title">Pórtico de los Segadores</h2>
      <p class="muted small" id="login-sub">Identifícate para ver tu DKP, reservas y misiones legendarias.</p>
    </div>

    <form id="form-login" autocomplete="on">
      <label class="field"><span>Correo</span><input class="input" type="email" id="li-email" required placeholder="segador@eternalreapers.gg"></label>
      <label class="field"><span>Contraseña</span><input class="input" type="password" id="li-pass" required placeholder="••••••••"></label>
      <button class="er-btn gold block" type="submit"><i class="fas fa-key"></i> Entrar a la Hermandad</button>
    </form>

    <div class="divider-or">o forja sesión con</div>
    <button class="er-btn ghost block" id="btn-google"><i class="fab fa-google"></i> Continuar con Google</button>

    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="muted small">¿Aún no portas la hoz?</span>
      <button class="er-btn sm ghost" id="to-signup"><i class="fas fa-user-plus"></i> Crear cuenta</button>
    </div>
  </div>
</div>
</main>

<script type="module">
import './firebase-init.js';
const { erDbReady } = await import('./firebase-init.js');
const fb = await import('firebase/auth');
const fs = await import('firebase/firestore');
const { auth, db } = await erDbReady();
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } = fb;
const { doc, getDoc, setDoc } = fs;
const esc = window.erEsc;

async function ensureProfile(user) {
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { mainName: user.displayName || user.email.split('@')[0], email: user.email, role: 'Iniciado', wowClass: '', dkp: 0, createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() });
    } else {
      await setDoc(ref, { lastSeen: fs.serverTimestamp() }, { merge: true });
    }
  } catch (e) { console.warn('perfil:', e.message); }
}
function afterAuth() { window.erToast('Bienvenido a la cosecha 🌾', 'success'); setTimeout(() => location.href = 'index.html', 800); }

document.getElementById('form-login').addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = ev.target.querySelector('button');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verificando…';
  try {
    const r = await signInWithEmailAndPassword(auth, document.getElementById('li-email').value.trim(), document.getElementById('li-pass').value);
    await ensureProfile(r.user); afterAuth();
  } catch (e) {
    window.erToast('Acceso denegado: ' + (e.code === 'auth/user-not-found' ? 'segador desconocido' : e.code === 'auth/wrong-password' ? 'contraseña incorrecta' : e.message), 'error');
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-key"></i> Entrar a la Hermandad';
  }
});

document.getElementById('btn-google').addEventListener('click', async () => {
  try {
    const r = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureProfile(r.user); afterAuth();
  } catch (e) { window.erToast('Google dijo: ' + e.message, 'error'); }
});

document.getElementById('to-signup').addEventListener('click', () => {
  window.erModal({
    title: 'Forjar tu entrada en la hermandad', icon: 'fa-user-plus', size: 'sm',
    body: `
      <label class="field"><span>Nombre en Azeroth *</span><input class="input" id="su-name" placeholder="Ej.: Mortaselva"></label>
      <label class="field"><span>Clase</span><select class="input" id="su-class"><option value="">Elige…</option>${['Guerrero','Paladín','Cazador','Pícaro','Sacerdote','Caballero de la Muerte','Chamán','Mago','Brujo','Druida'].map(c=>'<option>'+c+'</option>').join('')}</select></label>
      <label class="field"><span>Correo *</span><input class="input" type="email" id="su-email"></label>
      <label class="field"><span>Contraseña * (mín. 6)</span><input class="input" type="password" id="su-pass"></label>`,
    actions: [{ label: 'Cancelar', style: 'ghost', onClick: c => c() },
      { label: 'Crear cuenta', style: 'gold', icon: 'fa-hammer', onClick: async close => {
        const name = document.getElementById('su-name').value.trim();
        const email = document.getElementById('su-email').value.trim();
        const pass = document.getElementById('su-pass').value;
        if (!name || !email || pass.length < 6) return window.erToast('Revisa los campos obligatorios.', 'error');
        try {
          const r = await createUserWithEmailAndPassword(auth, email, pass);
          await fs.setDoc(fs.doc(db, 'users', r.user.uid), { mainName: name, email, role: 'Iniciado', wowClass: document.getElementById('su-class').value, dkp: 0, createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() });
          window.erNotifyDiscord({ title: 'Nuevo segador', text: `${name} se ha unido al portal.` });
          close(); afterAuth();
        } catch (e) { window.erToast('No se pudo crear: ' + e.message, 'error'); }
      }}]
  });
});

// ¿Ya con sesión? directo al salón
auth.onCurrentUser ? auth.onCurrentUser(()=>{}) : null;
if (auth.currentUser) { ensureProfile(auth.currentUser); location.href = 'index.html'; }
</script>
"""

# =====================================================================
# DKP
# =====================================================================
dkp_style = """
.dkp-hero-num { font-family:var(--font-title); font-size:3rem; color:var(--gold); line-height:1; }
.bar-row { display:flex; align-items:center; gap:12px; padding:8px 0; }
.bar-row .nm { width:150px; font-weight:700; font-size:.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bar-track { flex:1; height:22px; background:var(--bg-0); border:1px solid var(--line); border-radius:8px; overflow:hidden; position:relative; }
.bar-fill { height:100%; background:linear-gradient(90deg,var(--gold-dim),var(--gold)); transition:width .8s cubic-bezier(.4,0,.2,1); display:flex; align-items:center; justify-content:flex-end; padding-right:8px; font-size:.72rem; font-weight:800; color:#0d0a00; min-width:2px; }
.log-pos { color:var(--success); font-weight:800; } .log-neg { color:var(--danger); font-weight:800; }
.checkin-code { font-family:var(--font-title); font-size:2.4rem; letter-spacing:10px; color:var(--gold); text-shadow:0 0 30px rgba(248,183,0,.5); }
@media (max-width:640px){ .bar-row .nm { width:90px; } }
"""
dkp_body = """
<main class="container">
  <div class="page-hero">
    <h1><i class="fas fa-coins accent"></i> DKP <span class="accent">System</span></h1>
    <p>Transparencia total: cada punto ganado o gastado queda registrado. Consulta tu saldo, el ranking de la hermandad y el historial de raids.</p>
  </div>

  <section class="grid grid-4" style="margin-bottom:26px">
    <div class="stat-tile"><span class="st-icon"><i class="fas fa-wallet"></i></span><div><b id="my-dkp">—</b><small>Mi saldo DKP</small></div></div>
    <div class="stat-tile green"><span class="st-icon"><i class="fas fa-ranking-star"></i></span><div><b id="my-rank">—</b><small>Mi posición</small></div></div>
    <div class="stat-tile blue"><span class="st-icon"><i class="fas fa-calendar-check"></i></span><div><b id="my-att">—</b><small>Raids asistidas</small></div></div>
    <div class="stat-tile red"><span class="st-icon"><i class="fas fa-gem"></i></span><div><b id="my-spent">—</b><small>DKP gastados</small></div></div>
  </section>

  <div class="sub-tabs" id="dkp-tabs">
    <button class="sub-tab active" data-p="ranking"><i class="fas fa-trophy"></i> Ranking</button>
    <button class="sub-tab" data-p="historial"><i class="fas fa-clock-rotate-left"></i> Mi historial</button>
    <button class="sub-tab" data-p="checkin"><i class="fas fa-qrcode"></i> Pase de lista</button>
  </div>

  <section class="tab-panel active card" id="p-ranking">
    <div class="card-head"><h3><i class="fas fa-chart-simple"></i> Ranking de Segadores</h3><input class="input" id="dkp-search" placeholder="Buscar…" style="max-width:180px;padding:8px 12px;font-size:.85rem"></div>
    <div id="bars"><div class="spinner"></div></div>
  </section>

  <section class="tab-panel card" id="p-historial">
    <div class="card-head"><h3><i class="fas fa-receipt"></i> Movimientos de mi cuenta</h3></div>
    <div class="table-wrap" style="border:none;background:transparent">
      <table class="er-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Cambio</th><th>Saldo</th></tr></thead>
      <tbody id="log-body"><tr><td colspan="5"><div class="empty-state"><i class="fas fa-user-lock"></i>Inicia sesión para ver tu historial.</div></td></tr></tbody></table>
    </div>
  </section>

  <section class="tab-panel card" id="p-checkin" style="text-align:center">
    <div class="card-head" style="justify-content:center"><h3><i class="fas fa-satellite-dish"></i> Pase de lista de la raid en curso</h3></div>
    <div id="checkin-box">
      <p class="muted">Cuando un oficial abra el pase de lista, aparecerá aquí el código de la raid.</p>
    </div>
  </section>
</main>

<script type="module">
""" + BOOT + """
/* tabs */
document.querySelectorAll('#dkp-tabs .sub-tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('#dkp-tabs .sub-tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('p-' + t.dataset.p).classList.add('active');
});

let USERS = [];
function renderRanking(q='') {
  const box = document.getElementById('bars');
  const rows = USERS.filter(u => (u.dkp ?? u.dkpEarned ?? 0) > -9000)
                    .filter(u => !q || (u.mainName||'').toLowerCase().includes(q.toLowerCase()))
                    .sort((a,b)=>((b.dkp??b.dkpEarned??0)-(a.dkp??a.dkpEarned??0))).slice(0, 25);
  if (!rows.length) { box.innerHTML = '<div class="empty-state"><i class="fas fa-ghost"></i>Sin datos todavía.</div>'; return; }
  const max = Math.max(...rows.map(r => r.dkp ?? r.dkpEarned ?? 0), 1);
  box.innerHTML = rows.map((r,i) => {
    const v = r.dkp ?? r.dkpEarned ?? 0;
    return `<div class="bar-row"><span class="nm">${i+1}. ${esc(r.mainName)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,(v/max)*100)}%">${v}</div></div></div>`;
  }).join('');
}

(async () => {
  try {
    await erWatch('users', rows => {
      USERS = rows.filter(u => !u._mergedInto && u.mainName);
      renderRanking(document.getElementById('dkp-search').value);
    });
  } catch (e) { const { rows } = await erGet('users').catch(()=>({rows:[]})); USERS = rows.filter(u=>!u._mergedInto&&u.mainName); renderRanking(); }
})();
document.getElementById('dkp-search').addEventListener('input', e => renderRanking(e.target.value));

/* MI SALDO + HISTORIAL */
async function paintMine() {
  if (!ME) { document.getElementById('my-dkp').textContent='·'; return; }
  const p = PROFILE || {};
  document.getElementById('my-dkp').textContent = p.dkp ?? p.dkpEarned ?? 0;
  const sorted = [...USERS].sort((a,b)=>((b.dkp??0)-(a.dkp??0)));
  const idx = sorted.findIndex(u => u.id === ME.uid);
  document.getElementById('my-rank').textContent = idx >= 0 ? '#' + (idx+1) : '—';
  try {
    const { rows } = await erGet('dkp_log', { where: [['uid','==',ME.uid]] });
    const mine = rows.sort((a,b)=>((b.at&&b.at.seconds)||0)-((a.at&&a.at.seconds)||0)).slice(0,60);
    document.getElementById('my-att').textContent = mine.filter(m=>m.type==='earn').length;
    document.getElementById('my-spent').textContent = mine.filter(m=>m.type==='spend').reduce((s,m)=>s+Math.abs(m.amount||0),0);
    document.getElementById('log-body').innerHTML = mine.length ? mine.map(m => `
      <tr><td class="muted small">${window.erTimeAgo(m.at)}</td>
      <td><span class="badge ${m.type==='spend'?'red':'green'}">${m.type==='spend'?'Gasto':'Ganancia'}</span></td>
      <td>${esc(m.reason || m.item || 'Raid')}</td>
      <td class="${(m.amount||0)>=0?'log-pos':'log-neg'}">${(m.amount||0)>=0?'+':''}${m.amount||0}</td>
      <td class="gold"><b>${m.balance ?? '—'}</b></td></tr>`).join('')
      : '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-inbox"></i>Aún sin movimientos.</div></td></tr>';
  } catch (e) {}
}
paintMine();

/* CHECKIN EN VIVO */
try {
  onSnapshot(doc(db,'settings','active_attendance'), s => {
    const d = s.exists() && s.data();
    const box = document.getElementById('checkin-box');
    if (!d || !d.isActive) { box.innerHTML = '<div class="empty-state"><i class="fas fa-moon"></i>No hay pase de lista abierto ahora mismo.<br><span class="small">Vuelve durante una raid.</span></div>'; return; }
    box.innerHTML = `
      <p class="muted small">Teclea este código en el chat de la hermandad / app:</p>
      <div class="checkin-code" style="margin:14px 0">${esc(d.code || '····')}</div>
      <p class="muted small">Raid: <b class="gold">${esc(d.raid || '')}</b></p>
      <button class="er-btn gold" style="margin-top:16px" id="btn-copy-code"><i class="fas fa-copy"></i> Copiar código</button>`;
    document.getElementById('btn-copy-code').onclick = () => { navigator.clipboard.writeText(d.code||''); window.erToast('Código copiado ✔', 'success'); };
  });
} catch (e) {}
</script>
"""

# =====================================================================
# SOFTRESERVE
# =====================================================================
sr_style = """
.sr-card { cursor:pointer; }
.sr-item { font-weight:800; }
.slot-icons { display:flex; gap:6px; flex-wrap:wrap; }
.slot-chip { font-size:.68rem; border:1px solid var(--line); background:var(--panel-2); padding:3px 9px; border-radius:99px; color:var(--muted); }
.vote-bar { height:10px; border-radius:99px; background:var(--bg-0); border:1px solid var(--line); overflow:hidden; }
.vote-bar i { display:block; height:100%; background:linear-gradient(90deg,#2f8f5b,var(--reaper)); }
.council-tag { position:absolute; top:14px; right:14px; }
"""
sr_body = """
<main class="container">
  <div class="page-hero">
    <h1><i class="fas fa-hand-holding-heart accent"></i> Soft<span class="accent">Reserve</span></h1>
    <p>Reserva objetos antes de que caigan, vota en el Loot Council y sigue el estado de cada postulación. Sin gritos, sin drama: solo honor.</p>
  </div>

  <section class="grid grid-4" style="margin-bottom:26px">
    <div class="stat-tile"><span class="st-icon"><i class="fas fa-bookmark"></i></span><div><b id="sr-total">—</b><small>Reservas activas</small></div></div>
    <div class="stat-tile green"><span class="st-icon"><i class="fas fa-scale-balanced"></i></span><div><b id="sr-council">—</b><small>En Loot Council</small></div></div>
    <div class="stat-tile blue"><span class="st-icon"><i class="fas fa-hourglass-half"></i></span><div><b id="sr-week">—</b><small>Nuevas esta semana</small></div></div>
    <div class="stat-tile red"><span class="st-icon"><i class="fas fa-circle-check"></i></span><div><b id="sr-done">—</b><small>Concedidas</small></div></div>
  </section>

  <div class="flex wrap" style="margin-bottom:20px">
    <button class="er-btn gold" id="btn-new-reserve"><i class="fas fa-plus"></i> Nueva reserva</button>
    <select class="input" id="sr-filter" style="max-width:190px">
      <option value="">Todas las reservas</option>
      <option value="pendiente">Pendientes</option>
      <option value="council">En council</option>
      <option value="concedida">Concedidas</option>
      <option value="rechazada">Rechazadas</option>
    </select>
    <input class="input" id="sr-search" placeholder="Buscar objeto o segador…" style="max-width:240px">
    <span class="right muted small" id="sr-live-note"><span class="live-dot" style="background:var(--success)"></span> sincronización en vivo</span>
  </div>

  <div class="grid grid-3" id="sr-grid"><div class="spinner"></div></div>
</main>

<script type="module">
""" + BOOT + """
const STATUS_BADGE = { pendiente:['gold','Pendiente'], council:['blue','En Council'], concedida:['green','Concedida'], rechazada:['red','Rechazada'] };
let ALL = [];

function paint() {
  const q = (document.getElementById('sr-search').value||'').toLowerCase();
  const f = document.getElementById('sr-filter').value;
  const rows = ALL.filter(r => (!f || (r.status||'pendiente')===f) && (!q || ((r.item||'')+(r.char||'')).toLowerCase().includes(q)));
  const grid = document.getElementById('sr-grid');
  if (!rows.length) { grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1"><i class="fas fa-feather"></i>No hay reservas que mostrar. ¡Sé el primero en reservar!</div>'; return; }
  grid.innerHTML = rows.map(r => {
    const [cls, lbl] = STATUS_BADGE[r.status||'pendiente'] || STATUS_BADGE.pendiente;
    const votes = (r.votes||[]).length;
    const voters = (r.votes||[]).map(v => typeof v==='string'?v:(v.char||''));
    const yes = voters.filter(Boolean).length;
    return `<div class="card hoverable sr-card" data-id="${r.id}" style="position:relative">
      ${r.status==='council'?'<span class="badge blue council-tag"><i class="fas fa-scale-balanced"></i> Council</span>':''}
      <div class="card-head"><h3><i class="fas fa-gem"></i> <span class="sr-item">${esc(r.item||'Objeto sin nombre')}</span></h3></div>
      <div class="list-row"><i class="fas fa-user-ninja gold"></i><span class="grow muted small">Reservado por</span><b>${esc(r.char||r.mainName||'—')}</b></div>
      <div class="list-row"><i class="fas fa-location-dot gold"></i><span class="grow muted small">Fuente</span><b>${esc(r.boss||r.source||'—')}</b></div>
      <div class="slot-icons" style="margin:10px 0">${(r.slots||[]).map(s=>`<span class="slot-chip">${esc(s)}</span>`).join('')||'<span class="slot-chip">Sin slot</span>'}</div>
      <div class="progress"><i style="width:${votes?Math.min(100,yes*33):0}%"></i></div>
      <div class="flex" style="margin-top:10px"><span class="badge ${cls}">${lbl}</span><span class="muted small right">${votes} voto(s) · ${window.erTimeAgo(r.createdAt)}</span></div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.sr-card').forEach(c => c.onclick = () => openDetail(c.dataset.id));
}

function openDetail(id) {
  const r = ALL.find(x => x.id === id); if (!r) return;
  const already = (r.votes||[]).some(v => (typeof v==='string'?v:(v.uid||v.char)) === (ME && (ME.uid || (PROFILE&&PROFILE.mainName))));
  window.erModal({
    title: r.item || 'Reserva', icon: 'fa-gem', size: 'md',
    body: `
      <div class="list-row"><i class="fas fa-user-ninja gold"></i><span class="grow">Segador</span><b>${esc(r.char||r.mainName||'—')}</b></div>
      <div class="list-row"><i class="fas fa-skull gold"></i><span class="grow">Boss / fuente</span><b>${esc(r.boss||r.source||'—')}</b></div>
      <div class="list-row"><i class="fas fa-ring gold"></i><span class="grow">Slots</span><b>${esc((r.slots||[]).join(', ')||'—')}</b></div>
      <div class="list-row"><i class="fas fa-clock gold"></i><span class="grow">Estado</span><span class="badge ${(STATUS_BADGE[r.status||'pendiente']||['gray'])[0]}">${esc(r.status||'pendiente')}</span></div>
      <div class="divider"></div>
      <p class="muted small" style="white-space:pre-line">${esc(r.notes||'Sin notas del reservante.')}</p>
      <div class="divider"></div>
      <h4 style="margin-bottom:8px"><i class="fas fa-users gold"></i> Apoyos (${(r.votes||[]).length})</h4>
      <div class="flex wrap">${(r.votes||[]).map(v=>`<span class="badge gray">${esc(typeof v==='string'?v:(v.char||v.uid||''))}</span>`).join('')||'<span class="muted small">Nadie ha votado aún.</span>'}</div>`,
    actions: [
      { label: 'Cerrar', style: 'ghost', onClick: c => c() },
      ...(ME ? [{ label: already ? 'Ya votaste ✓' : 'Votar a favor', style: already ? 'ghost' : 'success', icon: 'fa-thumbs-up', disabled: already, onClick: async close => {
        if (already) return;
        const votes = (r.votes||[]).concat([{ uid: ME.uid, char: (PROFILE&&PROFILE.mainName)||ME.email.split('@')[0], at: Date.now() }]);
        try { await erSet('soft_reserves', r.id, { votes }); window.erToast('Voto registrado 🗳️', 'success'); close(); }
        catch(e){ window.erToast('Error al votar: '+e.message, 'error'); }
      }}] : [])
    ]
  });
}

document.getElementById('btn-new-reserve').onclick = () => {
  if (!ME) { window.erToast('Necesitas iniciar sesión para reservar.', 'error'); return location.href='login.html'; }
  window.erModal({
    title: 'Nueva SoftReserve', icon: 'fa-hand-holding-heart', size: 'md',
    body: `
      <label class="field"><span>Objeto reservado *</span><input class="input" id="nr-item" placeholder="Ej.: Felo'melorn"></label>
      <div class="grid grid-2">
        <label class="field"><span>Boss / fuente</span><input class="input" id="nr-boss" placeholder="Ej.: Malygos"></label>
        <label class="field"><span>Slots deseados</span><input class="input" id="nr-slots" placeholder="Ej.: cabeza, mano"></label>
      </div>
      <label class="field"><span>Notas para el council</span><textarea class="input" id="nr-notes" placeholder="¿Por qué te favorece este objeto? Sé breve y honesto."></textarea></label>`,
    actions: [
      { label:'Cancelar', style:'ghost', onClick:c=>c() },
      { label:'Reservar', style:'gold', icon:'fa-bookmark', onClick: async close => {
        const item = document.getElementById('nr-item').value.trim();
        if (!item) return window.erToast('El objeto es obligatorio.', 'error');
        try {
          await erAdd('soft_reserves', {
            item, boss: document.getElementById('nr-boss').value.trim(),
            slots: document.getElementById('nr-slots').value.split(',').map(s=>s.trim()).filter(Boolean),
            notes: document.getElementById('nr-notes').value.trim(),
            char: (PROFILE && PROFILE.mainName) || ME.email.split('@')[0],
            uid: ME.uid, status: 'pendiente', votes: [],
            createdAt: serverTimestamp()
          });
          window.erToast('Reserva creada. El council la revisará pronto ✨', 'success');
          window.erNotifyDiscord({ title:'Nueva SoftReserve', text: `${((PROFILE||{}).mainName)||'Un segador'} reservó ${item}` });
          close();
        } catch (e) { window.erToast('No se pudo reservar: ' + e.message, 'error'); }
      }}
    ]
  });
};

document.getElementById('sr-filter').onchange = paint;
document.getElementById('sr-search').oninput = paint;

(async () => {
  try {
    await erWatch('soft_reserves', rows => {
      ALL = rows.sort((a,b)=>((b.createdAt&&b.createdAt.seconds)||0)-((a.createdAt&&a.createdAt.seconds)||0));
      paint();
      document.getElementById('sr-total').textContent = ALL.length;
      document.getElementById('sr-council').textContent = ALL.filter(r=>r.status==='council').length;
      document.getElementById('sr-done').textContent = ALL.filter(r=>r.status==='concedida').length;
      const week = Date.now()/1000 - 604800;
      document.getElementById('sr-week').textContent = ALL.filter(r=>(r.createdAt&&r.createdAt.seconds)>week).length;
    });
  } catch (e) {
    try { const { rows } = await erGet('soft_reserves'); ALL = rows; paint(); } catch(_){}
    document.getElementById('sr-live-note').innerHTML = '<i class="fas fa-database"></i> modo offline';
  }
})();
</script>
"""

print("builder base listo")
