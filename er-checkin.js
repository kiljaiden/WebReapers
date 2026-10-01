/* =========================================================
   er-checkin.js — CHECK-IN DIARIO DE ASISTENCIA
   - Boton flotante "🔥 Check-in" en todas las paginas.
   - Racha de dias consecutivos + bonus DKP automatico:
       1-2 dias: +5 | 3-6: +10 | 7-13: +20 | 14+: +30 DKP
   - Escribe en Firestore: checkins/{uid}_{fecha} y suma el
     bonus al documento users/{uid} (campo dkp). Offline-safe:
     si no hay red, encola en localStorage y reenvia despues.
   ========================================================= */
(function () {
    const KEY_LAST = 'er_checkin_last';
    const KEY_STREAK = 'er_checkin_streak';
    const KEY_QUEUE = 'er_checkin_queue';
    const todayStr = () => new Date().toISOString().slice(0, 10);
    const yesterdayStr = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

    function bonusFor(streak) {
        if (streak >= 14) return 30;
        if (streak >= 7) return 20;
        if (streak >= 3) return 10;
        return 5;
    }

    async function sessionUid() {
        try {
            const auth = window.AUTH;
            if (!auth) return null;
            if (auth.currentUser) return auth.currentUser.uid;
            return new Promise(res => {
                const off = auth.onAuthStateChanged(u => { off(); res(u ? u.uid : null); });
            });
        } catch (e) { return null; }
    }

    /** Lee/ocupa la capa er-db.js aunque la pagina no la haya incluido. */
    async function ensureErDb() {
        if (window.erSet) return;
        await import('./er-db.js');
    }

    async function flushQueue(uid) {
        let q = [];
        try { q = JSON.parse(localStorage.getItem(KEY_QUEUE)) || []; } catch (e) {}
        if (!q.length) return;
        localStorage.removeItem(KEY_QUEUE);
        for (const item of q) {
            try {
                await window.erSet('checkins', uid + '_' + item.date,
                    { uid, date: item.date, bonus: item.bonus, sentAt: Date.now() });
            } catch (e) { /* seguira sin red: re-intentar al next load */ }
        }
    }

    async function doCheckin(btn) {
        await ensureErDb();
        const today = todayStr();
        if (localStorage.getItem(KEY_LAST) === today) {
            window.erToast('Ya hiciste tu check-in de hoy. ¡Vuelve mañana! 🛡️', 'info');
            return;
        }
        let streak = 1;
        if (localStorage.getItem(KEY_LAST) === yesterdayStr()) {
            streak = (parseInt(localStorage.getItem(KEY_STREAK), 10) || 0) + 1;
        }
        const bonus = bonusFor(streak);
        localStorage.setItem(KEY_LAST, today);
        localStorage.setItem(KEY_STREAK, String(streak));
        btn.classList.remove('checked'); void btn.offsetWidth; btn.classList.add('checked');
        updateBtn(btn, streak);
        window.erToast(`🔥 ¡Check-in! Racha de ${streak} dia${streak > 1 ? 's' : ''}. Bonus: +${bonus} DKP`, 'success', 5000);

        const uid = await sessionUid();
        if (!uid) {
            window.erToast('Inicia sesion para registrar tu racha en la Base de Datos.', 'info');
            return;
        }
        flushQueue(uid);
        try {
            await window.erSet('checkins', uid + '_' + today, { uid, date: today, bonus, sentAt: Date.now() });
            // Bonus DKP atomico sobre el canon users/{uid} (campo dkpEarned)
            const { increment } = await import('firebase/firestore');
            await window.erSet('users', uid, { dkpEarned: increment(bonus), dkpBonusTotal: increment(bonus) }, true);
            window.erNotifyDiscord && window.erNotifyDiscord({
                title: '🔥 Check-in diario',
                text: `Un segador acumula **racha de ${streak} día(s)** y recibe **+${bonus} DKP**.`
            });
        } catch (e) {
            const q = JSON.parse(localStorage.getItem(KEY_QUEUE)) || [];
            q.push({ date: today, bonus });
            localStorage.setItem(KEY_QUEUE, JSON.stringify(q));
            window.erToast('Sin conexion: tu check-in se sincronizara automaticamente. 💾', 'info');
        }
    }


    function updateBtn(btn, streak) {
        const done = localStorage.getItem(KEY_LAST) === todayStr();
        btn.innerHTML = `<i class="fas fa-${done ? 'mug-hot' : 'fire'}"></i>` +
            `<span class="er-ci-num">${streak}</span>` +
            `<em>Racha de días</em>`;
        btn.title = done
            ? `¡Racha de ${streak} días! Mañana: +${bonusFor(streak + 1)} DKP`
            : `Racha actual: ${streak} días. Click para +${bonusFor(streak + (done ? 0 : 1))} DKP`;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        if (location.pathname.endsWith('login.html')) return;
        const btn = document.createElement('button');
        btn.id = 'er-checkin-btn';
        btn.type = 'button';
        const streak = localStorage.getItem(KEY_STREAK) || '0';
        updateBtn(btn, parseInt(streak, 10) || 0);
        btn.onclick = () => doCheckin(btn);
        document.body.appendChild(btn);
        const uid = await sessionUid();
        if (uid) flushQueue(uid);
    });
})();
