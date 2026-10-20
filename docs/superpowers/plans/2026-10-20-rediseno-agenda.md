# Rediseño visual de la agenda — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cambiar cómo se ve toda la agenda (`index.html`) según el diseño aprobado, sin cambiar ninguna función, y agregar el modo claro con un botón sol/luna en la barra de arriba.

**Architecture:** Todo sigue en el único `index.html`. Primero se arma una red de pruebas que compara la agenda nueva con la publicada (`b5082a2`) pantalla por pantalla: mismos botones, mismo orden, mismos textos (sin contar emojis/íconos). Después se reemplaza el CSS por uno basado en variables (`:root` oscuro, `:root[data-tema="claro"]` claro), se cambian íconos/letras/logo y se ajustan las fichas de la vista Día. Buenos Aires sigue generándose con `TEMA_BANDERA_ARGENTINA`.

**Tech Stack:** HTML/CSS/JS sin build; Firebase compat 10.14.1 (cdnjs); pruebas con Playwright + emuladores de Firestore y Auth (`firebase-tools`), Node 22.

**Spec:** `docs/superpowers/specs/2026-10-20-rediseno-agenda-design.md`

## Global Constraints

- Ningún botón cambia de lugar ni de orden; ningún `data-act`, `data-*`, `id` de campo ni texto cambia (salvo el emoji delante de un texto donde se reemplaza por ícono). Botón nuevo único: `data-act="toggle-tema"`.
- No se toca nada de datos: ni `DOC_KEYS`, ni `saveData`, ni cálculos; `APP_VERSION` sigue en 8.
- Íconos SVG solo en: barra de arriba, pestañas de sección y barra de herramientas (Vale, Buscar, Más, Bloquear hora, Nueva cita, flechas). El menú Más, las ventanas y los avisos conservan sus emojis.
- Letras: Montserrat (texto de uso) y Cormorant Garamond (títulos, fechas grandes, montos), alojadas en `fonts/` del repo; números de Cormorant con `font-variant-numeric: lining-nums tabular-nums`. Se quita el `<link>` a Google Fonts.
- Colores oscuros (Santiago): fondo `#100d09`, superficies `#17130d` / `#211b12` / `#2a2217`, borde dorado `rgba(201,162,39,.26)`, líneas `rgba(241,220,170,.13)`, dorado `#C9A227` / claro `#F0D889`.
- Colores de ícono: Agenda `#e8836f`, Pagos y Vale `#62c08f`, Finanzas `#79aee6`, Garantías `#f1c84b`, Stock `#d4a06a`, Buscar `#a9bccd`, Bloquear `#ec7f7f`.
- Botón principal: dorado metálico `linear-gradient(100deg,#a8832a 0%,#e3c46c 28%,#fbe9ad 46%,#d4af37 64%,#a47c22 100%)`, texto `#1a1205`, sombra neutra (nunca halo dorado).
- Modo claro: fondo `#f3f2ee`, superficies `#ffffff`, dorado de texto `#836210`; la barra de arriba (`header.topbar`) queda oscura en los dos modos. Preferencia en `localStorage` clave `sibanaTema` (`'claro'` | ausente = oscuro), nunca en Firebase.
- Movimiento: solo transiciones ≤ 200 ms (presionar botón, aparecer ventana) y nada si `prefers-reduced-motion: reduce`.
- Texto mínimo 11 px; contraste AA; en teléfono ningún botón de menos de 36 px de alto.
- Español neutro en comentarios y textos; comentar el código en el estilo del archivo.

## Review Focus

- Nombres muy largos (clienta de 45 letras, especialista "María José Fernanda") en fichas angostas, chips y la barra de arriba: nada se sale ni empuja botones → prueba en Task 6 (datos con nombres largos).
- 5 especialistas en el computador (1024–1517 px): "+ Nueva cita" sigue arriba a la derecha y la fila de filtros se desliza → prueba en Task 3.
- Letra grande del teléfono (zoom de texto 130%): fichas y barra no se rompen → prueba en Task 6 con `page.evaluate(()=>document.documentElement.style.fontSize='130%')`.
- Elegir modo claro y luego cambiar de sede (📍 Sede recarga) o cerrar sesión: se mantiene el modo y no hay destello oscuro al cargar → prueba en Task 5.
- Color de especialista muy claro (`#f5f5f5`) o muy oscuro (`#111111`) en chips, fichas y modo claro: la inicial y la rayita se ven → prueba en Task 3 y Task 5.

---

### Task 1: Red de pruebas (paridad, medidas, capturas)

**Files:**
- Create: `pruebas/rediseno/comun.mjs`, `pruebas/rediseno/paridad.mjs`, `pruebas/rediseno/medidas.mjs`, `pruebas/rediseno/capturas.mjs`, `pruebas/rediseno/LEEME.md`
- Test entorno: carpeta de trabajo con `firebase-tools`, `@firebase/rules-unit-testing`, `firebase@10.14.1`, `playwright` (ver LEEME)

**Interfaces:**
- Produces: `abrirAgenda({html, rol:'duenos'|'especialista', sede:'santiago'|'buenosaires', ancho, tema:'oscuro'|'claro', datos?}) -> {page, ctx, cerrar}`; `PANTALLAS: Array<{nombre, roles, ir:(page)=>Promise}>`; `huella(page) -> string[]`; `revisarMedidas(page) -> string[]` (lista de problemas, vacía = bien); `DATOS_PRUEBA` (agenda inventada: 4 especialistas Salomé `#2f9e57`, Lucy `#c03aa8`, Melissa `#7fd3db`, Helen `#f28c28`; citas de un martes 20/10/2026 en los 5 estados, una de 1 h "Sin abono", tres a la misma hora, un bloqueo, un curso, vales, gastos, un servicio con `creadoEn`).

- [ ] **Step 1:** `comun.mjs`: siembra `sibana-agenda/santiago` y `sibana-agenda/buenosaires` con `DATOS_PRUEBA`, crea en el emulador de Auth la cuenta `juandiego2577+duenos@gmail.com` y una especialista personal `salome@prueba.cl` con `sibana-usuarios/<uid>` = `{usuario:'salome', nombre:'Salomé', email, sede:'santiago', rol:'especialista', activo:true}`; reemplaza cdnjs por el SDK de npm y apunta al emulador como `agenda.test.mjs` de certificados (`db.useEmulator` tras `experimentalForceLongPolling`); congela el reloj con `page.clock.install({time:new Date('2026-10-20T13:10:00-03:00')})`; fija `localStorage.sibanaTema` y `sibanaSedeDuenos` antes de cargar; entra con `#team-login-user`/`#team-login-input`/`#team-login-btn`; marca `servicios vistos` para que no salgan avisos.
- [ ] **Step 2:** `PANTALLAS` (cada una por `data-act`): Día, Semana, Mes, Buscar, Nueva cita, editar cita, cita de especialista, Mi pago, Pagos, Finanzas (Resumen, Gastos, Gráficos), Garantías, Stock, menú Más abierto y cada ventana del menú, Vale, Bloquear hora, Mi cuenta, curso, aviso (`showDialog`), entrada (sin sesión), "Instala la agenda" (`isMobile` + navegador).
- [ ] **Step 3:** `huella(page)`: por cada elemento con `data-act` → `[data-act, data-id, data-section, data-spec, texto]`; por cada `input/select/textarea` → `[id, type, value]`; más el texto completo de `#root` y de `#custom-dialog`. Texto normalizado: sin emojis (`/\p{Extended_Pictographic}|️/gu`), sin `‹›`, espacios colapsados. Excluye `[data-act="toggle-tema"]`.
- [ ] **Step 4:** `paridad.mjs`: abre la versión publicada (`git show b5082a2:index.html`) y la del directorio en el mismo emulador, recorre `PANTALLAS` × roles × sedes en 390 y 1517 px y compara huellas; imprime la primera diferencia por pantalla; sale con código ≠ 0 si hay diferencias.
- [ ] **Step 5:** Correr `paridad.mjs` con la versión publicada contra sí misma.
  Run: `ANTES=b5082a2 AHORA=b5082a2 npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node pruebas/rediseno/paridad.mjs"`
  Expected: `0 diferencias` en todas las pantallas (la prueba es estable).
- [ ] **Step 6:** `medidas.mjs`: `revisarMedidas` = la revisión de las maquetas (`scan.js`): scroll horizontal de página, elementos fuera de pantalla no recortados por un contenedor con scroll, texto cortado a lo alto dentro de un contenedor `overflow:hidden` (ignorando `.bar` y líneas ocultas), texto cortado a lo ancho sin `…`, letra < 11 px, botones < 36 px de alto en ≤ 600 px. Recorre `PANTALLAS` × 320/360/390/430/768/1024/1517 × oscuro/claro × Santiago/BA × roles.
- [ ] **Step 7:** Correr `medidas.mjs` sobre la versión publicada (solo oscuro) y guardar la salida en `pruebas/rediseno/medidas-antes.txt` (sirve de referencia: problemas que ya existían).
- [ ] **Step 8:** `capturas.mjs`: guarda PNG de cada pantalla (390 y 1517, oscuro y claro, Santiago y BA) en `$OUT/`.
- [ ] **Step 9: Commit** — `git add pruebas/rediseno && git commit -m "Rediseño: pruebas de paridad, medidas y capturas"`

### Task 2: Variables de color, letras y logo

**Files:**
- Modify: `index.html` — `<head>` (líneas 7–8: Google Fonts; 13: `theme-color`), bloque `<style>` (61–935), estilos en línea con colores dentro de las plantillas (`style="…#xxxxxx…"`), `LOGO_SRC` (1097)
- Create: `fonts/` (Montserrat 400/500/600/700, Cormorant Garamond 500i y "fijo" 600/700, latin y latin-ext, desde `certificado/fonts` y `@fontsource/montserrat`)

**Interfaces:**
- Produces: variables CSS que usan todas las tareas siguientes: `--bg --bg2 --panel --panel-2 --panel-3 --ink --ink-soft --mute --line --line-soft --wine --gold --gold-soft --wine-dark --ok --warn --danger --pending --conf --canc --sombra --ui --head`, y `--ic-agenda --ic-pagos --ic-fin --ic-gar --ic-stock --ic-vale --ic-buscar --ic-bloq`. Los nombres que ya existen (`--wine`, `--gold`, `--ink`…) se conservan.

- [ ] **Step 1:** Agregar a `medidas.mjs` la comprobación "ninguna regla CSS ni `style=` del `#root` usa un color fijo salvo `#fff`, `#000` y los colores de especialista (`colorSeguro`)" y correrla: falla (hoy hay 59 colores distintos y 325 `style=`).
- [ ] **Step 2:** Pasar cada color del CSS y de los `style=` a una variable (los de estados: `.st-*`; los de avisos: `--warn`, `--danger`), con los valores de Global Constraints. Los `rgba(201,162,39,…)` que dependen del dorado pasan a `color-mix(in oklab, var(--wine) N%, transparent)`.
- [ ] **Step 3:** `@font-face` con `fonts/…woff2` (`font-display:swap`); `--ui: 'Montserrat', system-ui, sans-serif`; `--head: 'Cormorant Garamond', Georgia, serif`; `h1,h2,h3,.serif` y montos (`.monto`, totales de Finanzas/Pagos/Mi pago, "Cobrar a la clienta") con `--head` + números rectos. Quitar el `<link>` de Google Fonts.
- [ ] **Step 4:** `LOGO_SRC` = PNG transparente "Sibana" sin "Academia PMU" (de `certificado/assets/logo.png`: borrar x ≥ 495, y ≥ 345, recortar, 2× la altura mostrada); quitar `mix-blend-mode:lighten` del tema BA si ya no hace falta (logo sin fondo).
- [ ] **Step 5:** Agregar a `TEMA_BANDERA_ARGENTINA.reemplazos` cada color oscuro nuevo (fondo/superficies → azules noche: `#100d09→#0A1826`, `#17130d→#081521`, `#211b12→#10243A`, `#2a2217→#17304A`, dorado en `color-mix` → celeste) y comprobar que `aplicarTemaSede` encuentra la hoja (sigue buscando `--wine:`).
- [ ] **Step 6:** Correr `paridad.mjs` (0 diferencias) y la comprobación del Step 1 (pasa). `COMPACT_HEIGHT_PX` se re-mide en Task 4.
- [ ] **Step 7: Commit** — `Rediseño: colores en variables, letras Montserrat/Cormorant y logo Sibana`

### Task 3: Barra de arriba, pestañas y barra de herramientas

**Files:**
- Modify: `index.html` — `render()` (header, ~3961), `staffIdentityBadgeHtml` (2460), `sectionTabsHtml` (4016), `statusLegendHtml` (4028), `toolbarHtml` (4043), CSS de `.topbar`, `.section-tabs`, `.toolbar`, `.specfilter`, `.btn-primary`, `.btn-ghost`, `.viewtoggle`

**Interfaces:**
- Produces: `iconoSvg(nombre: 'agenda'|'pagos'|'fin'|'gar'|'stock'|'vale'|'buscar'|'mas'|'bloq'|'nueva'|'izq'|'der'|'sol'|'luna') -> string` (SVG de línea 24×24, `stroke-width:1.9`, color por `var(--ic-…)` cuando corresponde, `aria-hidden="true"`); `textoSobre(colorHex: string) -> '#0b0a08'|'#ffffff'` (el de más contraste WCAG); `inicialHtml(nombre, color) -> string` (círculo con la inicial).

- [ ] **Step 1:** Prueba en `medidas.mjs`: con 5 especialistas a 1024 y 1517 px, la esquina superior derecha de `[data-act="new-appt"]` queda en la primera fila de la barra y a ≤ 24 px del borde derecho; y `textoSobre('#f5f5f5')==='#0b0a08'`, `textoSobre('#111111')==='#ffffff'`, `textoSobre('#c03aa8')==='#ffffff'`.
- [ ] **Step 2:** Reemplazar los emojis de pestañas y barra por `iconoSvg` (mismo texto, mismo orden). `👤` del nombre → `inicialHtml`. Flechas `‹ ›` → `iconoSvg('izq'|'der')` (el texto del botón queda vacío: la huella las excluye).
- [ ] **Step 3:** Estilos según maquetas `index_v4.html`: pestaña activa dorada con línea inferior; chips de especialista con inicial; `Hoy`/`Día·Semana·Mes` en grupo; `.btn-primary` metálico; línea doble dorada bajo la barra; leyenda de estados con puntos. En teléfono el orden visual y la distribución quedan como hoy (Vale arriba, etc.).
- [ ] **Step 4:** Correr `paridad.mjs` (0) y `medidas.mjs` (pestañas/barra sin problemas nuevos respecto de `medidas-antes.txt`; las de 5 pestañas de dueños siguen cabiendo desde ~390 px y se deslizan más angosto).
- [ ] **Step 5: Commit** — `Rediseño: barra de arriba, pestañas y herramientas con íconos`

### Task 4: Vista Día, Semana y Mes

**Files:**
- Modify: `index.html` — `dayViewHtml` (4124), `weekViewHtml` (4328), `monthViewHtml` (4349), constantes `SLOT_PX`/`COMPACT_HEIGHT_PX` (1515–1519), CSS de `.appt`, `.block`, `.curso-block`, `.ghost-appt`, `.firma-esquina`, etiquetas "Sin abono"/"✍️ Falta firmar"

**Interfaces:**
- Produces: `ajustarFichasDia(raiz: HTMLElement) -> void` — después de cada `render()`, en cada `.appt` oculta (clase `sin-serv`) la línea del tratamiento si no cabe entera y, si aun así no cabe el nombre, pasa a `compact`; nunca deja una línea cortada.

- [ ] **Step 1:** Prueba en `medidas.mjs` sobre Día con `DATOS_PRUEBA` en 320–1517 px: ninguna línea de una ficha cortada a lo alto; la cita de 1 h muestra hora + nombre (y tratamiento si cabe); "Sin abono" y "Falta firmar" están visibles (texto o ícono de esquina) en cada ficha que los lleva; nombre de 45 letras no sale de su ficha. Debe fallar con la versión actual (hoy el tratamiento queda cortado).
- [ ] **Step 2:** Fichas: fondo `color-mix(in oklab, var(--st) 24%, transparent)` sobre `--panel-2`, borde 60%, rayita de especialista y punto de estado; Cancelada tachada. Hora de término en `<span class="fin">` (oculta con `@container (max-width:185px)`); "Sin abono" pasa a ícono con `@container (max-width:130px)`; `container-type:inline-size` en `.appt`.
- [ ] **Step 3:** `ajustarFichasDia` llamada al final de `render()` cuando `ui.view==='day'`; re-medir el alto real de 3 líneas con la letra nueva y fijar `COMPACT_HEIGHT_PX` al valor medido + 1 px (lección 9; dejar el valor y cómo se midió en el comentario). `SLOT_PX` no cambia (56).
- [ ] **Step 4:** Semana y Mes con las mismas variables (puntos y "🚫" de bloqueos de día completo siguen igual).
- [ ] **Step 5:** Correr `paridad.mjs` (0) y `medidas.mjs` (Step 1 pasa).
- [ ] **Step 6: Commit** — `Rediseño: fichas de la vista Día sin líneas cortadas; Semana y Mes`

### Task 5: Modo claro

**Files:**
- Modify: `index.html` — `<head>` (script nuevo antes de `<style>`: aplica el tema antes de pintar), CSS (`:root[data-tema="claro"]{…}`), header en `render()`, manejador de `data-act` (agregar `toggle-tema`), `aplicarTemaSede`/`TEMA_BANDERA_ARGENTINA` (reemplazos y `extra` para claro en BA), `meta theme-color`

**Interfaces:**
- Consumes: `iconoSvg('sol'|'luna')` (Task 3)
- Produces: `TEMA_KEY = 'sibanaTema'`; `temaActual() -> 'oscuro'|'claro'`; `cambiarTema() -> void` (guarda con `safeSetLocal`/`safeRemoveLocal`, pone `document.documentElement.dataset.tema`, actualiza `theme-color`, `render()`); botón `<button class="tema-toggle" data-act="toggle-tema" aria-label="Modo claro|Modo oscuro" title="…">` como PRIMER hijo de `.topbar-right`.

- [ ] **Step 1:** Prueba `pruebas/rediseno/tema.mjs`: sin `sibanaTema` → `html` sin `data-tema` y fondo `#100d09`; tocar `[data-act="toggle-tema"]` → `data-tema="claro"`, `localStorage.sibanaTema==='claro'`, fondo `#f3f2ee`, `header.topbar` sigue oscuro; recargar → sigue claro y la primera captura (antes de cargar Firebase) ya es clara; dueño cambia de sede (📍) → sigue claro; especialista cierra sesión → la entrada se ve clara; volver a tocar → oscuro y se borra la clave. El nombre/"Sede" sigue pegado a la derecha (misma posición x que sin el botón). Debe fallar (no existe el botón).
- [ ] **Step 2:** Script en `<head>`: `try{ if(localStorage.getItem('sibanaTema')==='claro') document.documentElement.dataset.tema='claro'; }catch(e){}`.
- [ ] **Step 3:** `:root[data-tema="claro"]` con los valores claros (fondo `#f3f2ee`, superficies `#fff`, `--ink #1f1910`, `--ink-soft #5d5241`, `--mute #6f644f`, dorado de texto `#836210`, estados de las maquetas `index_v4.html?tema=claro`, íconos `filter:brightness(.72) saturate(1.4)`, tachado de Cancelada oscuro, puntos de estado con su color); `header.topbar` conserva sus colores oscuros fijos.
- [ ] **Step 4:** Botón en el header y `toggle-tema` en el manejador; agregar `toggle-tema` donde se listan acciones permitidas a todos (no en `ADMIN_ONLY_ACTIONS`).
- [ ] **Step 5:** Buenos Aires claro: los reemplazos de `TEMA_BANDERA_ARGENTINA` también cubren las variables claras (dorado de texto → `#1f5f8f`, acento → celeste); la franja de bandera de la barra se mantiene.
- [ ] **Step 6:** Correr `tema.mjs` (pasa), `paridad.mjs` (0, excluyendo `toggle-tema`) y `medidas.mjs` en claro.
- [ ] **Step 7: Commit** — `Rediseño: modo claro con botón sol/luna en la barra de arriba`

### Task 6: Formularios, ventanas y páginas

**Files:**
- Modify: `index.html` — CSS de `.modal`, `.overlay`, `.field`, inputs, `.modal-actions`, `.moremenu`, `#custom-dialog`, `.sync-banner-msg`, `#instalar-gate`, login (`.login-gate*`, `.auth-*`), páginas `fin-main`/`fin-page` (Mi pago, Pagos, Finanzas, Garantías, Stock), certificados (lista y ventanas); `style=` en línea de esas plantillas

- [ ] **Step 1:** Prueba en `medidas.mjs` sobre todas las `PANTALLAS` (oscuro y claro, 320–1517, Santiago y BA, con nombres largos y zoom de texto 130%): 0 problemas nuevos respecto de `medidas-antes.txt`; botones −/+ y flechas de semana ≥ 36 px; ninguna tarjeta dentro de otra tarjeta en Mi pago (filas con línea divisoria).
- [ ] **Step 2:** Estilos de las maquetas `form_v2.html`, `detalle_v2.html`, `mipago_v2.html`: secciones del formulario con título chico dorado e ícono, inputs de 44 px, "Cobrar a la clienta" y totales en Cormorant con números rectos, avisos ámbar, botones de guardar metálicos, filas de "Te faltan N por cerrar" sin recuadro propio.
- [ ] **Step 3:** Ventanas y avisos (`showDialog`, confirmaciones, "Sin conexión", "Hay una versión nueva", "Instala la agenda", "No se pudo leer la base de datos") con las mismas variables; transición de aparición ≤ 200 ms con `prefers-reduced-motion`.
- [ ] **Step 4:** Correr `paridad.mjs` (0) y `medidas.mjs` (Step 1 pasa).
- [ ] **Step 5: Commit** — `Rediseño: formularios, ventanas y páginas`

### Task 7: Revisión final, documentación y capturas

**Files:**
- Create: `DESIGN.md` (sistema visual: variables, letras, íconos, reglas de fichas, modo claro, BA)
- Modify: `CLAUDE.md` (sección "Rediseño visual (oct 2026)": qué cambió, `sibanaTema`, `ajustarFichasDia`, `COMPACT_HEIGHT_PX` nuevo, que un color nuevo va como variable y con su reemplazo en `TEMA_BANDERA_ARGENTINA` y en el claro, y cómo correr `pruebas/rediseno`)

- [ ] **Step 1:** Correr todo: `paridad.mjs` (0), `medidas.mjs` (0 nuevos), `tema.mjs`, y las pruebas de certificados del repo `sibana-certificados/pruebas` contra esta agenda (`agenda.test.mjs`, `pdf.test.mjs`): todas pasan.
- [ ] **Step 2:** Detector de diseño: `IMPECCABLE_BROWSER=<chromium --no-sandbox> impeccable detect --viewport 390x844 <url>` y `1517x860` sobre Día, cita, Mi pago, Nueva cita (oscuro y claro). Aceptados a propósito: rayita de especialista (`side-tab`) y rayas de horas cerradas (`repeating-stripes`). Todo lo demás, corregido.
- [ ] **Step 3:** `capturas.mjs` y enviar a Juan Diego las capturas por pantalla (teléfono y computador, oscuro y claro, Santiago y BA).
- [ ] **Step 4:** Escribir `DESIGN.md` y la sección de `CLAUDE.md`.
- [ ] **Step 5: Commit y push** a `claude/rediseno-visual` (sin publicar en `main` hasta que Juan Diego elija el día del lanzamiento).
