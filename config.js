// Datos de tu proyecto de Firebase.
// Dónde encontrarlos: Consola de Firebase → engranaje → Configuración del proyecto → General → Tus apps → app web.
// Estos datos no son secretos (van en la página que abre cualquier jugador). Lo que protege la partida
// son las reglas de database.rules.json y el usuario anfitrión de Authentication.
window.BATALLA_FIREBASE = {
  apiKey: 'AIzaSyDNKQCgqT_8xfd0hHEor5gmBQCjzN2fsTw',
  authDomain: 'batalla-de-kpis.firebaseapp.com',
  databaseURL: 'https://batalla-de-kpis-default-rtdb.firebaseio.com',
  projectId: 'batalla-de-kpis',
  appId: '1:574709866389:web:4b22c2ee0429f21e7a609c',

  // Correo del usuario anfitrión que creaste en Authentication → Usuarios (paso 3 del README).
  // Tiene que ser el mismo que escribiste en las reglas de la base de datos.
  // Es un correo inventado a propósito: este archivo es público y Firebase no le envía nada.
  hostEmail: 'anfitrion@batalladekpis.com'
};
