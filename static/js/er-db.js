/* =========================================================
   er-db.js — CAPA DE DATOS OFFLINE-FIRST (Firestore + caché local)
   Fuente de verdad: Firebase Firestore · espejo en localStorage.
   API: erGet / erSet / erAdd / erDel / erWatch / erWatchSession
   ========================================================= */
(function () {
    const NS = 'er_cache_';

    function readCache(name) {
        try { return JSON.parse(localStorage.getItem(NS + name)) || null; } catch (e) { return null; }
    }
    function writeCache(name, data) {
        try { localStorage.setItem(NS + name, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
    }
    async function mods() {
        const firestore = await import('firebase/firestore');
        const db = window.DB;
        if (!db) throw new Error('Firestore aún no listo');
        return { db, ...firestore };
    }
    function buildQuery(fs, name, opts) {
        let ref = fs.collection(fs.db, name);
        if (opts.where && opts.where.length) ref = fs.query(ref, ...opts.where.map(([f, op, v]) => fs.where(f, op, v)));
        if (opts.orderBy) ref = fs.query(ref, ...(Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy]).map(o => fs.orderBy(o.field, o.dir || 'asc')));
        if (opts.limit) ref = fs.query(ref, fs.limit(opts.limit));
        return ref;
    }

    /** Lectura de colección con caché de respaldo. */
    window.erGet = async function (name, opts = {}) {
        try {
            const fs = await mods();
            const snap = await fs.getDocs(buildQuery(fs, name, opts));
            const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
            writeCache(name, rows);
            setNet(true);
            return { rows, fromCache: false };
        } catch (e) {
            const c = readCache(name);
            setNet(!!c);
            if (c) return { rows: c.d, fromCache: true };
            throw e;
        }
    };

    /** Escribe/actualiza un documento (merge por defecto). */
    window.erSet = async function (name, id, data, merge = true) {
        const { db, doc, setDoc } = await mods();
        const clean = {};
        for (const k in data) if (!(data[k] && typeof data[k] === 'object' && data[k]._methodName)) clean[k] = data[k];
        await setDoc(doc(db, name, id), clean, { merge });
        const c = readCache(name);
        if (c) {
            const rows = c.d.filter(r => r.id !== id);
            rows.push(Object.assign({ id }, clean));
            writeCache(name, rows);
        }
    };

    /** Alta con ID automático. Devuelve el id. */
    window.erAdd = async function (name, data) {
        const { db, collection, addDoc } = await mods();
        const ref = await addDoc(collection(db, name), data);
        const c = readCache(name);
        if (c) { c.d.push(Object.assign({ id: ref.id }, data)); writeCache(name, c.d); }
        return ref.id;
    };

    /** Borrón y cuenta nueva (para el Consejo). */
    window.erDel = async function (name, id) {
        const { db, doc, deleteDoc } = await mods();
        await deleteDoc(doc(db, name, id));
        const c = readCache(name);
        if (c) writeCache(name, c.d.filter(r => r.id !== id));
    };

    /** Suscripción EN VIVO (onSnapshot). Devuelve stop(). */
    window.erWatch = async function (name, cb, opts = {}) {
        const fs = await mods();
        const ref = buildQuery(fs, name, opts);
        return fs.onSnapshot(ref, snap => {
            const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
            writeCache(name, rows);
            setNet(true);
            cb(rows, { fromCache: false });
        }, err => {
            const c = readCache(name);
            setNet(!!c);
            cb(c ? c.d : [], { fromCache: !!c, error: err });
        });
    };

    /** Sesión actual + perfil users/{uid} en vivo. cb(user|null). */
    window.erWatchSession = async function (cb) {
        const { auth } = await window.erDbReady();
        const { onAuthStateChanged } = await import('firebase/auth');
        let stopData = () => {};
        onAuthStateChanged(auth, u => {
            stopData();
            window.ER && (window.ER.ME = u);
            if (!u) { cb(null); return; }
            erWatch('users', rows => {
                const me = rows.find(r => r.id === u.uid && !r._mergedInto) || null;
                cb(me || { uid: u.uid, email: u.email, role: 'Iniciado', mainName: u.displayName || (u.email || '').split('@')[0] });
            }).then(s => stopData = s).catch(() => cb({ uid: u.uid, email: u.email, role: 'Iniciado' }));
        });
    };

    window.erCacheAge = name => { const c = readCache(name); return c ? new Date(c.t) : null; };

    /* Indicador de red del navbar */
    function setNet(on) {
        const dot = document.getElementById('erNetDot');
        if (dot) { dot.classList.toggle('on', !!on); dot.classList.toggle('off', !on); }
    }

    /* Identidad única anti-duplicados (users/{uid}) — portada de shared-auth.js */
    const normEmail = e => String(e || '').trim().toLowerCase();
    window.erEnsureUserDoc = async function (auth, db, uid, profile) {
        const { doc, getDoc, setDoc, collection, getDocs, query, where } = await mods();
        const email = normEmail(profile.email || auth.currentUser?.email);
        const base = Object.assign({}, profile, { uid, email, emailLower: email, updatedAt: Date.now() });
        delete base.id;
        if (email) {
            try {
                let hit = null;
                const snap = await getDocs(query(collection(db, 'users'), where('emailLower', '==', email)));
                if (!snap.empty) hit = snap.docs[0];
                if (hit && hit.id !== uid) {
                    const od = hit.data();
                    const merged = Object.assign({}, od, base);
                    merged.dkpEarned = od.dkpEarned ?? base.dkpEarned ?? 0;
                    merged.dkpSpent = od.dkpSpent ?? base.dkpSpent ?? 0;
                    merged.mainName = od.mainName || base.mainName;
                    merged.role = od.role || base.role || 'Iniciado';
                    await setDoc(doc(db, 'users', uid), merged, { merge: true });
                    await setDoc(doc(db, 'users', hit.id), { _mergedInto: uid }, { merge: true });
                    return 'migrated';
                }
            } catch (e) { console.warn('[erEnsureUserDoc]', e.message); }
        }
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) { await setDoc(doc(db, 'users', uid), base, { merge: true }); return 'updated'; }
        await setDoc(doc(db, 'users', uid), Object.assign({ createdAt: Date.now() }, base), { merge: false });
        return 'created';
    };
})();
