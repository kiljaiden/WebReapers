/* =========================================================
   shared-auth.js — IDENTIDAD UNICA POR USUARIO (anti-duplicados)
   =========================================================
   Regla de oro: 1 persona = 1 cuenta Firebase = 1 ID (uid).
   - El documento de perfil SIEMPRE vive en users/{uid}.
   - Nunca se crea un segundo registro para el mismo correo.
   - window.erEnsureUserDoc(auth, db, uid, profile):
       * Si users/{uid} ya existe -> NO duplica, solo completa
         campos nuevos y registra alias de correos.
       * Si existe un perfil viejo con el MISMO email pero otro
         uid (cuenta duplicada historica) -> lo MIGRA al uid real
         (mueve DKP, rol, mainName...) y marca el viejo con
         _mergedInto para que las webs lo ignoren.
   Se usa desde login.html y panel.html. Depende de er-db.js.
   ========================================================= */
(function () {
    function normEmail(e) { return String(e || '').trim().toLowerCase(); }

    async function findProfileByEmail(db, firestore, email) {
        const { collection, getDocs, query, where } = firestore;
        const snap = await getDocs(query(collection(db, 'users'), where('emailLower', '==', email)));
        if (!snap.empty) return snap.docs[0];
        // perfiles antiguos sin emailLower
        const all = await getDocs(collection(db, 'users'));
        let hit = null;
        all.forEach(d => {
            const dt = d.data();
            if (normEmail(dt.email) === email && !dt._mergedInto) hit = d;
        });
        return hit;
    }

    /**
     * Garantiza UN solo documento users/{uid} por persona.
     * @returns {Promise<'created'|'updated'|'migrated'>}
     */
    window.erEnsureUserDoc = async function (auth, db, uid, profile) {
        const firestore = await import('firebase/firestore');
        const { doc, getDoc, setDoc, deleteDoc } = firestore;
        const email = normEmail(profile.email || auth.currentUser?.email);

        const base = Object.assign({}, profile, {
            uid: uid,                       // id canónico = Firebase Auth uid
            email: profile.email,
            emailLower: email,
            updatedAt: Date.now()
        });
        delete base.id;

        // ¿Existe un perfil DUPLICADO con el mismo correo bajo otro uid?
        if (email) {
            try {
                const old = await findProfileByEmail(db, firestore, email);
                if (old && old.id !== uid) {
                    const od = old.data();
                    const merged = Object.assign({}, od, base);
                    // conservar DKP/roles existentes del registro viejo (mas antiguo manda en datos de juego)
                    merged.dkpEarned = od.dkpEarned ?? base.dkpEarned ?? 0;
                    merged.dkpSpent  = od.dkpSpent  ?? base.dkpSpent  ?? 0;
                    merged.mainName  = od.mainName  || base.mainName;
                    merged.role      = od.role      || base.role || 'Iniciado';
                    await setDoc(doc(db, 'users', uid), merged, { merge: true });
                    // marcar el viejo como fusionado (no borrar de golpe: historial)
                    await setDoc(doc(db, 'users', old.id), { _mergedInto: uid }, { merge: true });
                    return 'migrated';
                }
            } catch (e) { console.warn('[erEnsureUserDoc] chequeo de duplicados:', e.message); }
        }

        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
            await setDoc(doc(db, 'users', uid), base, { merge: true });
            return 'updated';
        }
        await setDoc(doc(db, 'users', uid), Object.assign({ createdAt: Date.now() }, base), { merge: false });
        return 'created';
    };

    /** Traduce errores de Firebase Auth a mensajes claros en español. */
    window.erAuthError = function (code) {
        const map = {
            'auth/invalid-credential': 'Correo o contraseña incorrectos.',
            'auth/user-not-found': 'Ese correo no está registrado.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión en vez de registrarte.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
            'auth/invalid-email': 'El correo no es válido.',
            'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
            'auth/popup-blocked': 'Tu navegador bloqueó la ventana emergente de Google.',
            'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Auth (añádelo en Console > Authentication > Settings > Authorized domains).',
            'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
            'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.'
        };
        return map[code] || ('Error: ' + (code || 'desconocido'));
    };
})();
