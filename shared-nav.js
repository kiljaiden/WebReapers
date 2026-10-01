/* =========================================================
   shared-nav.js  —  NAVEGACIÓN Y USUARIO COMPARTIDOS
   =========================================================
   Inyecta en todas las páginas el mismo menú superior
   (Inicio · SoftReserve · DKP · Misiones Legendarias · Workshop · Panel Admin)
   y muestra/oculta el enlace de administración según el rol del usuario
   guardado en Firestore (colección "users": role === 'GM' u 'Oficial').

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
    // Clases decorativas extra definidas por la pagina via data-extra-class (p.ej. sonidos)
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

// Comprobar rol contra la Base de Datos en línea
(async () => {
    try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { doc, getDoc } = await import('firebase/firestore');
        const { auth, db } = await new Promise(res => {
            const chk = () => (window.AUTH && window.DB) ? res({}) : setTimeout(chk, 50);
            chk();
        }).then(() => ({ auth: window.AUTH, db: window.DB }));

        onAuthStateChanged(auth, async (user) => {
            let isAdmin = false;
            if (user) {
                try {
                    const snap = await getDoc(doc(db, 'users', user.uid));
                    if (snap.exists()) {
                        const role = snap.data().role;
                        isAdmin = (role === 'GM' || role === 'Oficial');
                    }
                } catch (e) { /* permisos de lectura insuficientes: no mostrar admin */ }
            }
            renderNav(isAdmin);
        });
    } catch (e) {
        console.warn('[shared-nav] No se pudo verificar el rol:', e.message);
    }
})();
