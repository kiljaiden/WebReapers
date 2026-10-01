/* =========================================================
   er-ui.js — Interfaz inmersiva compartida por todos los módulos
   · Modal universal (erModal / erConfirm) · Toasts · Ctrl+K
   · Canvas de almas · reveal on scroll · tilt 3D · contadores
   ========================================================= */

/* ---------- Escape HTML ---------- */
window.erEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Formato fecha ---------- */
window.erDate = t => { try { const d = new Date(typeof t === 'number' ? t : (t?.toMillis ? t.toMillis() : t)); return isNaN(d) ? '—' : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return '—'; } };
window.erDateTime = t => { try { const d = new Date(typeof t === 'number' ? t : (t?.toMillis ? t.toMillis() : t)); return isNaN(d) ? '—' : d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } };

/* ---------- TOASTS ---------- */
window.erToast = function (msg, type = 'ok', ms = 3600) {
    const box = document.getElementById('erToasts'); if (!box) return;
    const icons = { ok: 'fa-circle-check', err: 'fa-triangle-exclamation', info: 'fa-circle-info', gold: 'fa-star' };
    const el = document.createElement('div');
    el.className = 'er-toast ' + type;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.ok}"></i><span>${erEsc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
};

/* ---------- MODAL UNIVERSAL ----------
   erModal({title, body, footer:[{label,class,onClick,close}], wide}) */
let _modalPrevFocus = null;
window.erModal = function (opts = {}) {
    const root = document.getElementById('erModalRoot');
    const card = document.getElementById('erModalCard');
    document.getElementById('erModalTitle').innerHTML = opts.title || '';
    const body = document.getElementById('erModalBody');
    body.innerHTML = typeof opts.body === 'string' ? opts.body : '';
    if (opts.onMount) requestAnimationFrame(() => opts.onMount(body));
    const foot = document.getElementById('erModalFoot');
    foot.innerHTML = '';
    if (opts.footer && opts.footer.length) {
        foot.hidden = false;
        opts.footer.forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'er-btn ' + (b.class || '');
            btn.innerHTML = b.label;
            btn.onclick = async (e) => { const keep = await b.onClick?.(e, body); if (b.close !== false && keep !== false) erCloseModal(); };
            foot.appendChild(btn);
        });
    } else foot.hidden = true;
    card.style.width = opts.wide ? 'min(980px,100%)' : '';
    card.parentElement.style.width = opts.wide ? 'min(980px,100%)' : 'min(680px,100%)';
    _modalPrevFocus = document.activeElement;
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    const focusable = card.querySelector('input,textarea,select,button:not([data-close])');
    focusable?.focus?.();
    return root;
};
window.erCloseModal = function () {
    const root = document.getElementById('erModalRoot');
    if (!root || root.hidden) return;
    root.hidden = true;
    document.body.style.overflow = '';
    _modalPrevFocus?.focus?.();
};
/* Confirmación elegante dentro del modal */
window.erConfirm = function (title, msg, onYes, yesLabel = 'Afirmar') {
    erModal({
        title: `<i class="fa-solid fa-scale-balanced" style="color:var(--gold)"></i> ${erEsc(title)}`,
        body: `<p style="color:var(--txt-dim)">${msg}</p>`,
        footer: [
            { label: 'Retirarse', class: 'ghost', onClick: () => {} },
            { label: `<i class="fa-solid fa-check"></i> ${erEsc(yesLabel)}`, class: 'gold', onClick: () => onYes() }
        ]
    });
};
document.addEventListener('click', e => { if (e.target.closest('#erModalRoot [data-close]')) erCloseModal(); });

/* ---------- CTRL+K PALETA (índice Python + Firestore en vivo) ---------- */
(function palette() {
    const root = document.getElementById('erPalette');
    const input = document.getElementById('erPaletteInput');
    const list = document.getElementById('erPaletteList');
    if (!root) return;
    let items = [], sel = 0, extra = [];

    async function loadExtra() {
        /* indexa noticias/raids/leyendas desde la BD para la búsqueda global */
        try {
            const [n, r, l] = await Promise.all([erGet('news', { limit: 30 }), erGet('raid_events', { limit: 30 }), erGet('legendary_hof', { limit: 30 })]);
            extra = [
                ...n.rows.map(x => ({ href: '/', icon: 'fa-scroll', title: x.title || 'Edicto', desc: 'Noticia de la hermandad' })),
                ...r.rows.map(x => ({ href: '/', icon: 'fa-calendar-days', title: x.name || x.boss || 'Raid', desc: 'Evento de raid' })),
                ...l.rows.map(x => ({ href: '/leyendas', icon: 'fa-trophy', title: `${x.character || x.name || ''} · ${x.item || 'Legendaria'}`, desc: 'Sala de Leyendas' })),
            ].slice(0, 40);
        } catch (e) {}
    }
    function baseIndex() {
        return fetch('/api/search').then(r => r.json()).catch(() => []);
    }
    let BASE = [];
    baseIndex().then(b => { BASE = b; refresh(''); });
    loadExtra();

    function refresh(q) {
        q = (q || '').toLowerCase();
        const pool = [...BASE, ...extra];
        items = q ? pool.filter(i => (i.title + ' ' + i.desc).toLowerCase().includes(q)) : pool.slice(0, 9);
        sel = 0; draw();
    }
    function draw() {
        list.innerHTML = items.map((i, idx) => `
          <div class="er-pitem ${idx === sel ? 'sel' : ''}" data-i="${idx}">
            <i class="fa-solid ${i.icon}"></i>
            <div><b>${erEsc(i.title)}</b><span>${erEsc(i.desc)}</span></div>
          </div>`).join('') || '<div class="er-empty" style="padding:22px"><i class="fa-solid fa-ghost"></i>Ningún eco encontrado…</div>';
        list.querySelectorAll('.er-pitem').forEach(el => el.onclick = () => go(+el.dataset.i));
    }
    function go(idx) { const it = items[idx]; if (it) { close(); location.href = it.href; } }
    function open() { root.hidden = false; input.value = ''; refresh(''); setTimeout(() => input.focus(), 30); }
    function close() { root.hidden = true; }

    input.addEventListener('input', () => refresh(input.value));
    root.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); root.hidden ? open() : close(); }
        if (root.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, items.length - 1); draw(); e.preventDefault(); }
        if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
        if (e.key === 'Enter') go(sel);
    });
    document.getElementById('erSearchBtn')?.addEventListener('click', open);
})();

/* ---------- NAVBAR móvil + sombra al hacer scroll ---------- */
(function navFx() {
    const bar = document.getElementById('erTopbar'), burger = document.getElementById('erBurger'), nav = document.getElementById('erNav');
    burger?.addEventListener('click', () => nav.classList.toggle('open'));
    nav?.addEventListener('click', () => nav.classList.remove('open'));
    addEventListener('scroll', () => bar?.classList.toggle('scrolled', scrollY > 8), { passive: true });
})();

/* ---------- CANVAS DE ALMAS (partículas flotantes) ---------- */
(function souls() {
    const cv = document.getElementById('er-souls'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, parts = [], mouse = { x: -999, y: -999 };
    const N = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.min(70, (innerWidth / 22) | 0);
    function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
    resize(); addEventListener('resize', resize);
    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    const colors = ['78,230,168', '232,197,106', '127,212,255'];
    for (let i = 0; i < N; i++) parts.push({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: .8 + Math.random() * 2.4, vx: (Math.random() - .5) * .22, vy: -.12 - Math.random() * .3,
        a: .1 + Math.random() * .45, c: colors[(Math.random() * colors.length) | 0], ph: Math.random() * 6.28
    });
    (function tick(t) {
        ctx.clearRect(0, 0, W, H);
        for (const p of parts) {
            p.x += p.vx + Math.sin(t / 1600 + p.ph) * .18; p.y += p.vy;
            if (p.y < -12) { p.y = H + 10; p.x = Math.random() * W; }
            if (p.x < -12) p.x = W + 10; if (p.x > W + 12) p.x = -10;
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
            const glow = d2 < 16000 ? 1 + (16000 - d2) / 16000 * 2.2 : 1;   /* reacciona al cursor */
            if (d2 < 16000) { p.x += dx / 240; p.y += dy / 240; }
            const alpha = p.a * (0.7 + 0.3 * Math.sin(t / 900 + p.ph)) * glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * glow, 0, 6.28);
            ctx.fillStyle = `rgba(${p.c},${Math.min(alpha, .9)})`;
            ctx.shadowColor = `rgba(${p.c},.8)`; ctx.shadowBlur = 10 * glow;
            ctx.fill(); ctx.shadowBlur = 0;
        }
        requestAnimationFrame(tick);
    })(0);
})();

/* ---------- REVEAL ON SCROLL ---------- */
(function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    const scan = () => document.querySelectorAll('.er-reveal:not(.in)').forEach(el => io.observe(el));
    scan(); new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();

/* ---------- TILT 3D sutil en tarjetas ---------- */
(function tilt() {
    if (matchMedia('(pointer:coarse)').matches) return;
    document.addEventListener('mousemove', e => {
        const card = e.target.closest?.('.er-card[data-tilt]') || e.target.closest?.('.er-module-card');
        if (!card) return;
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -5;
        const ry = ((e.clientX - r.left) / r.width - .5) * 7;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
    });
    document.addEventListener('mouseleave', () => document.querySelectorAll('.er-card,.er-module-card').forEach(c => c.style.transform = ''), true);
})();

/* ---------- CONTADORES ANIMADOS ---------- */
window.erCount = function (el, to, dur = 1100) {
    const t0 = performance.now();
    (function step(t) {
        const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e).toLocaleString('es-ES');
        if (k < 1) requestAnimationFrame(step);
    })(t0);
};

/* ---------- Efecto de escritura (typewriter) ---------- */
window.erType = function (el, text, speed = 42) {
    let i = 0; el.textContent = '';
    (function tick() { if (i <= text.length) { el.textContent = text.slice(0, i++); setTimeout(tick, speed); } })();
};

/* ---------- Tabs genérico ---------- */
window.erTabs = function (containerId) {
    const c = document.getElementById(containerId); if (!c) return;
    c.querySelectorAll('.er-tab').forEach(tab => tab.addEventListener('click', () => {
        c.querySelectorAll('.er-tab').forEach(t => t.classList.remove('active'));
        c.querySelectorAll('.er-tabpane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.pane)?.classList.add('active');
    }));
};

/* ---------- Notificador Discord vía API Python ---------- */
window.erNotify = function (title, text) {
    fetch('/api/discord', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, text }) }).catch(() => {});
};
