/* =========================================================
   shared-theme.js — MODO CLARO/DORADO con persistencia
   - Añade data-theme="light" al <html> y lo guarda en localStorage.
   - Inyecta un boton sol/luna en la topbar de todas las paginas.
   Se carga con <script src="shared-theme.js" defer></script>.
   ========================================================= */
(function () {
    const KEY = 'er_theme';
    const saved = localStorage.getItem(KEY) || 'dark';
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');

    function apply(t) {
        if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(KEY, t);
        document.querySelectorAll('.er-theme-toggle i').forEach(i =>
            i.className = 'fas ' + (t === 'light' ? 'fa-moon' : 'fa-sun'));
        window.erToast && window.erToast(t === 'light'
            ? 'Modo claro/dorado activado ✨' : 'Modo oscuro clasico activado 🌑', 'success', 1800);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const topbar = document.querySelector('.bnet-topbar');
        if (!topbar) return;
        // Contenedor de acciones a la derecha del logo
        const actions = document.createElement('div');
        actions.className = 'er-theme-toggle';
        actions.title = 'Cambiar tema (oscuro / claro dorado)';
        actions.innerHTML = '<i class="fas ' + (localStorage.getItem(KEY) === 'light' ? 'fa-moon' : 'fa-sun') + '"></i>';
        actions.onclick = () => apply(
            document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');

        const userMenu = topbar.querySelector('#user-menu-btn') || topbar.querySelector('.user-menu');
        if (userMenu && userMenu.parentElement) {
            userMenu.parentElement.insertBefore(actions, userMenu);
            if (!userMenu.parentElement.style.display) userMenu.parentElement.style.display = 'flex';
            userMenu.parentElement.style.gap = '14px';
            userMenu.parentElement.style.alignItems = 'center';
        } else {
            topbar.appendChild(actions);
        }
    });
})();
