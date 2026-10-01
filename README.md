# WargamesWEB — Eternal Reapers (Hermandad Soul Reapers)

Repositorio creado por KilJaiden, estandarizado y centralizado para operar con una
**Base de Datos en línea (Firebase Firestore)**.

## 🗂️ Estructura actual

| Archivo | Descripción |
|---|---|
| `index.html` | Launcher / Inicio (público y miembros) |
| `softreserve.html` | Sistema SoftReserve |
| `dkp.html` | Sistema DKP |
| `apply.html` | Misiones Legendarias (postulaciones) |
| `talentos.html` | Calculadora de Talentos WoW |
| `comunidad.html` | Workshop / Tienda de la comunidad |
| `panel.html` | Panel de Administración (solo GM/Oficial) |
| `login.html` | Acceso / Registro |
| `firebase-init.js` | ⭐ **Configuración ÚNICA de la Base de Datos en línea** |
| `shared-nav.js` | Navegación superior idéntica en todas las páginas |
| `shared-design.css` | Mejoras de diseño transversales (scrollbars, accesibilidad, print) |
| `firestore.rules` | Reglas de seguridad recomendadas para Firestore |
| `talents-engine.js`, `talentos*.json` | Motor y datos de talentos |
| `archive/` | Versiones antiguas/residuales (`*2.html`, `*3.html`, `*original.html`) |

## 🌐 Base de Datos en línea

Todas las páginas operan en tiempo real contra **Firebase Firestore**
(proyecto: `eternalreapersweb`). Ya no hay configuraciones duplicadas:

- La conexión se define **una sola vez** en `firebase-init.js`.
- Cada página obtiene `auth = window.AUTH` y `db = window.DB`.
- Para migrar a otro proyecto de BD, edita únicamente el bloque
  `window.__FIREBASE_CONFIG__` (está al final del `<head>` de cada HTML).

Colecciones principales: `users`, `news`, `messages`, `raid_events`, `raid_signups`,
`raid_loot`, `raid_attendance`, `dkp_logs`, `soft_reserves`, `bank_requests`,
`legendary_applications`, `legendary_hof`, `market`, `purchases`, etc.

## 🧭 Navegación unificada

El menú superior es idéntico en todo el sitio y lo genera `shared-nav.js`:
**Inicio · SoftReserve · DKP System · Misiones Legendarias · Talentos · Workshop · Panel Admin**
(este último solo visible para roles `GM` / `Oficial`, consultado a la BD).

## 🔒 Seguridad

Sube `firestore.rules` a Firebase Console → Firestore → Reglas. Restringe la
escritura a administradores y evita que cualquier usuario lea documentos ajenos.

## ▶️ Cómo ejecutar

```bash
# Opción 1: servidor local simple
python3 -m http.server 8080

# Opción 2: desplegar gratis en Firebase Hosting
firebase login && firebase init hosting && firebase deploy
```
