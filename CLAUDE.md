# Agenda Sibana — contexto del proyecto

## Qué es esto
Una agenda interna para el negocio de micropigmentación/belleza "Sibana", hecha
como **un solo archivo HTML** autocontenido (todo el CSS y JS adentro, sin
build ni dependencias que instalar). Se publica tal cual en GitHub Pages.

## Próximo paso arquitectónico (en curso)
Actualmente el archivo sirve solo a la sede de **Santiago**. Se va a extender
para servir también a **Copiapó**, de la siguiente forma (ya decidido, no
replantear salvo que surja algo que realmente lo justifique):

- **Un solo archivo / una sola app** — no dos HTML separados. La razón:
  evitar duplicar cada cambio futuro en dos codebases que se van
  desalineando con el tiempo.
- La primera vez que se abre en un dispositivo, pregunta "¿Santiago o
  Copiapó?" y esa elección queda guardada en ese dispositivo (mismo patrón
  que ya usa el modo Admin/Especialista, con localStorage).
- **Los datos de cada sede viven en documentos separados de Firestore**
  (mismo proyecto de Firebase, dos documentos: `sibana-agenda/santiago` y
  `sibana-agenda/copiapo` — o el nombre que se defina). Nunca se mezclan
  citas, precios ni especialistas entre sedes.
- El panel de "Finanzas" ya construido en la versión de Santiago es la base
  de lo que a futuro será un panel unificado que sume ambas sedes — no hay
  que rehacerlo, solo eventualmente hacerlo leer de los dos documentos.
- **El respaldo a Sheets/Calendar también debe distinguir sede**: el
  webhook (`syncToBackupWebhook`) debe mandar además un campo `site`
  ('santiago' | 'copiapo'). Del lado del Apps Script: `updateSheetRow`
  debe escribir en una pestaña distinta por sede dentro de la MISMA Hoja
  (ej. "Citas Santiago" / "Citas Copiapó"), y `syncToCalendar` debe elegir
  el `CALENDAR_ID` según la sede (Santiago ya usa `sibana.cl@gmail.com`;
  falta confirmar y compartir el calendario real de Copiapó, con permiso
  de "Realizar cambios en los eventos", antes de poder cablear esto).

## Stack / dónde vive cada cosa
- **Datos**: Firebase Firestore (proyecto `sibana-santiago` en Firebase
  Console). Se accede vía el SDK "compat" de Firebase cargado desde
  `cdnjs.cloudflare.com` (NO desde `www.gstatic.com` — ese dominio queda
  bloqueado en algunos visores/entornos sandboxeados; ya causó un bug real).
- **Hosting**: GitHub Pages, repositorio del usuario (cuenta
  `juandiego2577-debug` en GitHub). El archivo se sube como `index.html` en
  la raíz del repo.
- **Respaldo adicional**: un Google Apps Script (Web App, desplegado con
  acceso "Cualquier usuario") recibe un POST cada vez que se guarda o borra
  una cita, y:
  1. Escribe/actualiza una fila en una Hoja de Google (respaldo con
     historial de versiones gratis de Sheets).
  2. Crea/actualiza el evento correspondiente en un Google Calendar
     (actualmente el de la cuenta `sibana.cl@gmail.com`, vía
     `CalendarApp.getCalendarById(...)`, usando permisos compartidos, NO
     la cuenta donde vive el script).
  La URL de este webhook está en la constante `BACKUP_WEBHOOK_URL` del
  HTML. Reemplazar por `PEGA_AQUI...` la deja inactiva sin romper nada.
- **Modo Admin / Especialista**: gateado por una contraseña guardada en
  `state.settings.adminPassword` (dentro del propio documento de
  Firestore, no hay backend de autenticación real). Por defecto arranca
  siempre en modo Especialista; el modo Admin, una vez desbloqueado, se
  recuerda por dispositivo vía localStorage.
- **Seguridad (ya implementada, no hay que rehacerla)**: la app usa Firebase
  Authentication de verdad, en dos capas:
  1. Sesión anónima invisible (`signInAnonymously`) apenas carga la página,
     para que Firestore exija *algún* tipo de sesión.
  2. Login real del equipo (`showTeamLoginGate()`), con email/password de
     Firebase Auth, usuario compartido `equipo@sibanasantiago.app` (una sola
     contraseña para todo el equipo, especialistas y admins). Se pide una
     sola vez por dispositivo (se recuerda igual que el modo Admin).
  La regla de Firestore exige `request.auth != null && sign_in_provider !=
  'anonymous'` para casi todo — la única excepción es la colección
  `sibana-consentimientos`, donde cualquiera puede `create` (con sesión
  anónima) pero no leer/editar/borrar, para que el formulario de
  consentimiento (ver abajo) pueda seguir funcionando sin pedirle login a
  la clienta. Antes de este cambio la base estaba completamente abierta
  (`allow read, write: if true`) — se encontró y cerró en una auditoría.
- **Ficha de consentimiento**: vive en un repo aparte,
  `juandiego2577-debug/sibana-consentimiento` (GitHub Pages, mismo patrón
  de archivo único), NO en este repo. Usa el mismo proyecto Firebase
  (`sibana-santiago`) pero su propia colección (`sibana-consentimientos`).
  Firma con sesión anónima invisible; el "Panel Sibana" (para ver/borrar
  fichas) pide la misma contraseña de equipo que la agenda. Si algo de la
  ficha de consentimiento deja de funcionar, revisar primero las reglas de
  Firestore de esa colección, no asumir que el bug está en este repo.

## Lecciones aprendidas (importante no repetir)
1. **Nunca auto-guardar cuando Firestore reporta que el documento "no
   existe"**, salvo que sea genuinamente la primera vez que se configura
   el proyecto. Un bug así causó que, ante un glitch de conexión pasajero,
   la app reescribiera toda la base de datos real con datos de
   importación histórica — se perdió un día completo de citas reales.
   La función `startRealtimeSync()` ahora nunca guarda nada en la rama de
   "no existe"; además hay una red de seguridad en `saveData()` que
   bloquea cualquier guardado que deje la agenda en 0 citas si antes se
   habían visto varias en la sesión (`lastKnownGoodCount`). Una segunda red
   bloquea cualquier guardado que haga desaparecer de golpe más citas de las
   que se borraron a propósito (`countMissingSyncedAppts` vs. el último
   snapshot; "Eliminar cliente" pasa `saveData({allowRemoved:n})`).
   Además hay un **respaldo automático diario** en la colección
   `sibana-agenda-respaldos` (doc `santiago_YYYY-MM-DD`, nunca se
   sobrescribe, se guardan 60 días, índice en `santiago_indice`) — se ve y
   descarga desde Más → "Respaldos". (El botón manual "Descargar respaldo
   completo" y "Exportar CSV del mes" se quitaron a pedido del usuario:
   quedaron redundantes con esto y con la Hoja de Google.)
2. **Cambiar la cantidad de un servicio (o el checkbox de la crema) en una
   cita YA EXISTENTE nunca debe pisar el abono ya cobrado** — el abono
   automático por defecto ($5.000 por tratamiento) solo debe sugerirse en
   citas NUEVAS (`ui.modal.mode === 'new'`).
3. Las vistas de semana/mes deben calcular ingresos con la misma función
   (`apptRevenue`) que usa el resumen del día — una cita Cancelada o
   NoShow solo aporta su abono, no el precio completo. Hubo un bug donde
   cada vista calculaba esto distinto y los números no cuadraban entre sí.
4. Los métodos de pago se normalizan (`normalizePaymentMethod`) antes de
   sumarlos en los reportes, porque variantes con espacios o mayúsculas
   distintas ("Transferencia " vs "Transferencia") se contaban como
   métodos separados.
5. El botón "Reenviar todo a Sheets/Calendar" (Más → Respaldos) es
   idempotente — nunca duplica filas/eventos, porque cada cita se
   identifica por su `id`. Se puede correr las veces que se quiera.
6. **El nombre de cada especialista se guarda como texto suelto en cada
   cita y hora bloqueada** (`a.specialist`, `b.specialist`) — NO es una
   relación a un ID. Corregirlo solo en `state.specialists` (ej. agregar
   una tilde) deja las citas ya guardadas con el nombre viejo, rompiendo
   el filtro por especialista, Finanzas y "Mis ganancias". Cualquier
   cambio de nombre de una especialista necesita una migración que
   actualice `state.specialists`, `state.appointments` Y `state.blocks`
   a la vez (ver `runSalomeRenameIfNeeded` como ejemplo del patrón).
7. **No asumir reglas de negocio ambiguas — preguntar.** La crema
   post-tratamiento ($5.000) se suma al precio de la cita, y en un cambio
   se asumió sin preguntar que la comisión de la especialista se calculaba
   sobre ese precio completo (incluida la crema). Era incorrecto: la
   crema es 100% para el dueño, nunca se reparte. Antes de tocar cualquier
   cálculo de plata que involucre una regla no confirmada explícitamente,
   preguntar primero.
8. **No cambiar el % de comisión como un valor único global** — si se
   pisa `state.settings.comisionPct` directamente, un cambio a futuro
   recalcula también los meses YA PASADOS al abrir Finanzas. El % vive en
   `state.settings.comisionHistory` (lista de `{desde:'YYYY-MM', pct}`),
   y `comisionPctForMonth(year, month)` decide cuál aplica a cada mes sin
   tocar los anteriores.

## Reglas de negocio de Finanzas (definidas explícitamente, no adivinar)
- **Comisión de especialistas**: 50% por defecto (variable por mes, ver
  punto 8 arriba) sobre lo que genera cada cita — pero NUNCA sobre la
  crema post-tratamiento (ver punto 7) ni sobre el ingreso pasivo del box
  arrendado (abajo). Ver `apptCommissionBase`.
- **Cita Cancelada o NoShow**: cuenta solo el abono como ingreso/comisión
  (si se cobró y no se devolvió) — confirmado explícitamente con el
  usuario, es la regla correcta, no un bug. Si el abono SÍ se devolvió,
  se marca el checkbox "Se le devolvió el abono" en esa cita (visible
  solo en Cancelada/NoShow) — el monto del abono queda igual en el campo
  (registro histórico de lo cobrado), pero no cuenta como ingreso ni
  genera comisión (`a.abonoDevuelto`, ver `apptRevenue`).
- **Ingreso pasivo del box arrendado**: $40.000 por semana (editable en
  Finanzas → "Ingresos y gastos fijos"), 100% para el negocio/dueño, nunca
  se reparte en comisión. Se cuenta una vez por cada semana calendario
  (lunes a domingo) que cae dentro del mes, usando el mismo criterio que
  ya usa el "Corte semanal" de Finanzas (`weekRangesForMonth`).
- **Gastos fijos** (arriendo, luz, internet, etc.): se cuentan completos
  todos los meses, sin importar el día exacto de pago (`diaPago` es solo
  informativo) — confirmado explícitamente, es la forma correcta de
  llevar la contabilidad.
- **Setiembre 2026 fue el mes de transición** de la agenda anterior (en
  papel/informal) a esta — tiene datos incompletos conocidos (ver el 12
  de septiembre, pendiente de que el usuario consiga los datos reales).
  Por eso "Mis ganancias" (el panel que ve cada especialista) no muestra
  nada de septiembre para atrás hasta `state.settings.misGananciasDesde`
  (por defecto, el mes siguiente al que se activó esto) — el modo Admin
  no tiene este candado, siempre ve todo.

## Funciones agregadas (para no reinventar ni duplicar)
- **"Mis ganancias"**: en modo Especialista, la pestaña de Finanzas muestra
  esto en vez del panel completo de Admin — cada especialista elige su
  nombre una vez (se recuerda por dispositivo, `STAFF_IDENTITY_KEY`) y ve
  solo sus propias citas/ingresos/comisión del mes, nada de las demás.
- **Personas por cita** (`a.personas`, por defecto 1, ver `apptPersonas`):
  para fichas donde se atienden varias personas juntas (ej. clienta + amiga).
  Solo se muestra en estadísticas cuando difiere del número de citas. No
  afecta ningún cálculo de plata. Qué servicio se hizo cada persona NO se
  registra (decidido: basta con anotarlo en Notas). También se probó
  esconder este campo y "abono previo" bajo un desplegable "Más opciones"
  en Nueva cita, y el usuario decidió NO hacerlo (riesgo de que se olvide
  marcar las personas) — no volver a proponerlo.
- **Bloquear hora** (`state.blocks`): tres tipos — "Unas horas" (date +
  start/end), "Día completo" (`allDay:true`) y "Varios días" (`allDay:true`
  + `dateEnd`, último día incluido; ej. un viaje). Un bloqueo de varios días
  es UN solo registro (se edita/quita de una vez). Toda lectura de bloqueos
  por fecha debe pasar por `allBlocksForDate` (que ya expande los rangos y
  marca `fullDay`), nunca filtrar `b.date===fecha` directo. Los de día
  completo se ven también en las vistas Semana/Mes ("🚫" + punto de color;
  el nombre se oculta en Mes en teléfono). En la vista Día, los de día
  completo van como aviso arriba de la grilla (no tapan las horas); los de
  unas horas y las CITAS se reparten lado a lado cuando se cruzan (`layoutSideBySide`), para que un bloqueo nunca quede tapado por una cita de otra especialista. El
  bloqueo nuevo viene SIN especialista elegida ("— Elige quién —") —
  decidido: NO vincularlo al nombre de "Mis ganancias". Todas ven los
  bloqueos de todas; se puede tocar una hora libre aunque otra especialista
  la tenga bloqueada (solo un bloqueo de "Todas" la impide).
- **Etiqueta "Sin abono"**: en la ficha de cada cita del día (vista Admin y
  Especialista), aparece un aviso visual cuando la cita no tiene abono
  cobrado (`abono <= 0`) y no está Cancelada/NoShow — para que la
  especialista lo sepa sin tener que abrir el detalle de la cita.
- **Código QR y checkbox/validaciones del consentimiento** (RUT chileno,
  detalle obligatorio si hay alergias, borrar fichas desde el Panel
  Sibana): todo vive en el repo aparte `sibana-consentimiento` (ver
  arriba), no en este.

## Cómo se trabaja en este proyecto
- **Siempre probar antes de entregar.** Este proyecto se construyó
  simulando Firebase con mocks (Playwright + un `window.firebase` falso)
  para verificar cada función antes de darla por buena — no alcanza con
  leer el código, hay que ejecutarlo. Mantener esa disciplina.
- El archivo es grande (miles de líneas) y todo vive en un solo `<script>`
  — no hay módulos ni bundler. Los cambios se hacen editando ese mismo
  archivo directamente.
- Antes de agregar algo complejo, explicar ventajas/desventajas y
  preguntar si de verdad hace falta — no implementar todo lo que se
  ocurra sin filtro.
- Responder siempre en español (el usuario y su equipo son de Chile).
- El usuario (Juan Diego) no es programador — las explicaciones deben ser
  simples, paso a paso, sin dar por sentado vocabulario técnico.
