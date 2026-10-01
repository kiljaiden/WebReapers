/* =========================================================
   er-shell.js — CABECERA GLOBAL, SESION, TEMA Y BUSQUEDA (Ctrl+K)
   =========================================================
   Inyecta el header en TODAS las paginas (no depende de que la
   pagina lo declare: si no existe #er-header, se crea al inicio
   del <body>). Ademas:
     - Sesion real via Firebase Auth + Firestore (users/{uid}).
     - Enlace "Consejo" solo para GM/Oficial (body.er-is-admin).
     - Modo claro/oscuro con persistencia.
     - Paleta de comandos Ctrl+K (paginas, roster, eventos, loot).
     - Boton "Instalar app" (PWA) cuando esta disponible.
   Se carga con <script src="er-shell.js" defer></script>.
   ========================================================= */
(function () {
    const GUILD = window.__ER_GUILD__ || {};

    /* ---------- 1) HEADER ---------- */
    function currentPage() {
        let p = location.pathname.split('/').pop();
        return (!p || p === '') ? 'index.html' : p;
    }
    function buildHeader() {
        let host = document.getElementById('er-header');
        if (!host) {
            host = document.createElement('header');
            host.id = 'er-header';
            host.className = 'er-header';
            document.body.insertBefore(host, document.body.firstChild);
        } else {
            host.classList.add('er-header');
        }
        const here = currentPage();
        const links = (window.__ER_PAGES__ || []).filter(p => p.href !== 'login.html');
        host.innerHTML = `
            <a class="er-brand" href="index.html" title="${GUILD.name || 'Eternal Reapers'}">
                <span class="er-brand-sigil"><i class="fas fa-scythe"></i></span>
                <span class="er-brand-text">
                    <b>${GUILD.name || 'Eternal Reapers'}</b>
                    <small>${(GUILD.motto || 'La cosecha es eterna')}</small>
                </span>
            </a>
            <nav id="er-nav">
                ${links.map(p => `
                    <a class="nav-link ${p.href === here ? 'active' : ''} ${p.href === 'panel.html' ? 'admin-only' : ''}" href="${p.href}">
                        <i class="fas ${p.icon}"></i> ${p.title}
                    </a>`).join('')}
            </nav>
            <div class="er-header-actions">
                <button class="icon-btn" id="er-kbd" title="Buscar (Ctrl+K)"><i class="fas fa-magnifying-glass"></i></button>
                <button class="icon-btn" id="er-theme" title="Cambiar tema"><i class="fas ${localStorage.getItem('er_theme') === 'light' ? 'fa-moon' : 'fa-sun'}"></i></button>
                <button class="icon-btn" id="er-install" title="Instalar aplicacion" style="display:none"><i class="fas fa-download"></i></button>
                <a class="user-chip" id="er-user-chip" href="login.html">
                    <span class="avatar-fallback" id="er-avatar">?</span>
                    <span id="er-username">Entrar</span>
                </a>
                <button class="icon-btn hamburger" id="er-burger" title="Menu"><i class="fas fa-bars"></i></button>
            </div>`;

        host.querySelector('#er-burger').onclick = () => document.body.classList.toggle('nav-open');
        host.querySelector('#er-theme').onclick = () => {
            const light = document.documentElement.getAttribute('data-theme') === 'light';
            if (light) document.documentElement.removeAttribute('data-theme');
            else document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('er_theme', light ? 'dark' : 'light');
            host.querySelector('#er-theme i').className = 'fas ' + (light ? 'fa-sun' : 'fa-moon');
            window.erToast && window.erToast(light ? 'Modo oscuro segador 🌑' : 'Modo claro dorado ✨', 'success', 1600);
        };
        host.querySelector('#er-kbd').onclick = openPalette;
    }

    // Tema persistente ANTES de pintar (evita parpadeo)
    if ((localStorage.getItem('er_theme') || 'dark') === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    /* ---------- 2) INSTALADOR PWA ---------- */
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault(); deferredPrompt = e;
        const b = document.getElementById('er-install');
        if (b) b.style.display = 'grid';
    });
    document.addEventListener('click', async e => {
        const b = e.target.closest('#er-install');
        if (!b || !deferredPrompt) return;
        deferredPrompt.prompt();
        const r = await deferredPrompt.userChoice;
        if (r.outcome === 'accepted') window.erToast('Instalando la hermandad en tu dispositivo…', 'success');
        deferredPrompt = null; b.style.display = 'none';
    });

    /* ---------- 3) PALETA DE COMANDOS (Ctrl+K) ---------- */
    let palette = null;
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function ensurePalette() {
        if (palette) return palette;
        palette = document.createElement('div');
        palette.className = 'kbd-overlay';
        palette.innerHTML = `
            <div class="kbd-box">
                <input class="kbd-input" placeholder="Buscar paginas, segadores, raids, loot…" autocomplete="off">
                <div class="kbd-list"></div>
            </div>`;
        document.body.appendChild(palette);
        const input = palette.querySelector('.kbd-input');
        const list = palette.querySelector('.kbd-list');
        let results = [], sel = 0;

        function paint() {
            list.innerHTML = results.map((r, i) => `
                <div class="kbd-item ${i === sel ? 'sel' : ''}" data-i="${i}">
                    <i class="fas ${r.icon}"></i>
                    <div><b>${r.title}</b><small>${r.desc || ''}</small></div>
                    <span class="kbd-tag">${r.tag}</span>
                </div>`).join('') || '<div class="empty-state" style="padding:24px"><i class="fas fa-ghost"></i>Nada por aqui…</div>';
        }
        function go(i) {
            const r = results[i]; if (!r) return;
            if (r.href) location.href = r.href;
            else if (r.action) r.action();
        }
        input.addEventListener('input', () => {
            const q = norm(input.value.trim());
            const base = [];
            (window.__ER_PAGES__ || []).forEach(p => base.push({ icon: p.icon, title: p.title, desc: p.desc, tag: 'Pagina', href: p.href }));
            (window.__ER_INDEX__ || []).forEach(x => base.push(x));
            results = q ? base.filter(x => norm(x.title + ' ' + (x.desc || '')).includes(q)).slice(0, 14) : base.slice(0, 12);
            sel = 0; paint();
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, results.length - 1); paint(); e.preventDefault(); }
            if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); paint(); e.preventDefault(); }
            if (e.key === 'Enter') go(sel);
        });
        list.addEventListener('click', e => { const it = e.target.closest('.kbd-item'); if (it) go(+it.dataset.i); });
        palette.addEventListener('click', e => { if (e.target === palette) closePalette(); });
        return palette;
    }
    function openPalette() {
        ensurePalette();
        palette.classList.add('open');
        const input = palette.querySelector('.kbd-input');
        input.value = ''; input.dispatchEvent(new Event('input'));
        setTimeout(() => input.focus(), 30);
    }
    function closePalette() { palette && palette.classList.remove('open'); }
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
        if (e.key === 'Escape') closePalette();
    });

    /* ---------- 4) INDICE VIVO (roster + eventos + loot) ---------- */
    async function buildLiveIndex() {
        try {
            const { erDbReady } = await import('./firebase-init.js');
            const { collection, getDocs } = await import('firebase/firestore');
            const { db } = await erDbReady();
            const idx = [];
            try {
                const users = await getDocs(collection(db, 'users'));
                users.forEach(d => {
                    const u = d.data();
                    if (u._mergedInto || !u.mainName) return;
                    idx.push({ icon: 'fa-user-ninja', title: u.mainName, desc: `${u.wowClass || 'Clase'} · ${u.role || 'Iniciado'} · DKP ${u.dkp ?? 0}`, tag: 'Segador', href: 'dkp.html' });
                });
            } catch (e) { /* sin permisos de list: ok */ }
            try {
                const evs = await getDocs(collection(db, 'raid_events'));
                evs.forEach(d => { const v = d.data(); idx.push({ icon: 'fa-calendar-check', title: v.name, desc: `Raid · ${v.time || ''}`, tag: 'Evento', href: 'index.html' }); });
            } catch (e) { }
            try {
                const news = await getDocs(collection(db, 'news'));
                news.forEach(d => { const v = d.data(); idx.push({ icon: 'fa-scroll', title: v.title, desc: 'Edicto de ' + (v.authorName || 'la Hermandad'), tag: 'Edicto', href: 'index.html' }); });
            } catch (e) { }
            window.__ER_INDEX__ = idx;
        } catch (e) { console.warn('[shell] indice vivo no disponible:', e.message); }
    }

    /* ---------- 5) SESION EN EL HEADER ---------- */
    async function paintSession() {
        try {
            const { onAuthStateChanged } = await import('firebase/auth');
            const { doc, getDoc } = await import('firebase/firestore');
            const { erDbReady } = await import('./firebase-init.js');
            const { auth, db } = await erDbReady();
            onAuthStateChanged(auth, async (u) => {
                const nameEl = document.getElementById('er-username');
                const avEl = document.getElementById('er-avatar');
                const chip = document.getElementById('er-user-chip');
                if (!u) {
                    if (nameEl) nameEl.textContent = 'Entrar';
                    if (avEl) { avEl.outerHTML = '<span class="avatar-fallback" id="er-avatar"><i class="fas fa-key"></i></span>'; }
                    if (chip) chip.href = 'login.html';
                    document.body.classList.remove('er-is-admin');
                    window.__ER_SESSION__ = null;
                    return;
                }
                let profile = null;
                try {
                    const snap = await getDoc(doc(db, 'users', u.uid));
                    if (snap.exists()) {
                        profile = snap.data();
                        if (profile._mergedInto) {
                            const c = await getDoc(doc(db, 'users', profile._mergedInto));
                            if (c.exists()) profile = Object.assign({}, c.data(), { _legacyId: snap.id });
                        }
                    }
                } catch (e) { }
                profile = profile || {};
                profile.email = u.email;
                window.__ER_SESSION__ = { user: u, profile };
                const nm = profile.mainName || u.displayName || u.email.split('@')[0];
                if (nameEl) nameEl.textContent = nm;
                if (chip) {
                    chip.href = 'index.html#perfil';
                    chip.onclick = (ev) => {
                        ev.preventDefault();
                        showUserMenu(chip, u, profile);
                    };
                }
                if (avEl) {
                    if (profile.avatarUrl) avEl.outerHTML = `<img id="er-avatar" src="${profile.avatarUrl}" alt="">`;
                    else { avEl.textContent = nm.charAt(0).toUpperCase(); }
                }
                document.body.classList.toggle('er-is-admin', profile.role === 'GM' || profile.role === 'Oficial');
                buildLiveIndex();
            });
        } catch (e) { console.warn('[shell] sesion no verificable:', e.message); }
    }

    /* Menu desplegable del usuario (modal compacto) */
    function showUserMenu(anchor, u, profile) {
        const initial = (profile.mainName || u.email).charAt(0).toUpperCase();
        window.erModal({
            title: profile.mainName || u.displayName || u.email,
            icon: 'fa-user-ninja',
            size: 'sm',
            body: `
                <div class="flex" style="gap:14px;margin-bottom:14px">
                    <span class="avatar-fallback" style="width:52px;height:52px;font-size:1.4rem;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold-dim),#5a4300);color:#000;font-weight:900">${initial}</span>
                    <div>
                        <b>${profile.wowClass || 'Sin clase'}</b><br>
                        <span class="badge gold">${profile.role || 'Iniciado'}</span>
                        <div class="muted small" style="margin-top:6px">${profile.realm || ''} · DKP: <b class="gold">${profile.dkp ?? 0}</b></div>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="list-row"><i class="fas fa-envelope muted"></i><span class="grow muted small">${u.email}</span></div>`,
            actions: [
                { label: 'Mi perfil', icon: 'fa-id-card', style: 'ghost', onClick: close => { location.href = 'index.html#perfil'; close(); } },
                { label: 'Salir', icon: 'fa-right-from-bracket', style: 'danger', onClick: async close => {
                    const { signOut } = await import('firebase/auth');
                    const { erDbReady } = await import('./firebase-init.js');
                    const { auth } = await erDbReady();
                    await signOut(auth);
                    window.erToast('Sesion cerrada. Hasta la proxima cosecha 🌾', 'info');
                    close(); setTimeout(() => location.reload(), 700);
                }}
            ]
        });
    }

    /* ---------- BOOT ---------- */
    function boot() {
        buildHeader();
        paintSession();
        if (!window.__ER_INDEX__) setTimeout(buildLiveIndex, 1500);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
