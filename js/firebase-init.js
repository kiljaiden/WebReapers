/* =========================================================
   firebase-init.js — Conexión con Firebase (v10 ESM) · 100% estático
   ---------------------------------------------------------
   Mejoras respecto a la versión anterior (que fallaba en Netlify):
   · El importmap se escribe ANTES de importar ningún módulo.
   · Reintento automático si gstatic tarda o falla.
   · Si Firebase no arranca, se emite 'er-firebase-error' y las
     páginas muestran un aviso claro (antes se quedaban en blanco).
   · Expone window.FB / window.AUTH / window.DB + erDbReady().
   ========================================================= */
(function () {
    const CFG = window.__FIREBASE_CONFIG__;
    if (!CFG || !CFG.apiKey) {
        console.error('[ER] Falta window.__FIREBASE_CONFIG__ (¿config.js cargado?)');
        document.dispatchEvent(new CustomEvent('er-firebase-error', { detail: { code: 'no-config' } }));
        return;
    }
    /* Normaliza valores vacíos para evitar errores internos del SDK */
    ['databaseURL', 'measurementId', 'storageBucket'].forEach(k => { if (!CFG[k]) delete CFG[k]; });

    const V = window.__ER_FIREBASE_VERSION__ || '10.12.3';
    const BASE = 'https://www.gstatic.com/firebasejs/' + V + '/';

    /* importmap debe existir antes de cualquier import dinámico */
    if (!document.querySelector('script[type="importmap"]')) {
        const im = document.createElement('script');
        im.type = 'importmap';
        im.textContent = JSON.stringify({
            imports: {
                'firebase/app': BASE + 'firebase-app.js',
                'firebase/auth': BASE + 'firebase-auth.js',
                'firebase/firestore': BASE + 'firebase-firestore.js'
            }
        });
        document.head.appendChild(im);
    }

    let intentos = 0;
    async function boot() {
        intentos++;
        try {
            const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
                import('firebase/app'),
                import('firebase/auth'),
                import('firebase/firestore')
            ]);
            const app = initializeApp(CFG);
            window.FB = app;
            window.AUTH = getAuth(app);
            window.DB = getFirestore(app);
            /* persistencia de sesión entre recargas/dispositivos */
            try {
                const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
                await setPersistence(window.AUTH, browserLocalPersistence);
            } catch (e) { /* si ya había listeners, da igual: localStorage es el default */ }
            window.dispatchEvent(new Event('er-firebase-ready'));
            console.info('[ER] Firebase conectado ✔ (' + CFG.projectId + ')');
        } catch (err) {
            console.error('[ER] Intento ' + intentos + ' de conexión Firebase falló:', err);
            if (intentos < 3) setTimeout(boot, 1500 * intentos);
            else document.dispatchEvent(new CustomEvent('er-firebase-error', { detail: { code: 'sdk', err } }));
        }
    }
    boot();
})();

/** Espera a que la BD esté lista: const { auth, db } = await erDbReady(); */
window.erDbReady = function () {
    return new Promise((resolve, reject) => {
        const t0 = Date.now();
        const check = () => {
            if (window.AUTH && window.DB) return resolve({ fb: window.FB, auth: window.AUTH, db: window.DB });
            if (Date.now() - t0 > 25000) return reject(new Error('Firebase no respondió (¿sin internet o dominio no autorizado?).'));
            setTimeout(check, 60);
        };
        check();
    });
};
