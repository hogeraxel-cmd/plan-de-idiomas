// Pega aquí la configuración web de tu proyecto de Firebase
// (Firebase → Configuración del proyecto → Tus apps → app web → firebaseConfig).
// Estos datos son públicos por diseño: tus datos los protegen las reglas de Firestore,
// que solo dejan a cada usuario leer y escribir lo suyo.
// Si los dejas vacíos, la app funciona en "modo local", solo en ese navegador.
window.APP_CONFIG = {
  FIREBASE: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  INICIO: '2026-11-01'   // fecha en que empezaste el plan (se puede cambiar en Ajustes)
};
