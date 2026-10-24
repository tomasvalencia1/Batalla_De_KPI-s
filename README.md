# Batalla de KPIs

Juego para el salón: cada jugador maneja las redes sociales de una marca colombiana sorteada al azar y debe elegir el KPI correcto en 15 retos de 35 segundos. Los jugadores entran desde el celular, escriben su nombre y esperan en la sala; el anfitrión elige en la TV uno de los **tres juegos** y empieza. Después de cada reto, la pantalla del salón (TV) muestra qué pasó y el anfitrión pasa al siguiente reto con un botón. En los últimos 4 retos todo se oculta: nadie sabe quién gana hasta la revelación final. Gana un solo jugador.

- 10 marcas posibles: Juan Valdez, Rappi, Frisby, Arturo Calle, Postobón, Alpina, Nequi, Totto, Crepes & Waffles y Platzi.
- 15 retos por marca, con 4 opciones. La respuesta correcta cambia de letra en cada reto.

## Los tres juegos

**Batalla de KPIs** (preguntas contra el reloj)
- Puntos: 100 por acierto más un bono de hasta 50 por rapidez.
- Después de cada reto: “¡SE ACABÓ!”, podio de los 3 primeros y tabla de posiciones.
- Gana quien más puntos sume. Desempate: más aciertos y, después, menos tiempo total.

**Conquista** (la guerra por el mercado)
- La TV muestra un mapa de Colombia con 26 ciudades. Cada ciudad le paga **ventas** a su dueño después de cada reto: Bogotá 10, Medellín 8, Cali 7… San Andrés y Leticia 1.
- Si aciertas el KPI, en el celular eliges una ciudad antes de que se acabe el tiempo. Si es libre o de otro jugador, **la atacas**. Si es tuya, **la blindas**.
- Todas las jugadas se resuelven a la vez al cerrar el reto. Una ciudad blindada resiste todos los ataques. Si no está blindada, se la queda el atacante que respondió más rápido. Si fallas, no atacas ni blindas.
- Eventos: reto 5 **Black Friday** (ventas ×2), reto 8 **Crisis de reputación** (el que va ganando no puede blindar), retos 12 a 15 **Niebla de guerra** (el mapa se oculta) y reto 15 **Gran Lanzamiento** (ventas ×3).
- Gana quien más venda. Desempate: más cuota de mercado, más aciertos y menos tiempo.

**Bolsa de Valores** (invierte en lo que sabes)
- Cada jugador empieza con **$1.000**. En cada reto, antes de responder, elige cuánto invertir: 10 %, 25 %, 50 % o todo.
- Si acierta, recupera lo invertido y gana entre 10 % y 30 % según su rapidez, más su parte de lo que perdieron los que fallaron, en proporción a lo que invirtió. Esa parte tiene un tope de 3 veces lo invertido. Si falla o se le acaba el tiempo, pierde lo invertido.
- Mientras menos jugadores acierten, más gana cada acierto. Si alguien queda por debajo de $100, el banco lo rescata con $100.
- La TV muestra la gráfica del capital de todos, la pizarra de cotizaciones con ▲▼ y el cierre del mercado: mayor alza, mayor caída y quién fue con todo.
- Eventos: reto 5 **Mercado alcista** (ganancias ×2), reto 8 **Pánico en la bolsa** (nadie invierte menos del 50 %), retos 12 a 15 **Bolsa a ciegas** (la pizarra se apaga) y reto 15 **Campanazo final** (ganancias ×3).
- Gana quien termine con más capital.

> Las situaciones son casos ficticios con fines educativos. Las marcas no participan, no patrocinan ni avalan este juego.

La página es estática: Vercel solo la publica. Los puntajes en vivo y la contraseña de la TV funcionan con **Firebase** (plan gratuito Spark).

> **¿Ya lo tenías publicado?** Para tener los tres juegos solo vuelve a subir `index.html` y `README.md` a GitHub. Las reglas de Firebase (`database.rules.json`) y `config.js` no cambian.

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
3. En la TV toca **Conquista** o **Bolsa de Valores**: las reglas del celular deben cambiar al instante.
4. Toca **Empezar la batalla**, responde un reto en el celular y revisa que la TV muestre el resultado del reto y el botón **Siguiente reto**.
5. Al terminar la prueba toca **Nueva partida** para dejar la sala vacía.

## Cómo se juega en clase

1. **TV:** abre la página → **Pantalla del salón** → contraseña → **Pantalla completa**.
2. **Jugadores:** escanean el QR, escriben su nombre, sortean su marca y tocan **Estoy listo**. Quedan en la sala de espera.
3. **Anfitrión:** en la TV elige el juego tocando su tarjeta: **Batalla de KPIs**, **Conquista** o **Bolsa de Valores**. Los celulares muestran al instante las reglas del juego elegido. Puedes cambiarlo mientras sigan en la sala.
4. Cuando estén todos, toca **Empezar la batalla**.
5. Cada reto dura 35 segundos. Cuando todos terminan o se acaba el tiempo, la TV muestra **¡SE ACABÓ!** y luego el resultado del reto:
   - **Batalla de KPIs:** podio de los 3 primeros y tabla de posiciones.
   - **Conquista:** las batallas una por una sobre el mapa (conquistas, robos y ciudades defendidas) y las ventas acumuladas.
   - **Bolsa de Valores:** la gráfica avanza, la pizarra de cotizaciones y el cierre del mercado.

   Si alguien se demora, puedes tocar **Cerrar reto**. En Conquista, un jugador está listo cuando respondió y, si acertó, eligió ciudad.
6. Toca **Siguiente reto** para continuar. Antes de los retos con evento (5, 8, 12 y 15) la TV muestra un aviso a pantalla completa. Toca la pantalla para empezar el reto.
7. Desde el reto 12 todo se oculta: la tabla en Batalla de KPIs, el mapa en Conquista y la pizarra en la Bolsa. Cada celular solo ve lo suyo.
8. Después del reto 15 toca **Revelar ganador**. La TV arma el suspenso (aparecen el 3.º y el 2.º puesto y suena un redoble), revela al campeón con la celebración y luego presenta el podio de los 3 primeros, uno por uno. Al final muestra el botón **Ver tabla completa**. Mientras tanto los celulares dicen “Revelando al ganador…” y, cuando el campeón sale en la TV, cada jugador ve su puesto final y el podio. Para repetir la revelación toca **Mostrar ganador**.
9. Para jugar otra vez con otro grupo, toca **Nueva partida**. Eso borra los puntajes de la partida anterior y conserva el juego elegido.

**Sonido:** la TV pone música de fondo (distinta en la sala de espera, los retos, la pausa y el final) y efectos para cada cosa que aparece. Todo se genera en el navegador, sin archivos de audio. Se activa al entrar con la contraseña. Si recargas la TV y no se oye, toca **Activar sonido**. Revisa también que el audio salga por el TV (cable HDMI) y que el volumen esté arriba. Los celulares no suenan.

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
