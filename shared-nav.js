/* =========================================================
   shared-nav.js  —  NAVEGACIÓN, USUARIO Y SESIÓN COMPARTIDOS
   =========================================================
   - Inyecta el mismo menú superior en todas las páginas.
   - Muestra sesión real: nombre del main + avatar + botón Salir
     (datos leídos de Firebase Auth + Firestore, colección "users").
   - El enlace Panel Admin solo aparece para roles GM / Oficial.

   Cada página debe tener:  <nav class="top-nav" id="er-top-nav"></nav>
   ========================================================= */

const PAGES = [
    { href: 'index.html',      icon: 'fa-home',       label: 'Inicio',               adminOnly: false },
    { href: 'softreserve.html',icon: 'fa-hand-paper', label: 'SoftReserve',          adminOnly: false },
    { href: 'dkp.html',        icon: 'fa-coins',      label: 'DKP System',           adminOnly: false },
    { href: 'apply.html',      icon: 'fa-dragon',     label: 'Misiones Legendarias', adminOnly: false },
    { href: 'talentos.html',   icon: 'fa-brain',      label: 'Talentos',             adminOnly: false },
    { href: 'comunidad.html',  icon: 'fa-store',      label: 'Workshop',             adminOnly: false },
    { href: 'panel.html',      icon: 'fa-cogs',       label: 'Panel Admin',          adminOnly: true },
];

function currentPageName() {
    let p = location.pathname.split('/').pop();
    if (!p || p === '') p = 'index.html';
    return p;
}

function renderNav(showAdmin) {
    const nav = document.getElementById('er-top-nav');
    if (!nav) return;
    const here = currentPageName();
    const extraClass = nav.getAttribute('data-extra-class') || '';
    nav.innerHTML = '';
    PAGES.forEach(pg => {
        if (pg.adminOnly && !showAdmin) return;
        const a = document.createElement('a');
        a.href = pg.href;
        a.title = pg.label;
        let cls = extraClass.trim().split(/\s+/).filter(Boolean);
        if (pg.href === here) cls.push('active');
        if (cls.length) a.className = cls.join(' ');
        a.innerHTML = `<i class="fas ${pg.icon}"></i> ${pg.label}`;
        nav.appendChild(a);
    });
}

// Render inicial sin saber el rol (mantiene el diseño estable al cargar)
renderNav(false);

// Sincronizar el bloque de usuario de la topbar (si la pagina lo tiene)
function paintUser(user) {
    const nameEl = document.getElementById('user-name');
    const avEl   = document.getElementById('user-avatar');
    if (nameEl) nameEl.innerText = user ? (user.mainName || user.email.split('@')[0]) : 'Iniciar Sesión';
    if (avEl && user && user.avatarUrl) avEl.src = user.avatarUrl;
    // Boton de logout flotante junto al menu de usuario
    const menu = document.getElementById('user-menu-btn');
    if (menu) {
        let out = document.getElementById('er-logout');
        if (user && !out) {
            out = document.createElement('i');
            out.id = 'er-logout';
            out.className = 'fas fa-right-from-bracket';
            out.title = 'Cerrar sesión';
            out.style.cssText = 'cursor:pointer;color:#858b99;font-size:1rem;padding:6px;transition:.2s;';
            out.onmouseenter = () => out.style.color = '#f8b700';
            out.onmouseleave = () => out.style.color = '#858b99';
            menu.parentElement.appendChild(out);
            import('firebase/auth').then(({ signOut }) =>
                import('./firebase-init.js').then(m => m.erDbReady()).then(({ auth }) =>
                    out.onclick = async () => { await signOut(auth); location.href = 'login.html'; }));
        } else if (!user && out) out.remove();
    }
}

// Comprobar sesión y rol contra la Base de Datos en línea
(async () => {
    try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { doc, getDoc } = await import('firebase/firestore');
        const { erDbReady } = await import('./firebase-init.js');
        const { auth, db } = await erDbReady();

        onAuthStateChanged(auth, async (u) => {
            let isAdmin = false, profile = null;
            if (u) {
                try {
                    const snap = await getDoc(doc(db, 'users', u.uid));
                    if (snap.exists()) {
                        profile = snap.data();
                        profile.email = u.email;
                        isAdmin = (profile.role === 'GM' || profile.role === 'Oficial');
                    }
                } catch (e) { /* permisos insuficientes: no mostrar admin */ }
            }
            paintUser(profile || (u ? { email: u.email } : null));
            renderNav(isAdmin);
        });
    } catch (e) {
        console.warn('[shared-nav] No se pudo verificar la sesión:', e.message);
    }
})();
