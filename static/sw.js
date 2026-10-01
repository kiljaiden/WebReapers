/* SW mínimo: red primero, caché como respaldo offline (PWA) */
const CACHE = 'eternal-reapers-v2';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
    e.respondWith(
        fetch(req).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
            return res;
        }).catch(() => caches.match(req).then(hit => hit || new Response('<h1 style="font-family:sans-serif">Sin conexión — la cripta está en silencio.</h1>', { headers: { 'Content-Type': 'text/html' } })))
    );
});
