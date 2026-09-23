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
| `S`       | Cambiar skin de la nave |
| `D`       | Agrandar la nave (1 vez por nivel; al morir vuelve al tamaño normal) |

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

La nave puede cambiar de apariencia con la tecla `S`. Cada skin define su propia silueta, color y llama del propulsor; los iconos de vidas y la posición de disparo se adaptan automáticamente. Todas las naves tienen el mismo tamaño base (hitbox y velocidad idénticas), pero la **Tarántula** altera la jugabilidad: suma el doble de puntos y, al agrandarse, dispara una bala desde cada lado.

Con la tecla `D` puedes **agrandar la skin activa** (×1.5, hitbox incluida): se aplica al modelo de la skin que tengas en ese momento y solo puede usarse **una vez por nivel** (al morir o pasar de nivel la nave vuelve a su tamaño de inicio). Mientras estés agrandado, el aviso **NAVE AGRANDADA** permanece visible en el HUD.

Solo con la nave **agrandada** se habilita el **doble disparo**, según el modelo:
- Naves con cañones laterales (p. ej. Tarántula): una bala desde cada lado.
- El resto: un abanico centrado de dos balas.

| Skin        | Descripción                                        |
| ----------- | -------------------------------------------------- |
| Halcón      | Silueta clásica blanca                             |
| Águila      | Panelas dobles y doradas                           |
| Libélula    | Cuerpo estrecho y alargado en cian                 |
| Escorpión   | Cola con aguijón en rojo/magenta                   |
| Tarántula   | Morada, doble puntos y 2 cañones laterales (activos al agrandarse) |

La skin elegida se guarda en `localStorage` y se conserva al recargar la página.

## Issues

Al abrir una issue, el workflow [`.github/workflows/issue-triage.yml`](.github/workflows/issue-triage.yml) la clasifica y reformatea automáticamente con opencode (IA) para facilitar su revisión:

- **Clasifica** el issue y asigna 1-2 labels del conjunto permitido (`bug`, `enhancement`, `question`, `documentation`, `needs-triage`), creándolos con su color si aún no existen.
- **Reformatea el cuerpo** en español, añadiendo:
  - `## Resumen`: el problema en 1-3 oraciones.
  - `## Información relevante`: área probable del código (p. ej. `game.js`), severidad sugerida y pasos de reproducción esperados (o aviso si la info no alcanza).
  - `## Descripción`: versión normalizada del contenido del usuario, corrigiendo el formato markdown.
  - `_Texto original del issue_`: el texto original de la persona citado línea por línea (`>`), **sin modificar ni traducir**.
- Autentica contra la API de GitHub con la app token de opencode (intercambio OIDC), sube artefactos de depuración (prompt, salida del modelo, cuerpo generado) y revoca el token al terminar.
