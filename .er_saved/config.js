/* =========================================================
   config.js — UNICO punto de configuracion del portal
   =========================================================
   Edita SOLO este archivo para cambiar de proyecto Firebase,
   de webhook de Discord o de metadatos del sitio.
   Debe cargarse ANTES de firebase-init.js en todas las paginas.

   BD recomendada: Firebase Firestore (plan Spark = gratis).
   Limites gratuitos: 50K lecturas / 20K escrituras / 1GB al dia.
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

/* =========================================================
   WEBHOOK DE DISCORD (opcional)
   Discord > Configuracion del canal > Integraciones > Webhooks
   > Nuevo webhook > Copiar URL y pegarla aqui.
   Dejalo vacio "" para desactivar el notificador.
   ========================================================= */
window.__ER_DISCORD_WEBHOOK__ = "";

/* =========================================================
   METADATOS DEL PORTAL + PALETA DE COMANDOS (Ctrl+K)
   shared-core.js indexa estas paginas junto con roster,
   eventos, noticias y loot leidos de Firestore en vivo.
   ========================================================= */
window.__ER_PAGES__ = [
    { href: 'index.html',       icon: 'fa-house',       title: 'Salón de la Hermandad', desc: 'Inicio, edictos, proximas raids y fuerzas de la hermandad' },
    { href: 'softreserve.html', icon: 'fa-hand',        title: 'SoftReserve',           desc: 'Reservas blandas de loot y Loot Council en vivo' },
    { href: 'dkp.html',         icon: 'fa-coins',       title: 'DKP System',            desc: 'Puntos de raid, logs, asistencia y reportes' },
    { href: 'apply.html',       icon: 'fa-dragon',      title: 'Misiones Legendarias',  desc: 'Agonía de Sombras y Val\'anyr: postulaciones y sala de leyendas' },
    { href: 'comunidad.html',   icon: 'fa-store',       title: 'Workshop',              desc: 'Taller de la comunidad: guias, mercado y addons' },
    { href: 'panel.html',       icon: 'fa-shield-halved', title: 'Consejo de Oficiales', desc: 'Panel de administracion (solo GM / Oficial)' },
    { href: 'login.html',       icon: 'fa-key',         title: 'Iniciar Sesion',        desc: 'Acceso y registro de segadores' }
];

/* Datos estaticos de la hermandad (se pueden sobreescribir via Firestore settings/guild) */
window.__ER_GUILD__ = {
    name: 'Eternal Reapers',
    tag: 'EDR',
    realm: 'Wyrmrest Accord',
    faction: 'Horde',
    expansion: 'Wrath of the Lich King 3.3.5a',
    motto: 'La cosecha es eterna.',
    discord: 'https://discord.gg/eternalreapers',
    armory: 'https://worldofwarcraft.com/es-es/guild/wyrmrest-accord/eternal%20reapers'
};
