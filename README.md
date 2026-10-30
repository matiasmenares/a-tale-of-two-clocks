# A tale of two clocks

Una simulación interactiva y educativa de la **paradoja de los gemelos**. La pantalla se divide en dos: arriba está **Martín**, que se queda en la Tierra, y abajo está **Tomás**, que parte en una nave a casi la velocidad de la luz. Cada uno vive su vida (trabaja, toca música, tiene mascotas, envejece) y la mitad del otro se ve en cámara rápida o lenta según la relatividad.

La idea es que la relatividad especial y la general se *vean* en vez de solo leerse en una fórmula: quién envejece más, por qué, en qué momento del viaje se produce la diferencia y qué ve cada uno por la ventana.

## Cómo correrlo

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Luego abre <http://localhost:3000>.

Para una versión de producción:

```bash
npm run build
npm start
```

## Cómo se usa

1. Elige un **destino** en la consola del medio, o abre el **🗺 mapa** para ver dónde queda cada uno y qué pasará con los gemelos.
2. Pulsa **🚀 Subir al cohete**. Tomás camina por la pasarela, se sienta, hay cuenta regresiva y despegue.
3. Durante el viaje:
   - **Ritmo** controla cuánto tiempo simulado pasa por segundo real.
   - La **barra de progreso** se puede arrastrar para saltar a cualquier momento del viaje.
   - **🎬 director** activa una cámara lenta automática en los momentos importantes (despegue, cambios de fase, aterrizajes, muertes) para que no se pasen de largo.
   - **ida y vuelta** decide si Tomás regresa a la Tierra.
   - **❄️ hipersueño** mete a Tomás en una cápsula criogénica durante el crucero: su reloj sigue marcando el tiempo propio, pero su cuerpo queda en animación suspendida (envejece ~1 segundo cada 30 años), así sobrevive incluso al viaje al cuásar. Cuenta desde que se activa: si lo apagas a mitad de un crucero largo, Tomás sigue el viaje despierto y envejece normal.
   - **⚙ Control** permite ajustar la velocidad de crucero, la aceleración, la distancia y la esperanza de vida.
   - **🔇/🔊** activa el sonido (sintetizado en el navegador): despegue, cabina, lluvia, la guitarra y el violín según el nivel de cada uno y el «Cumpleaños feliz».
   - **🔗 Compartir** copia un link que abre el mismo viaje en el mismo momento.
   - Las **marcas sobre la barra** (↩️ media vuelta, 🎂 cumpleaños redondos, 🕯️ muertes, 🤝 reencuentro) saltan directo a cada momento.
   - **📊 Datos** tiene dos pestañas: **En vivo**, con las comunicaciones por luz entre los hermanos y "datos freak" del viaje, y **Laboratorio**, con los capítulos (velocidad, equivalencia, gravedad, todo junto), la explicación, las fórmulas y un diagrama espacio‑tiempo en vivo.

## Destinos

| Destino | Distancia | Qué tiene de especial |
| --- | --- | --- |
| Marte, Europa, Titán, Tritón | 1,5 a 30 UA | Tomás aterriza, explora y trae una roca de recuerdo. La diferencia de edad es de apenas segundos. |
| Próxima Centauri | 4,24 años luz | La estrella más cercana. |
| Gargantúa · planeta de Miller | 15 años luz (ficticio) | El agujero negro de *Interstellar*: 1 hora en el planeta son 7 años en la Tierra. |
| Sirio, Vega, Aldebarán | 8,6 a 65 años luz | Aldebarán es el destino por defecto: ida y vuelta, Martín envejece 134 años y Tomás 21. |
| Pléyades, Betelgeuse | 444 a 548 años luz | Martín muere mucho antes de que Tomás vuelva. |
| Centro de la Vía Láctea | 26.000 años luz | Unos 52.000 años pasan en la Tierra. |
| Andrómeda | 2,5 millones de años luz | Unos 5 millones de años en la Tierra y 509.000 años en la nave. |
| Cuásar 3C 273 | 2.440 millones de años luz | Al volver, el Sol ya es una gigante roja. |

Tiempos de ida y vuelta acelerando a 1 g con crucero a 0,995c:

| Destino | Tiempo en la Tierra | Tiempo en la nave |
| --- | --- | --- |
| Próxima Centauri | 11,7 años | 7,1 años |
| Aldebarán | 134 años | 21 años |
| Centro de la Vía Láctea | 52.265 años | 5.228 años |
| Andrómeda | 5,1 millones de años | 509.000 años |

## La física

Todo se calcula en unidades de años y años luz, con *c* = 1. El código de física está en [`lib/relativity.ts`](lib/relativity.ts), [`lib/gravity.ts`](lib/gravity.ts) y [`lib/comms.ts`](lib/comms.ts).

### El viaje: un cohete relativista a 1 g

La nave no salta a 0,995c de golpe: acelera con aceleración propia constante *a* (1 g ≈ 1,032 años luz/año²), viaja en crucero y frena. Durante la aceleración, con el tiempo propio *τ* del astronauta:

$$t = \frac{\sinh(a\tau)}{a}, \qquad x = \frac{\cosh(a\tau) - 1}{a}, \qquad v = \tanh(a\tau)$$

En crucero el reloj de Tomás avanza más lento que el de la Tierra por el factor de Lorentz

$$\gamma = \frac{1}{\sqrt{1 - \beta^2}} \approx 10 \quad \text{a } \beta = 0{,}995$$

Si el destino está tan cerca que no alcanza a llegar a la velocidad de crucero (como Marte), acelera hasta la mitad del camino y frena el resto. El viaje se arma por fases: acelerar, crucero, frenar, estadía o aterrizaje, y lo mismo de vuelta.

### Por qué no es simétrico

Mientras viaja a velocidad constante, cada gemelo ve que el reloj del otro va lento: la dilatación es recíproca. La paradoja se resuelve porque **solo Tomás acelera**. Según el principio de equivalencia de la relatividad general, mientras acelera siente un campo gravitatorio. Según la métrica de Rindler, el ritmo del reloj de la Tierra medido por la nave es

$$\frac{dt_{\text{Tierra}}}{d\tau} = \frac{1 - \alpha\,x}{\gamma}$$

donde α es la aceleración de la nave (positiva alejándose de la Tierra) y *x* su distancia. Cuando la nave frena en el destino y da la vuelta, la aceleración apunta hacia la Tierra: la Tierra queda "arriba" en el campo y su reloj corre muchísimo más rápido. Por eso el reloj de la Tierra "salta" hacia adelante durante el giro para volver. La simulación muestra el "ahora" de la Tierra según la nave, *t* − β*x*, y el horizonte de Rindler: mientras la nave acelera alejándose, hay señales de la Tierra que nunca la alcanzan.

### Lo que cada uno ve: luz, Doppler y aberración

Calcular no es lo mismo que ver. Los paneles distinguen lo que cada gemelo **calcula** (dilatación) de lo que **ve** de verdad, que depende de la luz que le llega:

- Una señal enviada desde la Tierra en el instante *t*₀ alcanza la nave cuando *t* − *x* = *t*₀. Una señal desde la nave llega a la Tierra con un retraso igual a la distancia *x*.
- Por eso alejándose cada uno ve el reloj del otro mucho más lento (corrimiento al rojo) y acercándose mucho más rápido (corrimiento al azul), con el factor Doppler √((1 + β)/(1 − β)).

La ventana de la nave muestra el cielo como se vería a esa velocidad, con la rapidez φ = atanh β:

- **Aberración:** las estrellas se amontonan hacia adelante, tan(θ′/2) = e^(−φ) · tan(θ/2).
- **Doppler:** cada estrella cambia de color y brillo con D = cos²(θ/2)·e^φ + sin²(θ/2)·e^(−φ), usando el color de cuerpo negro de su temperatura. Adelante brillan azules y atrás se apagan hacia el rojo.
- La radiación de fondo de microondas se ve como un anillo caliente adelante.

### Gravedad: pozos y agujeros negros

Un reloj cerca de una masa corre más lento según la métrica de Schwarzschild:

$$\frac{d\tau}{dt} = \sqrt{1 - \frac{r_s}{r}}$$

Eso explica el ejemplo del GPS (unos 45 µs por día) y el planeta de Miller. Para que 1 hora valga 7 años (un factor de unas 61.000 veces), el planeta tiene que estar pegado al horizonte de Gargantúa. La simulación lo trata como una estadía donde el reloj de Tomás casi se detiene respecto al de la Tierra.

### El futuro lejano de la Tierra

En los viajes más largos Martín muere y el tiempo en la Tierra sigue corriendo. La escena terrestre pasa por su tumba (visitada durante unos 10 años y luego olvidada), el futuro, las glaciaciones y el tiempo profundo. En la escala de miles de millones de años sigue el destino real del Sol: se calienta, los océanos hierven, la Vía Láctea se fusiona con Andrómeda, el Sol se vuelve gigante roja y termina como enana blanca.

## La parte humana

Los gemelos tienen 30 años al despegar y viven unos 90 (se puede cambiar). Cada uno tiene una rutina que cambia con el día de la semana y con la edad:

- **Martín:** trabaja, juega en el PC de joven, toca la guitarra y tiene dos perros y una gata, cuyas cenizas guarda en urnas.
- **Tomás:** hace ejercicio en la trotadora, repara la nave, cuida el huerto y toca el violín.

Ambos mejoran con la práctica: las notas desafinadas desaparecen y los movimientos se vuelven más fluidos. La tecnología de la Tierra avanza con los años (pantallas, vidrio, hologramas, robots cuidadores). Cuando la luz con la noticia de la muerte de su hermano por fin alcanza la nave, Tomás se entristece.

## Estructura del proyecto

```text
app/                 Página principal, estilos y layout (Next.js App Router)
components/
  theater/           Escenas animadas en SVG: Tierra, nave, personajes y cielo relativista
  StarMap.tsx        Mapa galáctico logarítmico y del sistema solar
  ControlPanel.tsx   Ajustes del viaje
  DataPanel.tsx      Comunicaciones y datos del viaje
  SpacetimeDiagram   Diagrama de Minkowski en vivo
  GravityWell.tsx    Pozo gravitatorio
hooks/useSimulation  Estado, reloj de la simulación y modo director
lib/
  relativity.ts      Cohete relativista, fases del viaje, simultaneidad y Doppler
  gravity.ts         Dilatación gravitacional
  comms.ts           Señales de luz entre los gemelos y datos freak
  life.ts            Rutinas, edades, mascotas, estaciones, música y futuro de la Tierra
  tech.ts            Evolución de la tecnología por año
```

## Tecnologías

Next.js 15, React 19, TypeScript, Tailwind CSS 4 y KaTeX para las fórmulas. Toda la animación está hecha a mano en SVG, sin librerías de animación ni imágenes.
