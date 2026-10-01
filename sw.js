/* =========================================================
   sw.js — SERVICE WORKER "ETERNAL REAPERS" (PWA offline)
   Estrategias:
   - Cache-first para la app shell (HTML/CSS/JS/manifest/iconos)
   - Network-first para datos y recursos externos (CDN, Firebase)
   - Fallback offline -> index.html
   ========================================================= */
const VERSION = 'er-v5';
const SHELL = [
    './', 'index.html', 'login.html', 'softreserve.html', 'dkp.html',
    'apply.html', 'comunidad.html', 'panel.html',
    'shared-design.css', 'shared-nav.js', 'shared-ui.js', 'shared-theme.js', 'er-db.js',
    'firebase-config.js', 'firebase-init.js',
    'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Datos de Firebase: nunca interceptar (Firestore usa su propia red)
    if (url.origin.includes('firestore.googleapis.com') ||
        url.origin.includes('identitytoolkit.googleapis.com') ||
        url.hostname.endsWith('.firebaseapp.com')) return;

    // App shell local: cache-first con actualizacion en segundo plano
    if (url.origin === location.origin) {
        e.respondWith(
            caches.match(req).then(hit => {
                const fetchd = fetch(req).then(res => {
                    if (res && res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
                    return res;
                }).catch(() => hit);
                return hit || fetchd;
            }).catch(() => caches.match('index.html'))
        );
        return;
    }

    // Externos (CDNs, fuentes, imagenes): network-first con cache
    e.respondWith(
        fetch(req).then(res => {
            if (res && (res.ok || res.type === 'opaque')) {
                const clone = res.clone();
                caches.open(VERSION + '-ext').then(c => c.put(req, clone));
            }
            return res;
        }).catch(() => caches.match(req))
    );
});
