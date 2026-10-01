# -*- coding: utf-8 -*-
"""
build_static.py — Herramienta de conversión (solo desarrollo).
Convierte las plantillas Jinja/Flask de /templates en páginas HTML
100% estáticas listas para Netlify/GitHub Pages/Pages.dev.

Uso:  python3 build_static.py
Salida: index.html, softreserve.html, dkp.html, leyendas.html,
        taller.html, consejo.html, acceso.html en la raíz del repo.

El sitio publicado NO necesita Python: esta ayuda solo genera los .html.
"""
import io
import os
import re

GUILD = {
    "name": "Eternal Reapers", "tag": "EDR", "realm": "Wyrmrest Accord",
    "faction": "Horde", "expansion": "Wrath of the Lich King 3.3.5a",
    "motto": "La cosecha es eterna.",
    "discord": "https://discord.gg/eternalreapers",
    "armory": "https://worldofwarcraft.com/es-es/guild/wyrmrest-accord/eternal%20reapers",
}

NAV = [
    ("index.html",       "salon",    "fa-solid fa-gem",               "Salón"),
    ("softreserve.html", "soft",     "fa-solid fa-hand-holding-heart", "SoftReserve"),
    ("dkp.html",         "dkp",      "fa-solid fa-coins",             "DKP"),
    ("leyendas.html",    "leyendas", "fa-solid fa-dragon",            "Leyendas"),
    ("taller.html",      "taller",   "fa-solid fa-hammer",            "Taller"),
    ("consejo.html",     "consejo",  "fa-solid fa-shield-halved",     "Consejo"),
]

ROUTES = {
    "/": "index.html",
    "/softreserve": "softreserve.html",
    "/dkp": "dkp.html",
    "/leyendas": "leyendas.html",
    "/taller": "taller.html",
    "/consejo": "consejo.html",
    "/acceso": "acceso.html",
}

TEMPLATE = '''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__TITLE__</title>
<meta name="description" content="__DESC__ · Portal de la Hermandad">
<meta name="theme-color" content="#05070a">
<link rel="icon" href="img/icon-192.png">
<link rel="apple-touch-icon" href="img/icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800;900&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<!-- ===== Config única del portal (Firebase + hermandad): editar SOLO js/config.js ===== -->
<script src="js/config.js"></script>
<script src="js/firebase-init.js"></script>
<script src="js/er-db.js" defer></script>
<script src="js/er-ui.js" defer></script>
<link rel="stylesheet" href="css/reapers.css">
</head>
<body class="page-__PAGE__">

<!-- CAPA INMERSIVA: partículas de almas + neblina -->
<canvas id="er-souls" aria-hidden="true"></canvas>
<div class="er-fog" aria-hidden="true"></div>
<div class="er-vignette" aria-hidden="true"></div>

<!-- ================= NAVBAR ================= -->
<header class="er-topbar" id="erTopbar">
  <a class="er-brand" href="index.html">
    <span class="er-brand-sigil"><i class="fa-solid fa-skull"></i></span>
    <span class="er-brand-txt">
      <b>__GUILD_NAME__</b>
      <em>__GUILD_TAG__ · __GUILD_REALM__</em>
    </span>
  </a>
  <nav class="er-nav" id="erNav">
__NAV__
  </nav>
  <div class="er-top-right">
    <button class="er-kbtn" id="erSearchBtn" title="Buscar (Ctrl+K)"><i class="fa-solid fa-magnifying-glass"></i><kbd>Ctrl K</kbd></button>
    <span class="er-net-dot" id="erNetDot" title="Conexión con la Base de Almas (Firestore)"></span>
    <a class="er-userchip" id="erUserChip" href="acceso.html" hidden>
      <img id="erUserAvatar" src="" alt="">
      <span id="erUserName">Segador</span>
    </a>
    <button class="er-burger" id="erBurger" aria-label="Menú"><i class="fa-solid fa-bars"></i></button>
  </div>
</header>

<!-- ================= CONTENIDO ================= -->
<main class="er-main">
__CONTENT__
</main>

<footer class="er-footer">
  <span class="er-foot-sigil"><i class="fa-solid fa-scythe"></i></span>
  <div>
    <b>__GUILD_NAME__</b> · «__GUILD_MOTTO__» · __GUILD_FACTION__, __GUILD_REALM__
    <div class="er-foot-sub">Portal 100% estático (HTML·CSS·JS) · Datos en vivo desde Firebase Firestore · Pulsa <kbd>Ctrl+K</kbd> para invocar la búsqueda</div>
  </div>
  <div class="er-foot-links">
    <a href="__GUILD_DISCORD__" target="_blank" rel="noopener"><i class="fa-brands fa-discord"></i> Discord</a>
    <a href="__GUILD_ARMORY__" target="_blank" rel="noopener"><i class="fa-solid fa-shield-halved"></i> Armory</a>
  </div>
</footer>

<!-- ================= MODAL GLOBAL ================= -->
<div class="er-modal-root" id="erModalRoot" hidden>
  <div class="er-modal-backdrop" data-close></div>
  <div class="er-modal-frame" role="dialog" aria-modal="true">
    <div class="er-modal-card" id="erModalCard">
      <header class="er-modal-head">
        <h3 id="erModalTitle">Título</h3>
        <button class="er-modal-x" data-close aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div class="er-modal-body" id="erModalBody"></div>
      <footer class="er-modal-foot" id="erModalFoot" hidden></footer>
    </div>
  </div>
</div>

<!-- Toasts -->
<div class="er-toasts" id="erToasts"></div>

<!-- Paleta Ctrl+K -->
<div class="er-palette-root" id="erPalette" hidden>
  <div class="er-modal-backdrop" data-close></div>
  <div class="er-palette">
    <div class="er-palette-input"><i class="fa-solid fa-crystal-ball" style="color:var(--gold)"></i>
      <input id="erPaletteInput" placeholder="Invoca una palabra… (módulos, raids, leyendas)" autocomplete="off">
      <kbd>ESC</kbd>
    </div>
    <div class="er-palette-list" id="erPaletteList"></div>
    <div class="er-palette-foot">↑↓ navegar · ⏎ abrir · índice local + Firestore en vivo</div>
  </div>
</div>

<script>
/* Sesión global compartida por todos los módulos */
window.ER = { ME:null, PROFILE:null, IS_ADMIN:false };
(async () => {
  try {
    const { auth } = await erDbReady();
    erWatchSession(user => {
      ER.PROFILE = user; ER.IS_ADMIN = !!(user && (user.role==='GM'||user.role==='Oficial'));
      document.body.classList.toggle('er-is-admin', ER.IS_ADMIN);
      const chip = document.getElementById('erUserChip');
      const link = document.querySelector('.er-auth-link');
      if (user) {
        chip.hidden = false;
        link.querySelector('span').textContent = 'Salir';
        link.querySelector('i').className = 'fa-solid fa-right-from-bracket';
        link.setAttribute('data-logout','1');
        document.getElementById('erUserName').textContent = user.mainName || user.displayName || (user.email||'segador').split('@')[0];
        const av = document.getElementById('erUserAvatar');
        av.src = user.avatar || ''; av.style.display = user.avatar ? '' : 'none';
      } else {
        chip.hidden = true;
      }
    });
    document.querySelector('.er-auth-link').addEventListener('click', async e => {
      if (e.currentTarget.getAttribute('data-logout')) {
        e.preventDefault();
        const { signOut } = await import('firebase/auth');
        await signOut(auth); erToast('Has soltado la guadaña. Hasta pronto.', 'info');
        location.href = 'index.html';
      }
    });
  } catch(e){ console.warn('[ER sesión]', e); }
})();
</script>
__SCRIPTS__
<script>if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});</script>
</body>
</html>'''


def nav_html(page):
    out = []
    for href, key, icon, label in NAV:
        admin = ' er-admin-only' if key == 'consejo' else ''
        active = ' active' if page == key else ''
        out.append(
            '    <a href="%s" data-key="%s" class="er-navlink%s%s">\n'
            '      <i class="%s"></i><span>%s</span>\n    </a>'
            % (href, key, admin, active, icon, label))
    a = ' active' if page == 'acceso' else ''
    out.append(
        '    <a href="acceso.html" data-key="acceso" class="er-navlink er-auth-link%s">\n'
        '      <i class="fa-solid fa-key"></i><span>Acceso</span>\n    </a>' % a)
    return "\n".join(out)


def jinja_eval(expr, ctx):
    """Mini-evaluador para {{ guild.x }} y filtros |tojson."""
    expr = expr.strip()
    m = re.match(r"^(\w+)\|tojson$", expr)
    if m:
        import json
        return json.dumps(ctx.get(m.group(1)), ensure_ascii=False)
    parts = expr.split('.')
    v = ctx
    for p in parts:
        if isinstance(v, dict):
            v = v.get(p, '')
        else:
            return ''
    return str(v)


def render_jinja(tpl, ctx):
    """Soporta lo que usan las plantillas: extends ya resuelto aquí,
    {% for item in nav %}, {% if cond %}, {{ expr }} y comentarios."""
    def repl_for(m):
        body = m.group(2)
        var = m.group(1)
        items = ctx.get(m.group(3), [])
        out = []
        for it in items:
            c2 = dict(ctx)
            c2[var] = it
            out.append(render_jinja(body, c2))
        return "".join(out)

    tpl = re.sub(r"\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}(.*?)\{%\s*endfor\s*%\}",
                 repl_for, tpl, flags=re.S)

    def eval_cond(cond, c):
        cond = cond.strip()
        m = re.match(r"^(\w+)\s*==\s*'([^']*)'$", cond) or re.match(r"^(\w+)\s*==\s*\"([^\"]*)\"$", cond)
        if m:
            return str(c.get(m.group(1), '')) == m.group(2)
        m = re.match(r"^not\s+(\w+)$", cond)
        if m:
            return not c.get(m.group(1))
        return bool(c.get(cond, False))

    def repl_if(m):
        cond, then_b, else_b = m.group(1), m.group(2), m.group(3) or ''
        # condiciones tipo item.adminOnly
        cur = ctx
        ok = eval_cond(cond, cur) if ' ' not in cond.strip() or '==' in cond else False
        if '.' in cond:
            path = cond.replace("== ", "").strip()
            m2 = re.match(r"^([\w.]+)\s*==\s*'([^']*)'$", cond)
            if m2:
                v = cur
                for p in m2.group(1).split('.'):
                    v = v.get(p, {}) if isinstance(v, dict) else ''
                ok = str(v) == m2.group(2)
            elif cond.strip() == 'item.adminOnly':
                ok = bool(cur.get('item', {}).get('adminOnly'))
        return (then_b if ok else else_b)

    while re.search(r"\{%\s*if\b", tpl):
        new = re.sub(r"\{%\s*if\s+(.*?)\s*%\}(.*?)(?:\{%\s*else\s*%\}(.*?))?\{%\s*endif\s*%\}",
                     repl_if, tpl, count=1, flags=re.S)
        if new == tpl:
            break
        tpl = new

    tpl = re.sub(r"\{\{-(.*?)\}\}|\{\{(.*?)\}\}",
                 lambda m: jinja_eval((m.group(1) or m.group(2)), ctx), tpl)
    tpl = re.sub(r"\{%.*?%\}", "", tpl)
    return tpl


def convert(template_file, page, title_key, out_name):
    raw = io.open(os.path.join('templates', template_file), encoding='utf-8').read()

    def grab(block):
        pat = r"\{%\s*block\s+" + re.escape(block) + r"\s*%\}(.*?)\{%\s*endblock\s*%\}"
        m = re.search(pat, raw, flags=re.S)
        return m.group(1) if m else ''

    ctx = {
        'guild': GUILD,
        'page': page,
        'nav': [
            {"href": h, "key": k, "icon": i, "label": l, "adminOnly": (k == 'consejo')}
            for h, k, i, l in NAV
        ],
    }
    title = render_jinja(grab('title'), ctx).strip() or ("%s · %s" % (title_key, GUILD['name']))
    desc = render_jinja(grab('desc') or ("{{ guild.name }} · {{ guild.expansion }} — Portal de la Hermandad"), ctx).strip()
    content = render_jinja(grab('content'), ctx)
    scripts = grab('scripts')

    # ---- Rutas Flask → archivos estáticos ----
    for route in sorted(ROUTES, key=len, reverse=True):
        content = re.sub(r'href="%s(?=["/?])' % re.escape(route), 'href="%s' % ROUTES[route], content)
        scripts = re.sub(r"'%s'\s*\+\s*encodeURIComponent\(([^)]*)\)" % re.escape(route),
                         "'%s?next='" % ROUTES[route] + "+encodeURIComponent(\\1)", scripts)
        scripts = re.sub(r"location\.href\s*=\s*'%s(?=['])" % re.escape(route),
                         "location.href = '%s" % ROUTES[route], scripts)
        scripts = re.sub(r"href:\\?'/%s'" % route.strip('/'), "href:'%s'" % ROUTES[route], scripts)
    # links tipo '/acceso?next=/leyendas'
    for route, f in list(ROUTES.items()):
        if route == '/':
            continue
        content = content.replace("'%s" % route, "'%s" % f)
        scripts = scripts.replace("'%s" % route, "'%s" % f)
        scripts = scripts.replace("`%s" % route, "`%s" % f)
    # los valores de ?next= también deben apuntar a archivos estáticos
    for route, f in list(ROUTES.items()):
        if route == '/':
            continue
        content = content.replace("?next=" + route, "?next=" + f)
        scripts = scripts.replace("?next=" + route, "?next=" + f)

    # ---- Texto: ya no corre sobre Python ----
    content = content.replace(
        '<i class="fa-brands fa-python" style="color:#ffd43b"></i> Renacido en Python',
        '<i class="fa-solid fa-bolt" style="color:var(--soul)"></i> Renacido como Portal Estático')
    content = content.replace(
        'El portal ahora corre sobre <b>Flask (Python)</b>; los datos siguen viviendo en Firebase — misma base de datos, nueva alma.',
        'El portal ahora es <b>100% HTML·CSS·JS</b> (arranca en cualquier hosting estático: Netlify, GitHub Pages); los datos siguen viviendo en Firebase — misma base de datos, nueva alma.')

    scripts = scripts.replace("location.href=next", "location.href=next")
    # next por defecto '/' -> 'index.html'
    scripts = scripts.replace("get('next') || '/'", "get('next') || 'index.html'")

    html = (TEMPLATE
            .replace('__TITLE__', title)
            .replace('__DESC__', desc)
            .replace('__PAGE__', page)
            .replace('__NAV__', nav_html(page))
            .replace('__CONTENT__', content.strip())
            .replace('__SCRIPTS__', scripts.strip())
            .replace('__GUILD_NAME__', GUILD['name'])
            .replace('__GUILD_TAG__', GUILD['tag'])
            .replace('__GUILD_REALM__', GUILD['realm'])
            .replace('__GUILD_FACTION__', GUILD['faction'])
            .replace('__GUILD_MOTTO__', GUILD['motto'])
            .replace('__GUILD_DISCORD__', GUILD['discord'])
            .replace('__GUILD_ARMORY__', GUILD['armory']))

    io.open(out_name, 'w', encoding='utf-8').write(html)
    print("  ✔ %-18s ← templates/%s" % (out_name, template_file))


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    print("Generando portal estático ETERNAL REAPERS…")
    convert('index.html',       'salon',    'Salón',        'index.html')
    convert('softreserve.html', 'soft',     'SoftReserve',  'softreserve.html')
    convert('dkp.html',         'dkp',      'DKP System',   'dkp.html')
    convert('leyendas.html',    'leyendas', 'Misiones Legendarias', 'leyendas.html')
    convert('taller.html',      'taller',   'Workshop',     'taller.html')
    convert('panel.html',       'consejo',  'Consejo de Oficiales', 'consejo.html')
    convert('login.html',       'acceso',   'Acceso',       'acceso.html')
    print("Listo. Sube TODO el repo a Netlify (publish directory: raíz).")


if __name__ == '__main__':
    main()
