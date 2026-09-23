# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción             |
| --------- | ------------------ |
| `←` `→`   | Rotar nave         |
| `↑`       | Propulsar          |
| `Espacio` | Disparar           |
| `K`       | Cambiar skin de la nave |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

> Con la nave **Tarántula** activa, todos los puntos (incluida la estrella fugaz) se multiplican ×2.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- **Estrella fugaz**: asteroide rápido con estela y halo luminoso que se desintegra solo con el tiempo (75 pts)
- **Power-ups** (15% de probabilidad al destruir un asteroide):
  - **Velocidad**: propulsión al doble durante 5 s
  - **Triple shot**: dispara 3 balas en abanico (±10°) durante 5 s
  - **Escudo**: power-up verde que envuelve la nave durante 6 s y absorbe hasta 2 impactos: al chocar con un asteroide o estrella fugaz, lo destruye en lugar de perder una vida

## Skins

La nave puede cambiar de apariencia con la tecla `K`. Cada skin define su propia silueta, color y llama del propulsor; los iconos de vidas y la posición de disparo se adaptan automáticamente. La mayoría son puramente cosméticas (hitbox y velocidad idénticas), pero la **Tarántula** altera la jugabilidad: es el doble de grande (hitbox incluida), suma el doble de puntos y dispara dos balas a la vez, una desde cada lado de la nave.

| Skin        | Descripción                                        |
| ----------- | -------------------------------------------------- |
| Halcón      | Silueta clásica blanca                             |
| Águila      | Panelas dobles y doradas                           |
| Libélula    | Cuerpo estrecho y alargado en cian                 |
| Escorpión   | Cola con aguijón en rojo/magenta                   |
| Tarántula   | Morada, el doble de grande, doble puntos y 2 cañones laterales |

La skin elegida se guarda en `localStorage` y se conserva al recargar la página.
