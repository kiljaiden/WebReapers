# ☠ ETERNAL REAPERS — Portal de la Hermandad (100% estático)

Portal **HTML + CSS + JS puro** para Netlify / GitHub Pages / cualquier hosting estático.
**Ya no necesita Python ni Flask**: el navegador habla DIRECTAMENTE con Firebase
(Authentication + Firestore). Misma base de datos, nueva alma.

```
/ (raíz = lo que sube Netlify)
├── index.html          Salón de la Hermandad
├── softreserve.html    SoftReserve · Loot Council
├── dkp.html            DKP System
├── leyendas.html       Misiones Legendarias (Agonía / Val'anyr)
├── taller.html         Workshop (guías, reglas, mercado)
├── consejo.html        Consejo de Oficiales (solo GM/Oficial)
├── acceso.html         Login + Registro (Firebase Auth)
├── js/config.js        ⚙️ ÚNICA configuración (claves Firebase, hermandad, webhook Discord)
├── js/firebase-init.js Conexión Firebase v10 (ESM + reintento + avisos de error)
├── js/er-db.js         Capa de datos Firestore + caché offline (localStorage)
├── js/er-ui.js         Navbar, modales, toasts, partículas, Ctrl+K…
├── css/reapers.css     Diseño "Cripta Espectral"
├── sw.js / manifest.webmanifest  PWA
├── netlify.toml        Publicación + redirects (/dkp → dkp.html, etc.)
├── firestore.rules     ⚠️ Reglas que DEBES publicar en Firebase
└── templates/, static/, app.py   Restos Flask (NO se usan; ignóralos o bórralos)
```

## 🚀 Desplegar en Netlify
1. Sube TODO el repo a GitHub.
2. Netlify → *Add new site* → *Import an existing project*.
3. **Build command: déjalo VACÍO** · **Publish directory: `/` (raíz)**. No hay Python.
4. Done. Si antes configuraste un build de Python, bórrelo en
   *Site configuration → Build & deployment*.

## 🔥 ARREGLO DEL LOGIN (causas típicas por las que "no loguea")
En [console.firebase.google.com](https://console.firebase.google.com) → proyecto **eternalreapersweb**:
1. **Authentication → Sign-in method**: proveedor **Correo/contraseña → ACTIVADO**.
2. **Authentication → Settings → Authorized domains**: añade tu dominio
   `tu-web.netlify.app` (y `localhost` ya viene). Si falta, el login falla en silencio.
3. **Firestore → Rules**: publica el archivo `firestore.rules` de este repo
   (`firebase deploy --only firestore:rules` o pegándolo en la pestaña Rules).
   Las reglas antiguas del portal viejo bloquean la nueva web → pantallas vacías.
4. Verifica que las claves de `js/config.js` coinciden con
   *Project settings → General → Your apps* (Web app).

## 🛠 Modificar contenido
Edita `js/config.js` (nombre de hermandad, Discord, webhook…).
Si quieres cambiar las plantillas originales (`templates/`), regenera los HTML con:
`python3 build_static.py` (solo es una ayuda de desarrollo; el sitio no usa Python).

## ✅ Extras de esta versión
· Botones que no respondían reparados (p. ej. postulación en Leyendas tenía un error de sintaxis JS).
· Sesión persistente entre páginas y tras recargar (localStorage de Firebase).
· Los datos muestran **avisos claros** si Firebase/Firestore rechaza algo (banner rojo inferior).
· Caché offline: si falla la red, ves los últimos datos guardados.
· Notificaciones a Discord ahora vía webhook directo (pega tu webhook en `js/config.js`).
