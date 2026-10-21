// Datos de tu proyecto de Firebase.
// Dónde encontrarlos: Consola de Firebase → engranaje → Configuración del proyecto → General → Tus apps → app web.
// Estos datos no son secretos (van en la página que abre cualquier jugador). Lo que protege la partida
// son las reglas de database.rules.json y el usuario anfitrión de Authentication.
window.BATALLA_FIREBASE = {
  apiKey: 'PEGA_AQUI_TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  databaseURL: 'https://TU_PROYECTO-default-rtdb.firebaseio.com',
  projectId: 'TU_PROYECTO',
  appId: 'PEGA_AQUI_TU_APP_ID',

  // Correo del usuario anfitrión que creaste en Authentication → Usuarios (paso 3 del README).
  // Tiene que ser el mismo que escribiste en las reglas de la base de datos.
  hostEmail: 'tu_correo_de_anfitrion@ejemplo.com'
};
