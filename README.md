# ⚔️ ETERNAL REAPERS — Portal de la Hermandad (v2.0 · Python)

Renacimiento en **Python (Flask)** del antiguo portal estático WEBReapers.
**Misma base de datos Firebase/Firestore (`eternalreapersweb`)**: todos los
módulos leen/escriben en vivo las mismas colecciones que la web anterior.

## Módulos portados
| Ruta | Módulo | Colecciones Firestore |
|---|---|---|
| `/` | Salón de la Hermandad (hero inmersivo, stats, edictos, raids, roster) | `news`, `raid_events`, `users`, `raid_reports`, `raid_loot`, `legendary_hof` |
| `/softreserve` | SoftReserve + Loot Council | `soft_reserves`, `softres_events`, `event_winners`, `users` |
| `/dkp` | DKP System (ranking, logs, asistencia, loot, reportes) | `dkp_logs`, `raid_attendance`, `raid_loot`, `raid_reports`, `users` |
| `/leyendas` | Misiones Legendarias (Agonía / Val'anyr, HOF) | `legendary_applications`, `legendary_tracks`, `legendary_hof` |
| `/taller` | Workshop comunitario (guías, reglas, mercado) | `guild_guides`, `raid_rules`, `market`, `purchases` |
| `/consejo` | Consejo de Oficiales (admin: roster, roles, banca…) | `users`, `news`, `raid_events`, `raid_signups`, `bank_requests`, `messages` |
| `/acceso` | Login / registro / perfil (Firebase Auth) | `users` |

## Características
- 🎨 Diseño **"Cripta Espectral"**: canvas de almas flotantes reactivas al ratón, neblina, glassmorphism, Cinzel+Barlow, verde alma + oro.
- 🪟 **Modales universales** (`erModal`/`erConfirm`) usados en TODAS las acciones: reservas, postulaciones, reportes, adjudicaciones, edictos…
- ⌨️ Paleta de comandos **Ctrl+K** con índice servido por Python (`/api/search`) + resultados en vivo de Firestore.
- 🔥 Datos 100% en Firebase desde el navegador (auth + realtime `onSnapshot`), con caché offline y PWA/service worker.
- 🇪🇸 Notificador opcional de Discord vía API Python (`/api/discord`).

## Ejecutar
```bash
pip install -r requirements.txt
python app.py            # http://localhost:8080
```
Configuración en `firebase_config.py` (o exporta variables `ER_FB_*` / `ER_DISCORD_WEBHOOK`, o crea un `config_local.json` no versionado).

> La seguridad real vive en **Firestore Rules / Firebase Auth**, como antes; el panel `/consejo` se autolimita por rol (`GM`/`Oficial`).
