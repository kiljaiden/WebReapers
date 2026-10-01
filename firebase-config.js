/* =========================================================
   firebase-config.js — UNICO punto de configuracion de la BD
   =========================================================
   Edita SOLO este archivo para cambiar de proyecto Firebase.
   Debe cargarse ANTES de firebase-init.js en todas las paginas.

   RECOMENDACION DE BD: Firebase Firestore (Spark = gratis).
   Limites gratuitos: 50K lecturas / 20K escrituras / 1GB al dia.
   Alternativa "casi ilimitada": Supabase (Postgres + Auth gratis).
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
   Crea uno en: Discord > Configuracion del canal > Integraciones
   > Webhooks > Nuevo webhook > Copiar URL y pegala aqui.
   Dejalo vacio "" para desactivar el notificador.
   ========================================================= */
window.__ER_DISCORD_WEBHOOK__ = "";

/* =========================================================
   METADATOS PARA LA BUSQUEDA GLOBAL (Ctrl+K)
   Cada pagina registra su informacion aqui; shared-search.js
   ademas indexa roster, eventos e items desde la BD en vivo.
   ========================================================= */
window.__ER_PAGES__ = [
    { href: 'index.html',       icon: 'fa-home',        title: 'Inicio',            desc: 'Launcher de la hermandad, noticias y estado del servidor' },
    { href: 'softreserve.html', icon: 'fa-hand-paper',  title: 'SoftReserve',       desc: 'Reservas blandas de loot para las raids' },
    { href: 'dkp.html',         icon: 'fa-coins',       title: 'DKP System',        desc: 'Puntos de raid, logs, asistencia y reportes' },
    { href: 'apply.html',       icon: 'fa-dragon',      title: 'Misiones Legendarias', desc: 'Sistema de aplicacion y misiones de reclutamiento' },
    { href: 'talentos.html',    icon: 'fa-brain',       title: 'Talentos',          desc: 'Calculadora de talentos WotLK 3.3.5a sincronizada' },
    { href: 'comunidad.html',   icon: 'fa-store',       title: 'Workshop',          desc: 'Workshop de la comunidad: guias y addons' },
    { href: 'panel.html',       icon: 'fa-cogs',        title: 'Panel Admin',       desc: 'Gestion de usuarios, edictos y configuracion' },
    { href: 'login.html',       icon: 'fa-key',         title: 'Iniciar Sesion',    desc: 'Acceso de miembros' }
];
