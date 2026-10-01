/* ETERNAL REAPERS · Service Worker (PWA) — red primero, caché de respaldo */
const CACHE = 'eternal-reapers-v3-static';
const PRECACHE = ['./', 'index.html', 'acceso.html', 'dkp.html', 'softreserve.html',
                  'leyendas.html', 'taller.html', 'consejo.html',
                  'css/reapers.css', 'js/config.js', 'js/firebase-init.js',
                  'js/er-db.js', 'js/er-ui.js'];
self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {}));
});
self.addEventListener('activate', e => e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
    /* nunca cachear llamadas a Firebase: siempre frescas */
    if (/firestore|identitytoolkit|securetoken|googleapis/.test(req.url)) return;
    e.respondWith(
        fetch(req).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
            return res;
        }).catch(() => caches.match(req).then(hit => hit ||
            new Response('<h1 style="font-family:sans-serif;background:#04060a;color:#4ee6a8;padding:40px">☠ Sin conexión — la cripta está en silencio.</h1>',
                { headers: { 'Content-Type': 'text/html' } })))
    );
});
