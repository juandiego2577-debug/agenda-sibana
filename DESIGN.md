# Diseño de la agenda Sibana (rediseño oct 2026)

Sistema visual de `index.html`. Decidido con Juan Diego el 20/10/2026
(spec: `docs/superpowers/specs/2026-10-20-rediseno-agenda-design.md`).
Regla de oro: **solo cambia cómo se ve**; ningún botón cambia de lugar ni de orden.

## Colores

Todos viven como variables en `:root` (oscuro, por defecto) y
`:root[data-tema="claro"]` (claro). Nunca se escribe un color suelto en una regla:
`pruebas/rediseno/colores.mjs` lo revisa.

| Variable | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#100d09` | `#f3f2ee` | fondo de la página |
| `--bg-2` | `#17130d` | `#fafaf8` | fondo de la grilla del día |
| `--panel` / `--panel-2` | `#211b12` / `#2a2217` | `#fff` / `#fff` | tarjetas, campos |
| `--ink` / `--ink-soft` / `--mute` | `#F1E8D6` / `#C4B694` / `#A09378` | `#1f1910` / `#5d5241` / `#6f644f` | texto |
| `--wine` | `#C9A227` | `#b08a1e` | dorado de acento (bordes, activo) |
| `--gold` | `#F0D889` | `#836210` | dorado de texto |
| `--line` / `--line-soft` | dorado 26% / crema 13% | | bordes / líneas de las horas |
| `--pending --ok --danger --canc` | | | estados de las citas |
| `--metal`, `--metal-ink`, `--metal-borde` | | | botón principal dorado metálico |
| `--ic-*` | | | color de cada ícono (el del emoji de antes) |

- La barra de arriba (`header.topbar`) es negra en los dos modos.
- **Buenos Aires**: `TEMA_BANDERA_ARGENTINA` reemplaza cada color de la hoja; un
  color nuevo necesita su reemplazo celeste/azul noche ahí, y su valor del modo
  claro en el `extra` de ese tema.

## Letras

Alojadas en `fonts/` (ver su LEEME). Montserrat (`--ui`) para todo el texto de
uso; Cormorant Garamond (`--head`) para títulos, fechas grandes y montos, siempre
con números rectos (`lining-nums tabular-nums`). Letra mínima 11 px
(`pruebas/rediseno/letras.mjs`).

## Íconos

`iconoSvg(nombre)`: íconos de línea (trazo 1.8) solo en la barra de arriba, las
pestañas y la barra de herramientas. El menú Más, las ventanas y los avisos
conservan sus emojis. La inicial de cada especialista: `inicialHtml` (letra por
CSS) con `textoSobre` para elegir negro o blanco.

## Vista Día

Fichas teñidas con el color del estado (`--st`, 24%), rayita del color de la
especialista a la izquierda. `ajustarFichasDia` deja solo las líneas que caben
ENTERAS (primero esconde el tratamiento; a lo ancho, la hora de término y "Sin
abono" pasa a ícono). `COMPACT_HEIGHT_PX` sigue en 50. Prueba: `dia.mjs`.

## Modo claro

Botón sol/luna (`data-act="toggle-tema"`) primero a la derecha de la barra de
arriba. Preferencia por aparato en `localStorage.sibanaTema`, aplicada en el
`<head>` antes de pintar. Prueba: `tema.mjs`.

## Movimiento

Solo respuestas rápidas (≤ 0,2 s) al tocar; nada decorativo. Sin animación al
abrir ventanas (`render()` las reconstruye a cada cambio).
