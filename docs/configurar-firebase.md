# Usar la app desde cualquier PC y el celular

La app ya está publicada en **https://hogeraxel-cmd.github.io/plan-de-idiomas/**. Sin Firebase, cada navegador guarda su propio avance. Con Firebase, entras con tu correo y contraseña en cualquier PC o celular y ves siempre el mismo avance. Se hace una sola vez y toma unos 15 minutos.

## 1. Crea el proyecto

1. Entra a <https://console.firebase.google.com> con tu cuenta de Google.
2. «Agregar proyecto» → nombre: `plan-idiomas` → desactiva Google Analytics → «Crear proyecto».

## 2. Activa el inicio de sesión y crea tu usuario

1. Menú izquierdo: Compilación → **Authentication** → «Comenzar».
2. Pestaña «Método de acceso» → **Correo electrónico/contraseña** → Habilitar → Guardar.
3. Pestaña «Usuarios» → «Agregar usuario» → tu correo y una contraseña para la app.
4. Pestaña «Configuración» → **Dominios autorizados** → «Agregar dominio» → `hogeraxel-cmd.github.io`.

## 3. Crea la base de datos

1. Compilación → **Firestore Database** → «Crear base de datos».
2. Ubicación: `southamerica-east1 (São Paulo)` → «Comenzar en modo de producción» → Crear.
3. Pestaña **Reglas** → borra todo y pega el contenido del archivo [`firestore.rules`](../firestore.rules) → «Publicar».

## 4. Conecta la app

1. Engranaje (arriba a la izquierda) → Configuración del proyecto → «Tus apps» → ícono web `</>`.
2. Apodo: `plan-idiomas`. No marques Firebase Hosting. «Registrar app».
3. Aparece un bloque `const firebaseConfig = { ... }`. Cópialo completo y pégaselo a Claude en el chat: él lo pone en `config.js` y lo publica.
   - Si prefieres hacerlo tú: en GitHub abre `config.js` → ícono de lápiz → copia cada valor entre las comillas que corresponden → «Commit changes».
   - Estos datos son públicos por diseño. Lo que protege tu avance son las reglas del paso 3.

## 5. Entra desde cada dispositivo

- **PC (cualquiera):** abre la dirección en Chrome o Edge, entra con tu correo y contraseña, y presiona el ícono de instalar al final de la barra de direcciones. Queda en el escritorio y en el menú Inicio.
- **Android:** Chrome → menú ⋮ → «Instalar app».
- **iPhone:** Safari → Compartir → «Agregar a pantalla de inicio».

Entras una sola vez en cada dispositivo: la sesión queda guardada. Lo que hayas marcado antes de conectar Firebase se sube solo la primera vez que entras en ese navegador.
