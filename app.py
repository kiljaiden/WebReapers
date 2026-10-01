# -*- coding: utf-8 -*-
"""
app.py — ETERNAL REAPERS · Portal de la Hermandad (Python / Flask)

Reencarnación en Python del antiguo portal estático WEBReapers.
Toda la lógica de datos sigue viviendo en Firebase Firestore
(proyecto: eternalreapersweb): el navegador habla DIRECTAMENTE con
Firebase (auth + realtime), mientras Python sirve el diseño, los
módulos y una API ligera (índice de búsqueda, webhook Discord).

Módulos portados:
  · Salón de la Hermandad (inicio inmersivo)   /
  · SoftReserve (reservas blandas + council)   /softreserve
  · DKP System (puntos, logs, asistencia)      /dkp
  · Misiones Legendarias (postulaciones/HOF)   /leyendas
  · Workshop comunitario (guías + mercado)     /taller
  · Consejo de Oficiales (panel admin)         /consejo
  · Acceso de segadores (login/registro)       /acceso
"""
import json
import random

from flask import Flask, jsonify, render_template, request

from firebase_config import DISCORD_WEBHOOK, FIREBASE_CONFIG, GUILD, load_overrides

load_overrides()

app = Flask(__name__)
app.secret_key = "eternal-reapers-la-cosecha-es-eterna"

# ------------------------------------------------------------------
# Navegación centralizada (la plantilla la inyecta en todas las páginas)
# ------------------------------------------------------------------
NAV = [
    {"href": "/",           "key": "salon",     "icon": "fa-solid fa-gem",              "label": "Salón"},
    {"href": "/softreserve","key": "soft",      "icon": "fa-solid fa-hand-holding-heart","label": "SoftReserve"},
    {"href": "/dkp",        "key": "dkp",       "icon": "fa-solid fa-coins",            "label": "DKP"},
    {"href": "/leyendas",   "key": "leyendas",  "icon": "fa-solid fa-dragon",           "label": "Leyendas"},
    {"href": "/taller",     "key": "taller",    "icon": "fa-solid fa-hammer",           "label": "Taller"},
    {"href": "/consejo",    "key": "consejo",   "icon": "fa-solid fa-shield-halved",    "label": "Consejo", "adminOnly": True},
]

SEARCH_INDEX = [
    {"href": "/",          "title": "Salón de la Hermandad", "desc": "Edictos, próximas raids y fuerzas de la hermandad", "icon": "fa-gem"},
    {"href": "/softreserve","title": "SoftReserve",           "desc": "Reservas blandas de loot y Loot Council en vivo",    "icon": "fa-hand-holding-heart"},
    {"href": "/dkp",       "title": "DKP System",             "desc": "Puntos de raid, logs, asistencia y reportes",        "icon": "fa-coins"},
    {"href": "/leyendas",  "title": "Misiones Legendarias",   "desc": "Agonía de Sombras y Val'anyr: postulaciones y sala de leyendas", "icon": "fa-dragon"},
    {"href": "/taller",    "title": "Workshop",               "desc": "Guías de la comunidad, reglas de raid y mercado",    "icon": "fa-hammer"},
    {"href": "/consejo",   "title": "Consejo de Oficiales",   "desc": "Panel de administración (solo GM / Oficial)",       "icon": "fa-shield-halved"},
    {"href": "/acceso",    "title": "Iniciar Sesión",         "desc": "Acceso y registro de segadores",                    "icon": "fa-key"},
]


@app.context_processor
def inject_globals():
    return {
        "guild": GUILD,
        "nav": NAV,
        "firebase_config": json.dumps(FIREBASE_CONFIG),
        "discord_enabled": bool(DISCORD_WEBHOOK),
    }


# ------------------------------------------------------------------
# Páginas (cada módulo conserva su colección Firestore idéntica)
# ------------------------------------------------------------------
@app.get("/")
def salon():
    return render_template("index.html", page="salon")


@app.get("/softreserve")
def softreserve():
    # Colecciones: soft_reserves · softres_events · event_winners · users · chats
    return render_template("softreserve.html", page="soft")


@app.get("/dkp")
def dkp():
    # Colecciones: dkp_logs · raid_attendance · raid_loot · raid_reports · users_assets · users
    return render_template("dkp.html", page="dkp")


@app.get("/leyendas")
def leyendas():
    # Colecciones: legendary_applications · legendary_hof · legendary_tracks · users
    return render_template("leyendas.html", page="leyendas")


@app.get("/taller")
def taller():
    # Colecciones: guild_guides · raid_rules · market · purchases · news
    return render_template("taller.html", page="taller")


@app.get("/consejo")
def consejo():
    # Colecciones: users · news · raid_events · raid_signups · raid_loot · bank_requests · messages
    return render_template("panel.html", page="consejo")


@app.get("/acceso")
def acceso():
    return render_template("login.html", page="acceso")


# ------------------------------------------------------------------
# API ligera (el resto vive en Firestore desde el navegador)
# ------------------------------------------------------------------
@app.get("/api/config")
def api_config():
    return jsonify({"guild": GUILD, "firebase": FIREBASE_CONFIG})


@app.get("/api/search")
def api_search():
    """Ctrl+K — busca en los módulos del portal."""
    q = (request.args.get("q") or "").strip().lower()
    if not q:
        return jsonify(SEARCH_INDEX)
    hits = [e for e in SEARCH_INDEX
            if q in e["title"].lower() or q in e["desc"].lower() or q in e["href"]]
    return jsonify(hits)


@app.post("/api/discord")
def api_discord():
    """Notificador opcional: reenvía eventos del portal al webhook de Discord."""
    if not DISCORD_WEBHOOK:
        return jsonify({"ok": False, "msg": "Webhook no configurado"}), 204
    data = request.get_json(silent=True) or {}
    try:
        import urllib.request
        payload = json.dumps({
            "username": f"{GUILD['tag']} · Portal",
            "embeds": [{
                "title": str(data.get("title", "Evento del portal"))[:256],
                "description": str(data.get("text", ""))[:1900],
                "color": random.randint(0x111111, 0xEEEEEE),
            }],
        }).encode("utf-8")
        req = urllib.request.Request(DISCORD_WEBHOOK, data=payload,
                                     headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=6)
        return jsonify({"ok": True})
    except Exception as exc:  # nunca rompe la UX
        return jsonify({"ok": False, "msg": str(exc)}), 502


if __name__ == "__main__":
    print("\n  ⚔  ETERNAL REAPERS — Portal de la Hermandad")
    print(f"  ☠  {GUILD['motto']}  ·  http://localhost:8080\n")
    app.run(host="0.0.0.0", port=8080, debug=True)
