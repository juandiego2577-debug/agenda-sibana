# Rediseño visual de la agenda — diseño acordado (20/10/2026)

Aprobado por Juan Diego en la conversación del 20/10/2026, con maquetas y capturas
(`Propuesta_rediseno_agenda/final/`, imágenes A–J). Este documento junta todo lo decidido para
construirlo sin depender de la memoria de nadie.

## Qué es y qué no es

- **Solo cambia cómo se ve la agenda.** Ninguna función, cálculo, dato guardado ni texto de negocio
  cambia. No se agrega ningún `DOC_KEYS` y no hace falta subir `APP_VERSION`.
- **Intocable:** el lugar y el orden de cada botón (en las dos vistas, Admin y Especialista, teléfono y
  computador); el negro y dorado de Santiago; los colores de la bandera en Buenos Aires.
- **Un solo lanzamiento.** Se construye y se revisa por partes (con capturas para Juan Diego), pero se
  publica todo de una vez, un día tranquilo después de la última cita. Sin botón de "volver al diseño
  anterior": si algo saliera mal, se vuelve atrás con el historial de git.
- Única función nueva: el **modo claro** (ver abajo), pedido explícitamente.

## Identidad

- **Logo:** solo "Sibana" con el rostro dorado, sin "Academia PMU" (sale de
  `certificado/assets/logo.png`, recortado). Reemplaza a `LOGO_SRC`.
- **Letras:** Montserrat para todo el texto de uso (botones, nombres, etiquetas); Cormorant Garamond
  para títulos, fechas grandes y montos de dinero. Los números de Cormorant van siempre **rectos y
  parejos** (`font-variant-numeric: lining-nums tabular-nums`): el "9 raro" de los números antiguos fue
  rechazado. Las letras se alojan en el propio repositorio (carpeta `fonts/`), con las versiones
  "fijas" de Cormorant 600/700 que arreglan las tildes en negrita; se dejan de cargar Fraunces e Inter
  de Google.
- **Colores (oscuro, Santiago):** negro con un toque cálido-dorado, como la agenda de hoy (no "todo
  negro"): fondo `#100d09`, superficies `#17130d` / `#211b12` / `#2a2217`, bordes dorados
  `rgba(201,162,39,.26)` y líneas de las horas `rgba(241,220,170,.13)`. Dorado de Sibana para lo
  activo. Todos los colores pasan a variables en `:root`; nada de colores sueltos en el CSS nuevo.
- **Botón principal** ("+ Nueva cita", "Guardar cita", "Marcar como realizada", "Anotar un vale"):
  dorado metálico con brillo, nunca plano. Sombra neutra (sin halo dorado).
- **Íconos:** dibujados (SVG de línea, todos del mismo grosor) en vez de emojis en botones y pestañas,
  pero **con el color del emoji de antes** para que se reconozcan igual: Bloquear hora rojo, Vale y
  Pagos verde, Finanzas azul, Garantías amarillo, Stock café, Agenda coral, Buscar gris azulado.
  Los emojis dentro de textos y avisos (✍️, ⭐, 🔁…) se quedan.
- **Movimiento:** nada de adorno ni animación de entrada con el logo. Solo respuestas rápidas
  (menos de ¼ de segundo): un botón que se hunde al tocarlo, una ventana que aparece suave. Respeta
  "reducir movimiento" del teléfono.

## Vista Día (la más usada)

- Cada cita se tiñe con el color de su **estado** (Pendiente lila, Confirmada amarillo, Realizada
  verde, Cancelada gris tachada, No llegó rojo) con fuerza suficiente para distinguirlo de un vistazo,
  más la rayita del color de la especialista a la izquierda (se queda: es función) y un punto de estado.
- **Ninguna línea cortada a la mitad.** Una ficha muestra solo las líneas que caben enteras, en este
  orden: hora + estado + avisos, nombre, tratamiento. Lo que no cabe se ve al tocarla. Se mide sobre la
  agenda real (`SLOT_PX`, `COMPACT_HEIGHT_PX` se vuelven a medir, lección 9 de CLAUDE.md); donde hoy se
  ven 3 líneas, se siguen viendo 3 si caben.
- **"Sin abono" y "✍️ Falta firmar" siempre visibles.** En fichas angostas se muestra solo la hora de
  inicio para dejarles lugar; si aun así no caben, pasan a un ícono chico en la esquina (como ya hace
  "Falta firmar").
- Horas cerradas con rayas diagonales suaves (se quedan: es función). Bloqueos en rojo punteado.
- Las especialistas en los filtros llevan un círculo con su inicial; la letra elige negro o blanco
  según el color de fondo para que siempre se lea.

## Pantallas

Todas siguen las mismas reglas: Día, Semana, Mes, Nueva cita / editar (Admin), detalle de la cita
(Especialista), Mi pago, Pagos, Finanzas (Resumen, Gastos, Gráficos), Garantías, Stock, menú Más y
todas sus ventanas (Servicios, Especialistas, Horario, Clientes, Retoques, Reseñas, Cursos,
Certificados, Respaldos, Equipo…), la entrada (contraseña, Crear cuenta), Mi cuenta, los avisos
(`showDialog`, confirmaciones, "Sin conexión", "Hay una versión nueva"), la pantalla "Instala la
agenda" y la de "No se pudo leer la base de datos".

## Modo claro (nuevo)

- **Por defecto todas siguen en oscuro.** Cada persona lo elige en SU aparato (se guarda en
  `localStorage`, como otras preferencias por aparato; nunca en Firebase).
- **Dónde está el botón** (cambiado el 20/10 a pedido de Juan Diego: que las especialistas lo vean
  solas, sin que nadie se los diga, pero sin molestar): un **botón redondo con un sol** (en modo
  oscuro; una luna en modo claro) en la **barra negra de arriba**, justo a la izquierda del nombre
  ("S Salomé") o de "📍 Santiago". Igual para todos, en teléfono y computador. No mueve nada: el
  nombre y "Sede" siguen pegados a la derecha. Sin texto en el teléfono (solo el ícono, con
  "Modo claro"/"Modo oscuro" como descripción para lectores de pantalla y al pasar el mouse).
- Fondo blanco roto neutro (`#f3f2ee`) y superficies blancas; dorado de Sibana más oscuro para que se
  lea sobre blanco; colores de estado suaves; los mismos íconos un poco más oscuros.
- **La barra de arriba con el logo queda negra también en modo claro** (decidido: el logo se ve igual
  que siempre).
- Buenos Aires: el modo claro también aplica, con sus colores de bandera (celeste y sol) en vez del
  dorado; la barra de arriba queda oscura (azul noche) con su franja de bandera, igual que hoy.

## Buenos Aires

El tema se sigue generando reemplazando colores (`TEMA_BANDERA_ARGENTINA` / `aplicarTemaSede`). Cada
color nuevo del CSS debe tener su reemplazo celeste/azul noche; los dos modos se revisan en BA. Lo
amarillo de "Confirmada" sigue siendo el sol.

## Cómo se comprueba

- Todas las pruebas e2e existentes (emulador de Firebase) siguen pasando: confirman que no cambió
  ninguna función. Ningún `data-act`, `id` de campo ni texto que usen las pruebas cambia.
- Revisión automática en 320, 360, 390, 430, 768, 1024 y 1517 px, en oscuro y claro, Santiago y
  Buenos Aires, Admin y Especialista: nada fuera de la pantalla, ningún texto cortado a la mitad,
  ninguna letra de menos de 11 px, botones de al menos ~36 px de alto en teléfono, contraste AA.
- Detector de diseño (impeccable) sobre la agenda real.
- Capturas de cada pantalla para Juan Diego antes de publicar.

## Fuera de alcance

Cambiar textos, ordenar distinto el menú, cambiar qué información muestra cada pantalla, los colores
tornasol del logo de Concepción, y cualquier mejora de función (se anotan aparte si aparecen).
