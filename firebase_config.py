# -*- coding: utf-8 -*-
"""
firebase_config.py — ÚNICO punto de configuración del portal Eternal Reapers.
Misma base de datos Firebase/Firestore que la web anterior: `eternalreapersweb`.
Edita aquí (o exporta ER_FIREBASE_CONFIG como JSON) para cambiar de proyecto.
"""
import json
import os

FIREBASE_CONFIG = {
    "apiKey": os.environ.get("ER_FB_API_KEY", "AIzaSyDGELmVvBZZywbJOf6kuVKQJjKaRt6Q9ws"),
    "authDomain": os.environ.get("ER_FB_AUTH_DOMAIN", "eternalreapersweb.firebaseapp.com"),
    "databaseURL": os.environ.get("ER_FB_DB_URL", "https://eternalreapersweb-default-rtdb.firebaseio.com"),
    "projectId": os.environ.get("ER_FB_PROJECT_ID", "eternalreapersweb"),
    "storageBucket": os.environ.get("ER_FB_STORAGE_BUCKET", "eternalreapersweb.firebasestorage.app"),
    "messagingSenderId": os.environ.get("ER_FB_SENDER_ID", "945508907683"),
    "appId": os.environ.get("ER_FB_APP_ID", "1:945508907683:web:b26cc3660298d4d6ba1d16"),
    "measurementId": os.environ.get("ER_FB_MEASUREMENT_ID", "G-7J20NR0JDM"),
}

# Webhook opcional de Discord para notificaciones ("" = desactivado)
DISCORD_WEBHOOK = os.environ.get("ER_DISCORD_WEBHOOK", "")

GUILD = {
    "name": "Eternal Reapers",
    "tag": "ER",
    "realm": "Bennu",
    "faction": "Cross-faction",
    "expansion": "Wrath of the Lich King 3.3.5a",
    "motto": "La cosecha es eterna.",
    "discord": "https://discord.gg/eternalreapers",
    "armory": "https://ultimowow.com",
}

# Colecciones Firestore usadas por los módulos del portal
COLLECTIONS = [
    "users", "news", "messages", "chats", "settings",
    "raid_events", "raid_signups", "raid_loot", "raid_attendance", "raid_reports",
    "dkp_logs", "soft_reserves", "softres_events", "event_winners",
    "legendary_applications", "legendary_hof", "legendary_tracks",
    "market", "purchases", "bank_requests", "guild_guides", "raid_rules", "users_assets",
]


def load_overrides(path="config_local.json"):
    """Permite sobreescribir config sin tocar el código (archivo opcional, no versionado)."""
    global FIREBASE_CONFIG, DISCORD_WEBHOOK, GUILD
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        FIREBASE_CONFIG.update(raw.get("firebase", {}))
        if "discordWebhook" in raw:
            DISCORD_WEBHOOK = raw["discordWebhook"]
        GUILD.update(raw.get("guild", {}))
    except FileNotFoundError:
        pass
