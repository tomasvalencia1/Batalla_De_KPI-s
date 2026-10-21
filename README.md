# Batalla de KPIs

Juego para el salón: cada jugador maneja las redes sociales de una marca colombiana sorteada al azar y debe elegir el KPI correcto en 15 retos de 35 segundos. Después de cada reto, la batalla se pausa, la pantalla del salón (TV) muestra las posiciones en vivo y el anfitrión pasa al siguiente reto con un botón. Gana un solo jugador.

- 10 marcas posibles: Juan Valdez, Rappi, Frisby, Arturo Calle, Postobón, Alpina, Nequi, Totto, Crepes & Waffles y Platzi.
- 15 retos por marca, con 4 opciones. La respuesta correcta cambia de letra en cada reto.
- Puntos: 100 por acierto más un bono de hasta 50 por rapidez.
- Desempate: más aciertos y, después, menos tiempo total.

> Las situaciones son casos ficticios con fines educativos. Las marcas no participan, no patrocinan ni avalan este juego.

La página es estática: Vercel solo la publica. Los puntajes en vivo y la contraseña de la TV funcionan con **Firebase** (plan gratuito Spark).

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | El juego completo: pantalla de los celulares y pantalla del salón. No hay que editarlo. |
| `config.js` | Los datos de tu proyecto de Firebase. **Este sí lo editas** (paso 5). |
| `database.rules.json` | Las reglas de seguridad que pegas en Firebase (paso 2). |
| `README.md` | Estas instrucciones. |

## Paso 1. Crear el proyecto de Firebase

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. Toca **Crear un proyecto**, ponle un nombre (por ejemplo `batalla-de-kpis`) y continúa. Google Analytics no hace falta: puedes desactivarlo.
3. Espera a que se cree y toca **Continuar**.

## Paso 2. Crear la base de datos y pegar las reglas

1. En el menú de la izquierda ve a **Compilación → Realtime Database** y toca **Crear base de datos**.
2. Elige la ubicación **Estados Unidos (us-central1)**.
3. Elige **Comenzar en modo bloqueado** y toca **Habilitar**.
4. Abre la pestaña **Reglas**, borra todo lo que aparece y pega el contenido completo de `database.rules.json`.
5. Toca **Publicar**.

Las reglas ya traen el correo del anfitrión `anfitrion@batalladekpis.com`. Si quieres usar otro, cámbialo en las **dos** líneas donde aparece, en minúsculas, y también en `config.js`.

## Paso 3. Activar el inicio de sesión y crear al anfitrión

1. Ve a **Compilación → Authentication** y toca **Comenzar**.
2. En **Método de acceso** activa:
   - **Anónimo**: así entran los celulares de los jugadores, sin crear cuentas.
   - **Correo electrónico/contraseña**: así entra la TV.
3. Ve a la pestaña **Usuarios** y toca **Agregar usuario**. En correo escribe exactamente `anfitrion@batalladekpis.com` y en contraseña la que usarás en la TV. Es un correo inventado a propósito: `config.js` es público y Firebase no le envía nada.

Esa contraseña es la que escribirás en el botón **Pantalla del salón**. Solo la guarda Firebase: no está en el código ni en GitHub. Usa una contraseña nueva, solo para el juego, porque la vas a escribir frente al salón.

## Paso 4. Registrar la app web

1. Toca el engranaje junto a **Descripción general del proyecto** → **Configuración del proyecto**.
2. En **Tus apps** toca el ícono **`</>`** (Web).
3. Ponle un apodo (por ejemplo `batalla-de-kpis`). **No** marques Firebase Hosting. Toca **Registrar app**.
4. Firebase muestra un bloque `const firebaseConfig = { ... }`. Déjalo abierto para el paso 5.

Si en ese bloque no aparece `databaseURL`, cópialo de la parte de arriba de la página de Realtime Database. Se ve así: `https://tu-proyecto-default-rtdb.firebaseio.com`.

## Paso 5. Llenar `config.js`

`config.js` ya está lleno con los datos del proyecto `batalla-de-kpis`. Solo tendrías que editarlo si creas otro proyecto de Firebase. En ese caso, ábrelo con el Bloc de notas o en GitHub (ícono del lápiz) y reemplaza:

- `apiKey`, `authDomain`, `databaseURL`, `projectId` y `appId` por los valores del paso 4.
- `hostEmail` por el correo del anfitrión del paso 3.

Conserva las comillas y las comas tal como están.

## Paso 6. Subir a GitHub

1. Entra a [github.com/new](https://github.com/new) y crea un repositorio, por ejemplo `batalla-de-kpis`.
2. En el repositorio vacío toca **uploading an existing file**.
3. Arrastra los archivos de esta carpeta: `index.html`, `config.js`, `database.rules.json` y `README.md`.
4. Toca **Commit changes**.

## Paso 7. Publicar en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) y toca **Import** junto al repositorio `batalla-de-kpis`.
2. En **Framework Preset** deja **Other**. No escribas nada en Build Command ni en Output Directory.
3. Toca **Deploy**. En un minuto tendrás una dirección como `batalla-de-kpis.vercel.app`.

Cada vez que cambies un archivo en GitHub, Vercel publica la versión nueva solo.

## Paso 8. Autorizar la dirección de Vercel en Firebase

1. En Firebase ve a **Authentication → Configuración → Dominios autorizados**.
2. Toca **Agregar dominio** y escribe tu dirección de Vercel sin `https://` (por ejemplo `batalla-de-kpis.vercel.app`).

## Paso 9. Revisar antes de la clase

Usa dos aparatos distintos, por ejemplo el computador para la TV y tu celular como jugador. Si pruebas todo en un solo computador, abre la TV en una **ventana de incógnito**. Si no lo haces, la TV y el jugador comparten la misma sesión.

1. En el computador abre la página, toca **Pantalla del salón** y escribe la contraseña del anfitrión. Debe aparecer la sala de espera con un código QR.
2. Con el celular escanea el QR, escribe un nombre, sortea una marca y toca **Estoy listo**. Tu nombre debe aparecer en la TV.
3. Toca **Empezar la batalla**, responde un reto en el celular y revisa que la TV muestre las posiciones y el botón **Siguiente reto**.
4. Al terminar la prueba toca **Nueva partida** para dejar la sala vacía.

## Cómo se juega en clase

1. **TV:** abre la página → **Pantalla del salón** → contraseña → **Pantalla completa**.
2. **Jugadores:** escanean el QR, escriben su nombre, sortean su marca y tocan **Estoy listo**.
3. **Anfitrión:** cuando estén todos, toca **Empezar la batalla**.
4. Cada reto dura 35 segundos. Cuando todos responden o se acaba el tiempo, la TV muestra las posiciones, con flechas de quién subió o bajó. Si alguien se demora, puedes tocar **Cerrar reto**.
5. Toca **Siguiente reto** para continuar. Después del reto 15 aparece **Anunciar ganador**.
6. Para jugar otra vez con otro grupo, toca **Nueva partida**. Eso borra los puntajes de la partida anterior.

Si alguien recarga la página o se le bloquea el celular, el juego lo devuelve al reto en curso. Quien entra con la batalla ya empezada juega desde el reto actual.

## Si la TV muestra un aviso

| Aviso | Qué revisar |
| --- | --- |
| “Falta configurar Firebase…” | `config.js` todavía tiene los valores de ejemplo (paso 5). |
| “Firebase no deja leer la partida…” | Las reglas no se pegaron o no se publicaron (paso 2). |
| “No se pudo entrar a Firebase: activa el inicio de sesión Anónimo…” | Falta activar **Anónimo** en Authentication (paso 3). |
| “Contraseña incorrecta” | La contraseña o el correo del anfitrión no coinciden con el usuario del paso 3. |
| “Falta escribir el correo del anfitrión en config.js” | `hostEmail` en `config.js` (paso 5). |
| “Firebase no dejó avanzar…” | El correo de las reglas (paso 2) no es igual al de `config.js`. |
| Los celulares dicen “Modo individual” | La misma causa de los avisos anteriores: revisa la TV para ver cuál es. |

## Límites del plan gratuito

- Hasta 100 conexiones al mismo tiempo: alcanza para 30 jugadores más la TV.
- 1 GB guardado y 10 GB de descarga al mes. Una clase usa una fracción mínima.
- Máximo 2.250 puntos por jugador (15 retos × 150).

## Cambiar marcas, retos o tiempos

Todo está en `index.html`, dentro de `const CASES = [...]`. Cada reto tiene:

- `s`: la situación.
- `a`: el KPI correcto.
- `d`: tres KPIs incorrectos.
- `why`: la explicación.
- `f`: la fórmula (opcional).
- `q`: una pregunta distinta a “¿Qué KPI deberías revisar?” (opcional).

Si cambias la cantidad de retos (`Q_COUNT`), cambia también en `database.rules.json` el largo máximo de `results` (15) y el puntaje máximo (2250 = retos × 150).
