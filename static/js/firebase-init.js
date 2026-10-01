/* =========================================================
   firebase-init.js — Conexión única con Firebase (v10 ESM)
   Proyecto: eternalreapersweb (MISMA base de datos que la web anterior)
   Expone window.FB / window.AUTH / window.DB y el evento 'er-firebase-ready'
   ========================================================= */
(function loadFirebaseSdk() {
    const V = '10.8.1';
    const BASE = `https://www.gstatic.com/firebasejs/${V}/`;
    if (!document.querySelector('script[type="importmap"]')) {
        const importMap = document.createElement('script');
        importMap.type = 'importmap';
        importMap.textContent = JSON.stringify({
            imports: {
                'firebase/app': BASE + 'firebase-app.js',
                'firebase/auth': BASE + 'firebase-auth.js',
                'firebase/firestore': BASE + 'firebase-firestore.js'
            }
        });
        document.head.appendChild(importMap);
    }
    const mod = document.createElement('script');
    mod.type = 'module';
    mod.textContent = `
        import { initializeApp } from '${BASE}firebase-app.js';
        import { getAuth } from '${BASE}firebase-auth.js';
        import { getFirestore } from '${BASE}firebase-firestore.js';
        const app = initializeApp(window.__FIREBASE_CONFIG__);
        window.FB = app;
        window.AUTH = getAuth(app);
        window.DB = getFirestore(app);
        window.dispatchEvent(new Event('er-firebase-ready'));
    `;
    document.head.appendChild(mod);
})();

/** Espera a que la BD esté lista: const { auth, db } = await erDbReady(); */
function erDbReady() {
    return new Promise((resolve) => {
        const check = () => {
            if (window.AUTH && window.DB) resolve({ fb: window.FB, auth: window.AUTH, db: window.DB });
            else setTimeout(check, 50);
        };
        check();
    });
}
window.erDbReady = erDbReady;
