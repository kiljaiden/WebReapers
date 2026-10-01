/* =========================================================
   firebase-init.js  —  CONFIGURACIÓN CENTRAL DE FIRESTORE
   =========================================================
   Punto único de conexión con la Base de Datos en línea
   (Firebase Firestore) para TODAS las páginas del sitio.

   Para cambiar de proyecto BD: edita SOLO este archivo.
   Las páginas usan las variables globales: window.FB, window.AUTH, window.DB
   ========================================================= */

// Carga dinámica de los SDK de Firebase (v10.8.1, módulos ESM)
(function loadFirebaseSdk() {
    const V = '10.8.1';
    const BASE = `https://www.gstatic.com/firebasejs/${V}/`;

    // 1) Import map para que las páginas puedan usar "firebase/..." como specifier
    const existing = document.querySelector('script[type="importmap"]');
    if (!existing) {
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

    // 2) Inicializar App / Auth / Firestore una sola vez por página
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

/**
 * Espera a que la conexión con la BD esté lista.
 * Uso dentro de un <script type="module">:
 *   const { auth, db } = await erDbReady();
 */
export function erDbReady() {
    return new Promise((resolve) => {
        const check = () => {
            if (window.AUTH && window.DB) resolve({ fb: window.FB, auth: window.AUTH, db: window.DB });
            else setTimeout(check, 50);
        };
        check();
    });
}
