/* =========================================================
   er-db.js — CAPA DE DATOS OFFLINE-FIRST (BD en linea + cache)
   =========================================================
   - Lee/escribe contra Firebase Firestore (fuente de verdad).
   - Espeja automaticamente en localStorage para que la web
     funcione SIN INTERNET (modo PWA offline).
   - Uso: const { rows, fromCache } = await erGet('users');
   Se carga con <script src="er-db.js" defer></script>.
   ========================================================= */
(function () {
    const NS = 'er_cache_';

    function readCache(name) {
        try { return JSON.parse(localStorage.getItem(NS + name)) || null; } catch (e) { return null; }
    }
    function writeCache(name, data) {
        try { localStorage.setItem(NS + name, JSON.stringify({ t: Date.now(), d: data })); } catch (e) { /* quota */ }
    }
    async function mods() {
        const { erDbReady } = await import('./firebase-init.js');
        const firestore = await import('firebase/firestore');
        const { db } = await erDbReady();
        return { db, ...firestore };
    }

    /** Lee una coleccion entera (o un query) con cache local de respaldo. */
    window.erGet = async function (name, opts = {}) {
        try {
            const { db, collection, getDocs } = await mods();
            const snap = await getDocs(collection(db, name));
            const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
            writeCache(name, rows);
            return { rows, fromCache: false };
        } catch (e) {
            const c = readCache(name);
            if (c) return { rows: c.d, fromCache: true };
            throw e;
        }
    };

    /** Escribe/actualiza un documento y refresca la cache local. */
    window.erSet = async function (name, id, data, merge = true) {
        const { db, doc, setDoc } = await mods();
        await setDoc(doc(db, name, id), data, { merge });
        const c = readCache(name);
        if (c) {
            const rows = c.d.filter(r => r.id !== id);
            rows.push(Object.assign({ id }, data));
            writeCache(name, rows);
        }
    };

    /** Anade un documento con ID automatico. Devuelve el id. */
    window.erAdd = async function (name, data) {
        const { db, collection, addDoc } = await mods();
        const ref = await addDoc(collection(db, name), data);
        const c = readCache(name);
        if (c) { c.d.push(Object.assign({ id: ref.id }, data)); writeCache(name, c.d); }
        return ref.id;
    };

    window.erCacheAge = function (name) {
        const c = readCache(name);
        return c ? new Date(c.t) : null;
    };
})();
