/* =========================================================
   er-db.js — CAPA DE DATOS OFFLINE-FIRST (Firestore + cache)
   =========================================================
   - Lee/escribe contra Firebase Firestore (fuente de verdad).
   - Espeja automaticamente en localStorage para que la web
     funcione SIN INTERNET (modo PWA offline).
   - Suscripciones en vivo con onSnapshot (tiempo real).
   Uso:
     const { rows, fromCache } = await erGet('users');
     await erSet('users', uid, { dkp: 10 });
     const id = await erAdd('news', { title: '…' });
     const stop = erWatch('raid_events', rows => render(rows));
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
        const firestore = await import('firebase/firestore');
        const db = window.DB;
        if (!db) throw new Error('Firestore aun no listo');
        return { db, ...firestore };
    }

    /** Lee una coleccion entera (o un query) con cache local de respaldo. */
    window.erGet = async function (name, opts = {}) {
        try {
            const { db, collection, getDocs, query, where: w, orderBy } = await mods();
            let ref = collection(db, name);
            if (opts.where && opts.where.length) ref = query(ref, ...opts.where.map(([f, op, v]) => w(f, op, v)));
            if (opts.orderBy) ref = query(ref, ...(Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy]).map(o => orderBy(o.field, o.dir || 'asc')));
            const snap = await getDocs(ref);
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
            const clean = {};
            for (const k in data) if (data[k] && typeof data[k] === 'object' && data[k]._methodName) continue; else clean[k] = data[k];
            rows.push(Object.assign({}, rows.find(() => false), { id }, clean));
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

    /** Borra un documento y lo retira de la cache. */
    window.erDel = async function (name, id) {
        const { db, doc, deleteDoc } = await mods();
        await deleteDoc(doc(db, name, id));
        const c = readCache(name);
        if (c) writeCache(name, c.d.filter(r => r.id !== id));
    };

    /**
     * Suscripcion EN VIVO a una coleccion (tiempo real).
     * Devuelve funcion stop(). Si falla la conexion usa la cache.
     */
    window.erWatch = async function (name, cb, opts = {}) {
        const { db, collection, onSnapshot, query, where: w, orderBy } = await mods();
        let ref = collection(db, name);
        if (opts.where && opts.where.length) ref = query(ref, ...opts.where.map(([f, op, v]) => w(f, op, v)));
        if (opts.orderBy) ref = query(ref, ...(Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy]).map(o => orderBy(o.field, o.dir || 'asc')));
        return onSnapshot(ref, snap => {
            const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
            writeCache(name, rows);
            cb(rows, { fromCache: false });
        }, err => {
            const c = readCache(name);
            cb(c ? c.d : [], { fromCache: !!c, error: err });
        });
    };

    window.erCacheAge = function (name) {
        const c = readCache(name);
        return c ? new Date(c.t) : null;
    };
})();
