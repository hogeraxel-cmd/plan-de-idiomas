# Plan de idiomas — instrucciones para Claude Code

App web instalable (PWA) con el plan diario de estudio de Axel: árabe desde cero (dialecto egipcio + árabe estándar), alemán desde A1, inglés de C1 a C2 y francés desde la semana 35. Se publica con GitHub Pages en <https://hogeraxel-cmd.github.io/plan-de-idiomas/> y guarda el avance en Firebase.

El usuario habla español: toda la interfaz, los textos del plan y las respuestas van en español, con frases cortas y claras.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | Estructura de la app: barra superior, 5 vistas y la barra de pestañas |
| `app.js` | Toda la lógica: sesión, sincronización, pantallas Hoy / Plan / Resumen / Ajustes |
| `curriculum.js` | El plan: contenido de cada lección (`STREAMS`), horario semanal (`slotsFor`) y calendario (`schedule`) |
| `styles.css` | Estilos, con modo claro y oscuro |
| `sw.js` | Service worker: funcionamiento sin conexión |
| `config.js` | Configuración web de Firebase (pública por diseño) y fecha de inicio por defecto |
| `firestore.rules` | Reglas de Firestore: cada usuario solo lee y escribe `users/{su uid}/**` |
| `firebase-*-compat.js` | Firebase 10.14.1 (compat), incluido localmente para que funcione sin conexión |
| `manifest.webmanifest`, `icons/` | Datos para instalar la app |
| `anki/` | Mazo inicial de Anki (`.apkg`, ya importado por el usuario) y su generador `build_deck.py` (genanki) |
| `docs/` | Plan de estudio completo y guía de Firebase |
| `tests/` | Pruebas de extremo a extremo (`npm test`) |

No hay compilación ni frameworks: JavaScript simple que corre tal cual en el navegador.

## Cómo funciona el plan

- `slotsFor(fecha, inicio)` devuelve los bloques del día como `[stream, minutos]`.
- Cada `stream` de `STREAMS` tiene `track` (la fila de la carta Gantt) y `f(n)`, que devuelve `{t, d, link?, g?}` (título, descripción, enlace, guía de letras).
- **Bloques diarios** (`daily: true`: Anki, Duolingo, revisión, grabación): se marcan por fecha y no se acumulan.
- **Bloques secuenciales** (el resto): son una fila de lecciones `n = 1, 2, 3…`. Cada fecha programada pide una lección más. La lección `n+1` solo se puede marcar cuando la `n` está hecha. Si un día no se estudia, la lección queda **pendiente** y aparece primero en Hoy. Nunca se salta contenido.
- "Reorganizar desde hoy" cambia la fecha de inicio (`ajustes.inicio`) a hoy: lo marcado se mantiene y cada bloque sigue desde donde quedó.

### Reglas al cambiar el currículo

- Las claves guardadas son `stream-n` (secuenciales) y `stream@fecha` (diarios). **No renombres un stream ni cambies qué lección es cada `n`** de lecciones que el usuario ya pudo haber hecho: su avance quedaría apuntando a otra cosa. Cambiar el texto de una lección sí es seguro.
- Agregar un stream nuevo exige agregar su `track` en `TRACKS`.
- El árabe de la semana 1 sigue el orden del mazo «Árabe» de Anki (`anki/build_deck.py`): 4 letras por lección. Si cambias uno, cambia el otro.

## Datos (Firestore)

- `users/{uid}/meta/progreso` → `{ done: { [clave]: {v, fecha, at, st, n, min, t} }, notas: { [fecha]: texto }, actualizado }`. Se escribe con `set(..., {merge: true})` solo lo que cambió. Desmarcar guarda `v: false` (no borra) para que gane el cambio más reciente entre dispositivos.
- `users/{uid}/meta/ajustes` → `{ datos: {inicio, recordatorio, puesta}, actualizado }`.
- En el navegador: caché en `localStorage` (`pdi2-cache:<uid>`) y cola de cambios pendientes (`pdi2-queue:<uid>`) que se envía al volver la conexión. Sin `config.js` completo, la app funciona en "modo local" y sube ese avance la primera vez que se entra con Firebase.

## Antes de publicar un cambio

1. `npm install` (una vez) y `npm test`. Deben pasar todas las pruebas. En el entorno de Claude Code, Chromium ya está instalado.
2. Para mirar la app: `npm run serve` y abrir `http://localhost:8080/?hoy=AAAA-MM-DD`. El parámetro `hoy` simula una fecha y solo funciona en localhost.
3. Si cambiaste cualquier archivo de la app, **sube la versión en `sw.js`** (`var VERSION = 'pdi-vN'`) para que los dispositivos instalados reciban la actualización.
4. Haz commit en `main` y `git push`. GitHub Pages publica solo en 1 o 2 minutos.

## Lo que el usuario debe hacer él mismo

Crear el proyecto de Firebase, el usuario de Authentication y las reglas (ver `docs/configurar-firebase.md`), y activar GitHub Pages. Claude no puede crear cuentas ni escribir contraseñas por él.
