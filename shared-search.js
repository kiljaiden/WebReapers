/* =========================================================
   shared-search.js — BUSQUEDA GLOBAL (Ctrl+K) + NOTIFICADOR DISCORD
   =========================================================
   1) Paleta de comandos estilo VSCode: busca en paginas, roster
      (coleccion "users"), eventos/edictos ("events"|"edicts")
      e items ("raid_loot", "soft_reserves", "items") y en la
      lista de talentos WotLK. Navegable con flechas y Enter.
   2) window.erNotifyDiscord({title,text,color}) -> webhook embebido.
   Se carga con <script src="shared-search.js" defer></script>.
   ========================================================= */

/* ---------- 2) NOTIFICADOR DISCORD (Webhook) ---------- */
window.erNotifyDiscord = async function (payload) {
    const url = window.__ER_DISCORD_WEBHOOK__;
    if (!url) return false;
    try {
        const body = {
            username: 'Eternal Reapers 🌾',
            embeds: [{
                title: payload.title || 'Aviso',
                description: payload.text || '',
                color: payload.color != null ? payload.color : 0xf8b700,
                timestamp: new Date().toISOString(),
                footer: { text: 'eternalguild.netlify.app' }
            }]
        };
        // mode:'no-cors' permite enviar aunque Discord no exponga CORS;
        // el webhook igualmente entrega el mensaje en el canal.
        await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        return true;
    } catch (e) { console.warn('[discord] webhook fallo:', e.message); return false; }
};

/* ---------- 1) PALETA DE BUSQUEDA GLOBAL ---------- */
(function () {
    let overlay = null, inputEl = null, listEl = null, results = [], sel = 0;
    let talentNames = null;

    function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function esc(s) {
        return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    /* Recoleccion perezosa de fuentes indexables */
    async function buildIndex() {
        const idx = [];
        (window.__ER_PAGES__ || []).forEach(p => idx.push({
            icon: p.icon, title: p.title, sub: p.desc, href: p.href, kind: 'Pagina'
        }));

        // Talentos (indice ligero pre-generado: data/search-index.json)
        if (!buildIndex._talents) {
            buildIndex._talents = true;
            try {
                const r = await fetch('data/search-index.json');
                const j = await r.json();
                (j.items || []).forEach(t => idx.push({
                    icon: 'fa-brain', title: t.n, sub: `${t.c} · ${t.t}`, href: 'talentos.html', kind: 'Talento'
                }));
            } catch (e) { /* indice no disponible */ }
        }

        // BD en linea (con cache offline via er-db.js)
        if (typeof window.erGet === 'function') {
            const jobs = [
                ['users', u => ({ icon: 'fa-user', title: u.mainName || u.name || u.id, sub: `${u.clase || ''} ${u.role || ''}`.trim() + ` · ${u.dkp || u.dkpBonus || 0} DKP`, href: 'dkp.html', kind: 'Miembro' })],
                ['events', e => ({ icon: 'fa-calendar-day', title: e.title || e.name, sub: e.date || e.desc || 'Evento', href: 'index.html', kind: 'Evento' })],
                ['edicts', e => ({ icon: 'fa-scroll', title: e.title || (e.text || '').slice(0, 40), sub: 'Edicto de hermandad', href: 'comunidad.html', kind: 'Edicto' })],
                ['raid_loot', l => ({ icon: 'fa-gem', title: l.item || l.name, sub: `Botín · ${l.player || ''}`, href: 'dkp.html', kind: 'Item' })],
                ['soft_reserves', s => ({ icon: 'fa-hand-paper', title: s.item || s.name, sub: `SoftReserve · ${s.player || ''}`, href: 'softreserve.html', kind: 'Item' })]
            ];
            await Promise.allSettled(jobs.map(async ([col, map]) => {
                try {
                    const { rows } = await window.erGet(col);
                    rows.slice(0, 300).forEach(r => { const it = map(r); if (it && it.title) idx.push(it); });
                } catch (e) { /* coleccion inexistente o sin permisos */ }
            }));
        }
        buildIndex.cache = idx;
        return idx;
    }

    function search(q) {
        const pool = buildIndex.cache || [];
        const nq = norm(q);
        if (!nq) return pool.filter(x => x.kind === 'Pagina');
        return pool.filter(x => norm(x.title).includes(nq) || norm(x.sub).includes(nq))
            .sort((a, b) => norm(a.title).indexOf(nq) - norm(b.title).indexOf(nq))
            .slice(0, 14);
    }

    function render() {
        listEl.innerHTML = results.map((r, i) => `
            <div class="er-sr ${i === sel ? 'sel' : ''}" data-i="${i}">
                <i class="fas ${r.icon}"></i>
                <div><b>${esc(r.title)}</b><span>${esc(r.sub || '')}</span></div>
                <em>${r.kind}</em>
            </div>`).join('') || '<div class="er-sr-empty">Sin resultados…</div>';
    }

    function go(i) {
        const r = results[i];
        if (r) { close(); location.href = r.href; }
    }

    function open() {
        ensureDom();
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('on'));
        inputEl.value = ''; sel = 0;
        if (!buildIndex.cache) buildIndex().then(() => { results = search(''); render(); });
        else { results = search(''); render(); }
        setTimeout(() => inputEl.focus(), 30);
    }
    function close() { overlay && overlay.classList.remove('on'); setTimeout(() => overlay && (overlay.style.display = 'none'), 150); }

    function ensureDom() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'er-search-overlay';
        overlay.innerHTML = `
            <div id="er-search-panel">
                <div id="er-search-bar">
                    <i class="fas fa-magnifying-glass"></i>
                    <input type="text" placeholder="Buscar miembros, eventos, items, paginas…" autocomplete="off" spellcheck="false">
                    <kbd>ESC</kbd>
                </div>
                <div id="er-search-results"></div>
                <div id="er-search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> invocable desde cualquier pagina</span></div>
            </div>`;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
        document.body.appendChild(overlay);
        inputEl = overlay.querySelector('input');
        listEl = overlay.querySelector('#er-search-results');
        inputEl.addEventListener('input', () => { sel = 0; results = search(inputEl.value); render(); });
        inputEl.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
            else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
            else if (e.key === 'Escape') close();
        });
        listEl.addEventListener('click', e => { const d = e.target.closest('.er-sr'); if (d) go(+d.dataset.i); });
    }

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
        if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') close();
    });

    // Boton de lupa en la topbar (todas las paginas)
    document.addEventListener('DOMContentLoaded', () => {
        const topbar = document.querySelector('.bnet-topbar');
        if (!topbar) return;
        const btn = document.createElement('button');
        btn.id = 'er-search-btn';
        btn.title = 'Busqueda global (Ctrl+K)';
        btn.innerHTML = '<i class="fas fa-magnifying-glass"></i><kbd>Ctrl K</kbd>';
        btn.onclick = open;
        const um = topbar.querySelector('#user-menu-btn') || topbar.querySelector('.user-menu');
        if (um && um.parentElement) um.parentElement.insertBefore(btn, um.firstElementChild ? um : um);
        else topbar.appendChild(btn);
    });
})();
