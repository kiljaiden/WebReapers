/* =========================================================
   config.js — ÚNICO punto de configuración del portal (100% estático)
   ---------------------------------------------------------
   Ya NO hace falta Python/Flask: Netlify sirve estos archivos
   tal cual y el navegador habla DIRECTAMENTE con Firebase.

   ⚠️ IMPORTANTE (arreglo del login):
   En Firebase Console → Authentication → Sign-in method, la
   proveedor "Correo/contraseña" debe estar HABILITADA, y en
   Authentication → Settings → Authorized domains debe estar
   tu dominio de Netlify (ej: tu-web.netlify.app).
   ========================================================= */
window.__FIREBASE_CONFIG__ = {
    apiKey: "AIzaSyDGELmVvBZZywbJOf6kuVKQJjKaRt6Q9ws",
    authDomain: "eternalreapersweb.firebaseapp.com",
    databaseURL: "https://eternalreapersweb-default-rtdb.firebaseio.com",
    projectId: "eternalreapersweb",
    storageBucket: "eternalreapersweb.firebasestorage.app",
    messagingSenderId: "945508907683",
    appId: "1:945508907683:web:b26cc3660298d4d6ba1d16",
    measurementId: "G-7J20NR0JDM"
};

/* Versión del SDK de Firebase (se carga desde gstatic.com vía importmap) */
window.__ER_FIREBASE_VERSION__ = "10.12.3";

/* Webhook opcional de Discord ("" = desactivado).
   Si lo rellenas, el portal enviará notificaciones DIRECTAMENTE
   desde el navegador (sin necesidad de backend Python). */
window.__ER_DISCORD_WEBHOOK__ = "";

/* Datos de la hermandad */
window.__ER_GUILD__ = {
    name: "Eternal Reapers",
    tag: "EDR",
    realm: "Wyrmrest Accord",
    faction: "Horde",
    expansion: "Wrath of the Lich King 3.3.5a",
    motto: "La cosecha es eterna.",
    discord: "https://discord.gg/eternalreapers",
    armory: "https://worldofwarcraft.com/es-es/guild/wyrmrest-accord/eternal%20reapers"
};

/* Índice de la paleta de comandos Ctrl+K (ahora local, sin /api/search) */
window.__ER_PAGES__ = [
    { href: "index.html",       icon: "fa-gem",                title: "Salón de la Hermandad", desc: "Edictos, próximas raids y fuerzas de la hermandad" },
    { href: "softreserve.html", icon: "fa-hand-holding-heart", title: "SoftReserve",           desc: "Reservas blandas de loot y Loot Council en vivo" },
    { href: "dkp.html",         icon: "fa-coins",              title: "DKP System",            desc: "Puntos de raid, logs, asistencia y reportes" },
    { href: "leyendas.html",    icon: "fa-dragon",             title: "Misiones Legendarias",  desc: "Agonía de Sombras y Val'anyr: postulaciones y sala de leyendas" },
    { href: "taller.html",      icon: "fa-hammer",             title: "Workshop",              desc: "Guías de la comunidad, reglas de raid y mercado" },
    { href: "consejo.html",     icon: "fa-shield-halved",      title: "Consejo de Oficiales",  desc: "Panel de administración (solo GM / Oficial)" },
    { href: "acceso.html",      icon: "fa-key",                title: "Iniciar Sesión",        desc: "Acceso y registro de segadores" }
];
