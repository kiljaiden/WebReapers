/* =========================================================
   er-ui.js — NÚCLEO DE INTERFAZ "REAPER UI" (sin dependencias)
   =========================================================
   Provee a TODAS las páginas:
     1. window.erToast(msg, tipo)      -> notificaciones flotantes
     2. window.erModal(opts)           -> modales dinámicos (uno o por id)
     3. window.erConfirm(msg)          -> confirmación elegante (Promise<bool>)
     4. Polvo dorado ambiental + reveal al hacer scroll
     5. Ripple en botones .er-btn / .top-nav a
     6. window.erNotifyDiscord(payload)-> webhook opcional
   Se carga con <script src="er-ui.js" defer></script>.
   ========================================================= */

/* ---------- 6) NOTIFICADOR DISCORD ---------- */
window.erNotifyDiscord = async function (payload) {
    const url = window.__ER_DISCORD_WEBHOOK__;
    if (!url) return false;
    try {
        await fetch(url, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Eternal Reapers 🌾',
                embeds: [{
                    title: payload.title || 'Aviso',
                    description: payload.text || '',
                    color: payload.color != null ? payload.color : 0xf8b700,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Portal Eternal Reapers' }
                }]
            })
        });
        return true;
    } catch (e) { console.warn('[discord] webhook fallo:', e.message); return false; }
};

(function () {
    /* ---------- 1) TOASTS ---------- */
    let host = null;
    function getHost() {
        if (!host) { host = document.createElement('div'); host.id = 'er-toasts'; document.body.appendChild(host); }
        return host;
    }
    window.erToast = function (msg, tipo = 'info', ms = 3500) {
        const t = document.createElement('div');
        t.className = 'er-toast ' + (tipo === 'error' ? 'error' : tipo === 'success' ? 'success' : '');
        const icon = tipo === 'error' ? 'fa-circle-exclamation' : tipo === 'success' ? 'fa-circle-check' : 'fa-circle-info';
        t.innerHTML = `<i class="fas ${icon}"></i><span>${msg}</span>`;
        getHost().appendChild(t);
        requestAnimationFrame(() => t.classList.add('in'));
        setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 450); }, ms);
    };

    /* ---------- 2) MODALES ---------- */
    // erModal({ title, icon, body(html|Node), size:'sm|md|lg', actions:[{label,style,onClick(close)}], onOpen, onClose })
    const openModals = [];
    window.erModal = function (opts = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'er-modal-overlay';
        const box = document.createElement('div');
        box.className = 'er-modal ' + (opts.size || 'md');
        box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');

        const head = document.createElement('div');
        head.className = 'er-modal-head';
        head.innerHTML = `
            <h3>${opts.icon ? `<i class="fas ${opts.icon}"></i> ` : ''}${opts.title || ''}</h3>
            <button class="er-modal-x" aria-label="Cerrar"><i class="fas fa-xmark"></i></button>`;
        const bodyEl = document.createElement('div');
        bodyEl.className = 'er-modal-body';
        if (typeof opts.body === 'string') bodyEl.innerHTML = opts.body;
        else if (opts.body instanceof Node) bodyEl.appendChild(opts.body);

        box.appendChild(head); box.appendChild(bodyEl);

        if (opts.actions && opts.actions.length) {
            const foot = document.createElement('div');
            foot.className = 'er-modal-foot';
            opts.actions.forEach(a => {
                const b = document.createElement('button');
                b.className = 'er-btn ' + (a.style || 'ghost');
                b.innerHTML = (a.icon ? `<i class="fas ${a.icon}"></i> ` : '') + (a.label || 'OK');
                b.onclick = () => a.onClick ? a.onClick(close) : close();
                foot.appendChild(b);
            });
            box.appendChild(foot);
        }

        function close(result) {
            const i = openModals.indexOf(overlay);
            if (i > -1) openModals.splice(i, 1);
            overlay.classList.remove('in');
            setTimeout(() => overlay.remove(), 250);
            if (!openModals.length) document.body.classList.remove('er-modal-open');
            opts.onClose && opts.onClose(result);
        }
        overlay.appendChild(box);
        overlay.addEventListener('click', e => { if (e.target === overlay && opts.dismissable !== false) close(); });
        head.querySelector('.er-modal-x').onclick = () => close();
        document.body.appendChild(overlay);
        document.body.classList.add('er-modal-open');
        openModals.push(overlay);
        requestAnimationFrame(() => overlay.classList.add('in'));
        opts.onOpen && opts.onOpen(box, close);
        return { el: box, close };
    };

    /* ---------- 3) CONFIRM ---------- */
    window.erConfirm = function (msg, opts = {}) {
        return new Promise(resolve => {
            let done = false;
            window.erModal({
                title: opts.title || '¿Estás seguro?',
                icon: opts.icon || 'fa-question',
                size: 'sm',
                body: `<p style="line-height:1.6">${msg}</p>`,
                onClose: () => { if (!done) resolve(false); },
                actions: [
                    { label: opts.cancelLabel || 'Cancelar', style: 'ghost', onClick: c => { done = true; resolve(false); c(); } },
                    { label: opts.okLabel || 'Confirmar', style: opts.danger ? 'danger' : 'gold', onClick: c => { done = true; resolve(true); c(); } }
                ]
            });
        });
    };

    /* ESC cierra el último modal */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && openModals.length) {
            const top = openModals[openModals.length - 1];
            top.querySelector('.er-modal-x').click();
        }
    });

    /* ---------- 4) PARTÍCULAS + REVEAL + RIPPLE ---------- */
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const layer = document.createElement('div');
            layer.id = 'er-particles';
            for (let i = 0; i < 24; i++) {
                const p = document.createElement('i');
                p.style.left = Math.random() * 100 + 'vw';
                p.style.animationDuration = (9 + Math.random() * 14) + 's';
                p.style.animationDelay = (-Math.random() * 20) + 's';
                const s = 2 + Math.random() * 2;
                p.style.width = p.style.height = s + 'px';
                p.style.opacity = (0.2 + Math.random() * 0.4).toFixed(2);
                layer.appendChild(p);
            }
            document.body.appendChild(layer);
        }

        const targets = document.querySelectorAll('.er-card, .module, form, .stat-tile');
        if ('IntersectionObserver' in window && targets.length) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(en => {
                    if (en.isIntersecting) { en.target.style.animation = 'erFadeUp .5s ease both'; io.unobserve(en.target); }
                });
            }, { threshold: 0.05 });
            targets.forEach(el => io.observe(el));
        }

        document.addEventListener('click', e => {
            const btn = e.target.closest('.er-btn, .top-nav a, .side-link');
            if (!btn || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const r = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            r.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,.3);width:8px;height:8px;left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;transform:translate(-50%,-50%);pointer-events:none;transition:all .5s ease;`;
            if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
            btn.appendChild(r);
            requestAnimationFrame(() => { r.style.transform = 'translate(-50%,-50%) scale(14)'; r.style.opacity = '0'; });
            setTimeout(() => r.remove(), 550);
        });
    });

    /* ---------- 5) UTILIDADES DE FORMATO ---------- */
    window.erTimeAgo = function (ts) {
        if (!ts) return '';
        const t = typeof ts === 'object' ? (ts.toMillis ? ts.toMillis() : (ts.seconds * 1000)) : Number(ts);
        const d = Date.now() - t;
        if (isNaN(d)) return '';
        const m = Math.floor(d / 60000);
        if (m < 1) return 'ahora mismo';
        if (m < 60) return `hace ${m} min`;
        const h = Math.floor(m / 60);
        if (h < 24) return `hace ${h} h`;
        return `hace ${Math.floor(h / 24)} d`;
    };
    window.erEsc = function (s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    };
})();
