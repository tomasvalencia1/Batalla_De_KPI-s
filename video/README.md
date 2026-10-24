# Video: cómo se juega Batalla de KPIs

Video explicativo (sin voz, con música y efectos) de los 3 juegos: Batalla de KPIs, Conquista y Bolsa de Valores.
Empieza con la votación del salón, explica cómo entrar, las reglas básicas, cada juego y el gran final.

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La animación. Se dibuja cuadro por cuadro con `seek(t)`; cada elemento aparece según su `data-t`. |
| `audio.js` | Música y efectos sintetizados (los mismos instrumentos del juego). Cada elemento con `data-sfx` suena cuando aparece. |
| `render.cjs` | Convierte la animación en MP4 1920×1080 a 30 cuadros por segundo, con el audio a −16 LUFS. |
| `img/` | Capturas reales del juego (TV y celular) que usa el video. |
| `fonts/` | Las fuentes del juego (licencia OFL). |

## Volver a generar el video

Necesita Node, Playwright con Chromium y ffmpeg.

```
cd video
node render.cjs                         # crea batalla-de-kpis-como-se-juega.mp4 y la copia liviana
node render.cjs --stills 10,50,120 out  # capturas sueltas para revisar escenas
```

Esta carpeta no se publica en Vercel (`.vercelignore`) y los MP4 no se guardan en git (`video/.gitignore`).
