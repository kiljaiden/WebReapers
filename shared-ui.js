/* =========================================================
   shared-ui.js — EFECTOS GLOBALES INMERSIVOS (sin dependencias)
   =========================================================
   1. window.erToast(msg, tipo)  -> notificaciones elegantes en todas las paginas
   2. Polvo dorado ambiental de fondo (particulas CSS ligeras)
   3. Animaciones de entrada con IntersectionObserver (.er-card, .module...)
   Se carga con <script src="shared-ui.js" defer></script> en cada pagina.
   ========================================================= */

/* ---- 1) Sistema de TOASTS global ---- */
(function () {
    let host = null;
    function getHost() {
        if (!host) {
            host = document.createElement('div');
            host.id = 'er-toasts';
            document.body.appendChild(host);
        }
        return host;
    }
    window.erToast = function (msg, tipo = 'info', ms = 3500) {
        const t = document.createElement('div');
        t.className = 'er-toast ' + (tipo === 'error' ? 'error' : tipo === 'success' ? 'success' : '');
        const icon = tipo === 'error' ? 'fa-circle-exclamation' : tipo === 'success' ? 'fa-circle-check' : 'fa-circle-info';
        t.innerHTML = `<i class="fas ${icon}" style="margin-right:8px;color:var(--wow-gold,#f8b700)"></i>${msg}`;
        getHost().appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, ms);
    };
})();

document.addEventListener('DOMContentLoaded', () => {

    /* ---- 2) Particulas de polvo dorado (respetando prefers-reduced-motion) ---- */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const layer = document.createElement('div');
        layer.id = 'er-particles';
        const N = 26;
        for (let i = 0; i < N; i++) {
            const p = document.createElement('i');
            p.style.left = Math.random() * 100 + 'vw';
            p.style.animationDuration = (9 + Math.random() * 14) + 's';
            p.style.animationDelay = (-Math.random() * 20) + 's';
            const s = 2 + Math.random() * 2;
            p.style.width = p.style.height = s + 'px';
            p.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
            layer.appendChild(p);
        }
        document.body.appendChild(layer);
    }

    /* ---- 3) Reveal progresivo: los paneles aparecen al entrar en pantalla ---- */
    const targets = document.querySelectorAll('.er-card, .module, .tree-panel, form');
    if ('IntersectionObserver' in window && targets.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    en.target.style.animation = 'erFadeUp .5s ease both';
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.06 });
        targets.forEach(el => io.observe(el));
    }

    /* ---- 4) Efecto ripple sutil en botones dorados y de navegacion ---- */
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.er-btn-gold, .top-nav a, .btn-play, .sub-nav-btn');
        if (!btn || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const r = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        r.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,.35);
            width:8px;height:8px;left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;
            transform:translate(-50%,-50%);pointer-events:none;transition:all .5s ease;`;
        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        btn.appendChild(r);
        requestAnimationFrame(() => { r.style.transform = 'translate(-50%,-50%) scale(14)'; r.style.opacity = '0'; });
        setTimeout(() => r.remove(), 550);
    });
});
