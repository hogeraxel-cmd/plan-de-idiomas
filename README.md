# Plan de idiomas

App instalable (PWA) para seguir un plan diario de árabe, alemán, inglés y francés.

- Cada idioma avanza lección por lección: la siguiente se desbloquea al completar la pendiente.
- La pantalla principal muestra lo pendiente de días anteriores, el plan de hoy y lo que hiciste cada día.
- Datos sincronizados entre el PC y el celular con Firebase (Auth + Firestore).
- Funciona sin conexión y se instala desde el navegador.

Configuración: `config.js` (datos web de Firebase) y `firestore.rules` (reglas: cada usuario solo ve lo suyo).
