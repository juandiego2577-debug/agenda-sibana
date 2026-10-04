# Agenda Sibana — contexto del proyecto

## Qué es esto
Una agenda interna para el negocio de micropigmentación/belleza "Sibana", hecha
como **un solo archivo HTML** autocontenido (todo el CSS y JS adentro, sin
build ni dependencias que instalar). Se publica tal cual en GitHub Pages.

## Sede de Buenos Aires (en construcción, oct 2026)
Juan Diego va a abrir un Sibana en **Buenos Aires** y pidió tener la agenda
lo antes posible. Decidido con él (no cambiar sin preguntar):
- **Una sola app** (este mismo `index.html`), no una copia — mismo
  razonamiento que se había decidido para Copiapó. Todo funciona "lo más
  copia y pega posible" igual que en Santiago (semana de pago lun–sáb,
  vales, Mis ganancias, retoques, reseñas, etc.), salvo lo que se lista acá.
- **La contraseña con la que se entra decide sede y rol** (`CUENTAS`,
  `aplicarCuenta`). Nunca se pregunta "¿qué sede?" (al usuario le parecía
  tedioso). Tres cuentas de Firebase Auth, con contraseñas DISTINTAS entre
  sí (el login solo pide la contraseña y la prueba con cada cuenta en orden):
  - `equipo@sibanasantiago.app` → Santiago, siempre Especialista, sin botón
    de Admin: `SOLO_DUENOS_ADMIN_SANTIAGO = true` desde el 04/10/2026 (Juan
    Diego y su papá ya entran con la cuenta de dueños). Un teléfono del
    equipo que estaba recordado como Admin pasa solo a Especialista. Con
    `false` vuelve el botón "🔒 Especialista / 🔓 Admin" de antes.
  - `equipo@sibanabuenosaires.app` → Buenos Aires, siempre Especialista,
    sin botón de Admin.
  - `duenos@sibana.app` → Juan Diego y su papá: siempre Admin, con un botón
    "📍 Sede" arriba para cambiar (`cambiarSede` guarda la elección en
    `SEDE_DUENOS_KEY` y RECARGA la página, para no arrastrar nada en memoria).
  - Más → "🔑 Entrar con otra contraseña" (`cambiarDeCuenta`) cierra la sesión.
  - **⚠️ PENDIENTE DE SEGURIDAD — HACER PRIMERO (decidido con el usuario el
    04/10/2026):** los tres correos de arriba son inventados, en dominios que
    NO son del usuario, y aparecen en el código público. Cualquiera puede
    pedir "restablecer contraseña" (Firebase no permite desactivarlo); quien
    compre uno de esos dominios recibiría el enlace y entraría (la de dueños
    puede borrar todo, respaldos incluidos). Se cambian por Gmail del
    usuario con "+": dueños → Gmail PERSONAL de Juan Diego
    (`juandiego2577+duenos@gmail.com`, para que nadie del equipo reciba sus
    restablecimientos), equipo Santiago → `sibana.cl+equipo@gmail.com`,
    equipo BA → `sibana.cl+buenosaires@gmail.com` (hasta que exista el Gmail
    de BA) — confirmar con él antes de tocar nada. ORDEN (no saltarlo):
    1) él crea las 3 cuentas nuevas en Firebase Auth (la consola no deja
    editar el correo; pueden llevar las mismas contraseñas); 2) agenda
    (`CUENTAS`), `firestore.rules` (`puedeSede`) y
    `apps-script/correo-postratamiento.gs` (entra como el equipo de
    Santiago por REST) aceptan correos viejos Y nuevos por unos días — un
    correo que no esté en `CUENTAS` cae como equipo de Santiago, así que un
    teléfono de dueños con sesión vieja quedaría sin Admin; él publica las
    reglas; 3) re-login en cada teléfono; 4) quitar los correos viejos de
    las reglas y RECIÉN DESPUÉS borrar las cuentas viejas (si se borra una
    cuenta cuyo correo sigue en las reglas, cualquiera puede registrarse con
    ese correo y entrar sin comprar nada); 5) Firebase → Authentication →
    Configuración → Acciones del usuario → desmarcar "Habilitar creación
    (registro)". Contraseñas: nunca en el repo.
  - **Estado (05/10/2026):** las dos cuentas nuevas ya se crearon en
    Firebase Auth (la de dueños se había creado con "ñ" — `dueños@...` — y
    se le pidió rehacerla como `duenos@sibana.app`, que es lo que esperan
    la agenda y las reglas) y las reglas de `firestore.rules` YA ESTÁN
    PUBLICADAS en Firebase (reemplazaron a las anteriores, que dejaban a
    cualquier cuenta no anónima leer/escribir todo con `/{document=**}`;
    el 04/10/2026 hubo una versión más nueva, ver "Auditoría de seguridad").
    Las contraseñas NO se guardan en el repo. La agenda nueva se publicó el
    04/10/2026 (PR #72). Para volver a la versión anterior del PROGRAMA basta
    el historial de git (commit 5c2e8d4), pero OJO: hay que subirle
    `APP_VERSION` a 5 o más, porque la base ya quedó marcada con 4 y una
    versión con 3 se negaría a guardar.
- **Todo lo que cambia por país vive en `SEDES`** (zona horaria, código de
  teléfono +54 con su formato de WhatsApp `waPhoneDigitsArgentina`,
  RUT/DNI, colección de consentimientos, URL del script de respaldo, link de
  reseñas, correo post-tratamiento, regla de comisión, abono sugerido). Nada
  de eso se escribe suelto en el código.
- **Datos separados**: documento `sibana-agenda/buenosaires`, respaldos
  `buenosaires_YYYY-MM-DD`, consentimientos en
  `sibana-consentimientos-buenosaires`. Las migraciones/cargas de datos
  viejos (`runSantiagoMigrations`) y las listas por defecto
  (`DEFAULT_SERVICES`/`DEFAULT_SPECIALISTS`) son SOLO de Santiago.
- **El documento de Buenos Aires lo crea un dueño a mano** con el botón
  "Crear la agenda de Buenos Aires" (`crearAgendaSede`): única excepción a
  la lección 1, y es segura (transacción que no hace nada si ya existe;
  nunca para Santiago; nunca automático). Arranca vacío, con los nombres de
  servicios de Santiago a precio $0 y la crema incluida.
- **Comisión en AMBAS sedes: descuento por MICROPIGMENTACIÓN** (confirmado
  con el usuario; `SEDE.descuentoMicro`, `apptCommissionBase`): a cada
  tratamiento de micropigmentación se le resta un monto que queda para el
  negocio, y recién eso se divide 50/50. Todo lo demás (lifting, perfilado,
  laminado...), los retoques y los cursos se reparten 50/50 directo.
  - **Santiago: $10.000 fijos**, solo en citas con los PRECIOS NUEVOS (la
    subida de oct 2026: microblading/sombreado/delineado $69.990, técnica
    mixta (MixBrows) y labios (Full Lips) $99.990 — vino junto con la crema
    incluida y es lo que motivó el sistema, "para que no ganen tan poco").
    Una cita nueva congela `a.conDescuentoMicro` = estado de "crema
    incluida" al crearla; las citas de antes usan `a.cremaIncluidaPolitica`
    (marca lo mismo). Las citas con precio viejo se reparten como antes.
    Los servicios se marcaron con la migración `runMicropigmentacionFlagsIfNeeded`.
  - **Buenos Aires: 10 dólares** en pesos (ver "Valor del dólar" abajo), siempre.
  - Qué es micropigmentación se marca A MANO por servicio (casilla en
    Servicios y tarifario, `s.micropigmentacion`, en las dos sedes). La
    cantidad queda CONGELADA en cada cita al guardarla (`a.tratamientosMicro`,
    solo se recuenta si cambian sus servicios). Cada servicio anotado cuenta
    una vez por unidad (2 personas con el tratamiento ×2 = 2 descuentos).
  - **Valor del dólar (BA)**: historial por FECHA de cita
    (`settings.dolarHistory` = `[{desde, pesos, auto?}]`,
    `valorDolarParaFecha`), Más → "💱 Valor del dólar". De ahí salen los 10
    dólares del descuento y los 5 del **abono sugerido** (redondeado a la
    centena). Cambiarlo nunca recalcula citas anteriores. **Automático**
    (`settings.dolarAuto` = 'oficial' | 'blue' | 'bolsa'(MEP), elegido en ese
    mismo modal): una vez al día cualquier teléfono de BA consulta
    `dolarapi.com` (`actualizarDolarAutomatico`) y, si cambió, agrega el valor
    desde hoy; si la página falla, sigue el último valor. **Pendiente:** el
    usuario no sabe qué dólar usar (lo consulta con su tía, que va a manejar
    la sede) — por eso queda en manual hasta que lo elijan ellos mismos. No
    se pudo probar contra dolarapi.com real (el entorno de pruebas bloquea
    esa conexión), solo con respuestas simuladas.
- **Abono reagendado (`a.abonoPrevio`)**: si la clienta cancela/no viene,
  la cita queda Cancelada/NoShow con su abono (ingreso del negocio, sin
  comisión). Si después reagenda, la cita nueva marca "Este abono ya se pagó
  en una cita anterior": su ingreso es precio − abono (`apptRevenue`; antes
  se contaba dos veces en "Ingreso total"/Finanzas — bug corregido el
  04/10/2026), pero su COMISIÓN es sobre el precio completo (la especialista
  hizo el tratamiento entero).
- **Abono perdido (Cancelada/NoShow) = 100% del negocio, en AMBAS sedes**
  (confirmado con el usuario el 04/10/2026): no genera comisión. En
  Santiago aplica a citas desde `SEDES.santiago.abonoPerdidoSoloNegocioDesde`
  ('2026-10-05', el lunes siguiente — inicio de una semana de pago); las
  anteriores quedan como se calcularon y pagaron (antes la especialista se
  llevaba su % del abono). En Buenos Aires, siempre.
- **Colores de Buenos Aires: los de la bandera argentina** (celeste, blanco
  y el sol dorado), a pedido del usuario aunque se pierdan los de Sibana,
  para que no haya confusión de sede. `TEMA_BANDERA_ARGENTINA` +
  `aplicarTemaSede` generan la hoja de estilos reemplazando cada color de la
  de Santiago; "Confirmada" queda amarilla (sol) para no confundirse con el
  celeste. Un color NUEVO que se agregue al CSS debe sumarse a esos
  reemplazos (y los gráficos SVG usan `style="fill:var(--...)"` por eso).
  **Bug real al publicar (04/10/2026):** en el computador de Juan Diego
  Buenos Aires se veía con los colores de Santiago — la primera versión
  tomaba "la primera `<style>` del `<head>`", y si el navegador o una
  extensión mete la suya antes, se cambiaban los colores de esa y no los de
  la agenda. Ahora `aplicarTemaSede` busca la hoja de la agenda por su
  contenido (`--wine:`) y agrega la versión de la sede como una hoja NUEVA
  al final (`#tema-sede`).
- **Mensajes a clientas con "vos" en Buenos Aires** (`SEDE.voseo`):
  retoques ("¿Querés agendar tu turno?"), "cómo te fue" y reseña. Los textos
  de la propia agenda (para el equipo) siguen con "tú".
- Finanzas de cada sede por separado (no se suman entre sí: son monedas
  distintas). Admin: Juan Diego y su papá en ambas. Gmail aparte para
  Buenos Aires (su propio script de respaldo, todavía sin URL).
- **Estado (04/10/2026):** cuentas creadas, reglas publicadas y la agenda de
  Buenos Aires YA CREADA por los dueños. **Pendiente con el usuario** (lo
  dejó para más adelante): cargar precios en pesos y especialistas de BA;
  elegir el dólar (oficial/blue/MEP); el Gmail de BA y su script de
  respaldo/Calendar (mismo `.gs`, cambiando `CALENDAR_ID` a ese correo;
  Calendar de BA en hora de Buenos Aires; cada sede en su propio Calendar,
  decidido); link de reseñas de Google de BA; ficha de consentimiento con
  DNI (repo `sibana-consentimiento`).

## Posible extensión a Copiapó (en pausa, probablemente no se haga)
**Actualización (oct 2026):** la sede de Copiapó al parecer prefiere seguir
con AgendaPro (ya están acostumbrados), así que esto quizás nunca se
empiece — no avanzar en nada de esto salvo que el usuario lo pida. Si algún
día se retoma, lo que ya se había decidido era:
Actualmente el archivo sirve solo a la sede de **Santiago**. Se extendería
para servir también a **Copiapó**, de la siguiente forma:

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
  **El código está en `apps-script/respaldo-sheets-calendar.gs`** (oct 2026;
  antes no estaba en el repo). Versión nueva, a pedido del usuario, para que
  el Calendar "se parezca lo más posible a la agenda" (por si se pierde todo
  o el papá mira el Calendar en vez de la agenda): título con el estado en
  el mismo color que la leyenda (🟣 Pendiente, 🟡 Confirmada, 🟢 Realizada,
  ⚫ Cancelada, 🔴 No llegó) + clienta + tratamientos + especialista; color
  del evento = el de Google más parecido al de la especialista (gris si
  Cancelada/NoShow, que QUEDAN en el calendario como registro); descripción
  con todo (teléfono, correo, precio, abono/saldo y métodos, por cobrar,
  quién marcó el pago, notas). La agenda le manda `extra` = {sede,
  zonaHoraria, moneda, especialistaColor} (un script viejo lo ignora). Hoja:
  7 columnas nuevas al final (las 14 de siempre no se mueven).
  **Duplicados (bug real):** cada cita se veía DOS veces en el Calendar del
  papá — la versión anterior usaba `getDefaultCalendar()` y el script pasó
  por la cuenta personal de Juan Diego antes de la de Sibana, así que hubo
  eventos en los dos calendarios (y la cuenta de Sibana tiene agregado el
  personal). La versión nueva usa `CALENDAR_ID = 'sibana.cl@gmail.com'`,
  `LockService` (dos avisos juntos ya no crean dos eventos), marca cada
  evento con `setTag('sibanaId', id)`, junta y borra repetidos al guardar,
  y trae `limpiarCalendarioAnterior()` (ejecutar a mano UNA vez antes de
  "Reenviar todo": borra solo los eventos que el script creó en el
  calendario principal de su cuenta, si no es el de Sibana). Probado con un
  simulador de los servicios de Google (Node), no contra Google real.
  **Dónde vive (aclarado el 05/10/2026):** había DOS proyectos — "Proyecto
  sin título" en la cuenta personal juandiego2577@gmail.com (código viejo,
  el que la agenda usaba: …P2E3mNT7c1gw6XA/exec) y "Respaldo Agenda Sibana"
  en sibana.cl@gmail.com. Los dos escribían en el calendario de Sibana (el
  personal con permiso compartido), de ahí los duplicados ("creada por Juan
  Diego"). Ahora `BACKUP_WEBHOOK_URL` apunta a "Respaldo Agenda Sibana"
  (implementación "Sin título", …OVn2/exec, código nuevo). El proyecto
  personal quedó sin uso: conviene ARCHIVAR su implementación.
  **Fallaba sin avisar (04/10/2026):** con la agenda ya apuntando al
  proyecto de Sibana, "Reenviar todo" no cambió nada en el Calendar. Causa
  más probable: ese proyecto se creó suelto en script.google.com (no desde
  la Hoja), así que `getActiveSpreadsheet()` es `null`, la Hoja tiraba error
  y, como iba antes, el Calendar nunca se tocaba (y la agenda manda con
  `no-cors`: nunca ve la respuesta). Ahora `hojaDeCalculo()` usa la Hoja
  propia del script si la tiene o crea/reusa una (`HOJA_ID` en las
  propiedades), Hoja y Calendar van por separado, y los errores quedan en
  "Ejecuciones" y en `probar()` (ejecutar a mano: muestra Hoja, calendario,
  último aviso recibido y último error — lo primero que hay que pedir si el
  Calendar no se actualiza). **Confirmado:** `probar()` creó la Hoja
  "Respaldo Agenda Sibana — Citas" (Drive de sibana.cl; la Hoja vieja queda
  como histórico). **Dos problemas más vistos en el Calendar real el mismo
  día:** (1) "Reenviar todo" mandaba una cita cada 350 ms sin esperar, y el
  script (de a un aviso, por el `LockService`) no alcanzaba: casi todas se
  perdían sin aviso → ahora `runFullBackupSync` manda TANDAS de 15
  (`{lote:[...]}`, `BACKUP_TANDA`) y espera la respuesta de cada una, con
  avance en pantalla y "Listo" recién al terminar; un guardado normal sigue
  mandando una cita sola. (2) La versión vieja armaba la hora con la zona
  del proyecto (Venezuela), así que sus eventos quedaron 1 hora corridos
  respecto de la hora de Chile y no se juntaban con los nuevos → ahora un
  evento viejo (sin marca) cuenta como la misma cita si tiene el mismo
  "Clienta — " y está a menos de 3 h (`MARGEN_VIEJOS_MS`). El calendario de
  Sibana estaba con zona horaria de Venezuela: para que muestre las horas
  como la agenda hay que ponerlo en "Hora de Chile - Santiago"
  (Configuración → General → Zona horaria del calendario). **Funcionó
  (04/10/2026):** con la agenda nueva, "Reenviar todo" dejó UN evento por
  cita en formato nuevo (sin repetidos, color de la especialista). La
  diferencia Chile/Venezuela solo existe con el horario de verano de Chile
  (sept–abril); en invierno tienen la misma hora — por eso no se había
  notado. El proyecto viejo de la cuenta personal quedó sin uso (archivar
  su implementación). Abrir Apps
  Script desde la Hoja con varias cuentas de Google abiertas da "No se puede
  abrir el archivo" → usar una ventana de incógnito con solo sibana.cl.
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
- **Auditoría de seguridad (04/10/2026), a pedido del usuario.** Arreglado
  (puntos 1 y 2; el usuario pidió SOLO esos por ahora):
  1. **Firma con programa escondido (XSS):** cualquiera puede crear una
     ficha sin contraseña, y la firma (`firmaDataUrl`) se ponía tal cual en
     `<img src="...">` en la agenda (`renderConsentSearch`) y en el Panel
     Sibana/PDF del repo de consentimiento — una "firma" armada a propósito
     ejecutaba código con la sesión de quien abriera las fichas (dueños =
     las dos sedes). Ahora `firmaSegura()` (en los DOS repos) solo deja
     pasar `data:image/png;base64,...`, y las reglas exigen lo mismo al
     crear una ficha (más: solo los campos del formulario de Santiago,
     textos ≤3000 caracteres, sí/no booleanos). **Si se agrega un campo al
     formulario de consentimiento, hay que agregarlo a
     `fichaSantiagoValida` en `firestore.rules`**, o las fichas nuevas no se
     guardan. Todo lo que venga de una ficha se muestra con
     `escapeHtml`/`esc`, nunca suelto.
  2. **Respaldos protegidos:** antes la cuenta del equipo podía pisar o
     borrar todos los respaldos. Ahora un respaldo (`<sede>_YYYY-MM-DD` o
     `<sede>_antes-restaurar-...`) solo se crea con la fecha de hoy (±2
     días), nunca se modifica, y solo se borra si tiene más de 29 días (la
     agenda borra los de más de 30; el día de margen es por zona horaria).
     El índice sí se actualiza. El documento de la agenda ya no se puede
     borrar entero (`allow delete` no existe en `sibana-agenda`).
  Probado con el emulador oficial (50 pruebas de reglas + páginas reales
  con el SDK 10.14.1: firmar, Panel Sibana, PDF y la agenda; la versión
  vieja sí ejecutaba la firma maliciosa). **Estado:** las reglas nuevas
  YA ESTÁN PUBLICADAS en Firebase (el usuario las pegó el 04/10/2026).
  **Pendiente (el usuario lo dejó para después):** (3) los correos de las
  cuentas usan dominios (`sibanasantiago.app`, `sibanabuenosaires.app`,
  `sibana.app`) que quizás nadie compró — si alguien los compra puede usar
  "olvidé mi contraseña" y quedarse con la cuenta; propuesta: cambiarlos a
  `sibana.cl+...@gmail.com` o comprar los dominios; (4) los dos repos son
  públicos y `HISTORICAL_IMPORT` tiene nombres/teléfonos de clientas;
  (5) el script de respaldo acepta avisos de cualquiera (puede borrar
  eventos/filas) — verificar el token de Firebase en el script;
  (6) contraseñas largas y cambiarlas cuando alguien se va; (7)
  verificación en dos pasos en GitHub y Google. Ojo: el "modo
  Especialista" es solo visual — la cuenta del equipo puede escribir todo
  el documento de su sede; por eso importan tanto los respaldos protegidos.

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
   `sibana-agenda-respaldos` (doc `<sede>_YYYY-MM-DD`, nunca se
   sobrescribe, se guardan 30 días — antes 60, se bajó a pedido del usuario; la limpieza borra todo lo que figure en el índice con más de 30 días —, índice en `<sede>_indice`) — se ve y
   descarga desde Más → "Respaldos". Su contenido se arma desde `DOC_KEYS`
   (`fullBackupPayload`): antes se escribía a mano y los CURSOS no se
   respaldaban (corregido 04/10/2026). **Restaurar** (oct 2026, pedido del
   usuario): botón "↩️ Restaurar" en cada respaldo (solo Admin, dos
   confirmaciones, `restaurarRespaldo`/`ejecutarRestauracion`); en la misma
   transacción guarda antes una copia de lo actual
   (`<sede>_antes-restaurar-<fecha ISO>`, listada aparte en Respaldos vía
   `<sede>_indice.antesDeRestaurar`) para poder deshacerlo; lo que un
   respaldo viejo no tenga se deja como está; después recarga la página. Si
   la agenda no puede leer sus datos (pantalla "No se pudo leer la base de
   datos") o Buenos Aires aparece "sin crear", un Admin ve un botón para
   abrir los respaldos y restaurar desde ahí (`abrirRescate`). OJO: el
   historial de GitHub guarda el PROGRAMA, no los datos — los datos solo
   están en Firestore (+ estos respaldos + la Hoja de Google).
   **Límite de 1 MiB por documento (cualquier plan de Firebase, pagar NO lo
   cambia):** toda la agenda de una sede es UN documento (~750 bytes por
   cita); con ~100 citas/mes en Santiago se llegaría al límite hacia
   mediados de 2027. Al llegar NO se pierde nada (el guardado falla y
   avisa), pero la agenda deja de poder guardar. Indicador "💾 Espacio
   usado: N%" en Más → Respaldos (cada sede el suyo) y aviso automático a
   Admin al abrir la agenda desde el 80% (`espacioUsado`,
   `avisoEspacioSiHaceFalta`). Usa la fórmula oficial de Firebase
   (`firestoreDocSize`) sobre lo que realmente se guarda (agenda y respaldo
   del día, el más grande), comprobada al byte contra el emulador (acepta
   1.048.576, rechaza 1.048.577). **Pendiente:** antes de llegar (~70–80%),
   archivar los meses viejos en documentos aparte (consultables, incluidos
   en los respaldos). (El botón manual "Descargar respaldo
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
9. **El umbral de "ficha compacta" en la vista Día (`COMPACT_HEIGHT_PX`,
   junto a `SLOT_PX`) es un número medido, no adivinado.** Las fichas de
   citas/bloqueos/cursos muestran 3 líneas apiladas (hora / nombre /
   servicio) cuando hay espacio, o todo en una sola línea con "…" cuando
   no. El umbral original (40px, citas <40min) se puso a ojo y en realidad
   dejaba cortarse el texto por abajo en citas de hasta ~52min (48.5px es
   el punto real donde el layout de 3 líneas empieza a caber) — un bug
   real, reportado por el usuario con una captura. Si se vuelve a tocar el
   tamaño de fuente o el padding de `.appt`, hay que remedir este número
   (ver `test_find_threshold.js` en el historial de pruebas de esta
   sesión como referencia de cómo medirlo), no reusar un valor a ojo.
10. **Un curso puede quedar "huérfano"**: antes el documento de Firestore
    se guardaba completo cada vez, así que si dos dispositivos guardaban
    casi al mismo tiempo, uno le podía pisar el cambio al otro. Pasó de
    verdad con el curso del 25 de octubre: el curso (`state.courses`)
    desapareció pero la cita del inscrito (`a.cursoId`, con su abono y
    precio ya pagados) siguió existiendo — "Ver cursos" lo daba por
    inexistente y la vista Día no mostraba nada (las citas de curso no se
    ven sueltas), pero el resumen del día sí sumaba esa plata, porque
    `summaryHtml` no excluye por `cursoId` (a propósito: si excluyera,
    "Falta por cobrar"/"Ingreso total" del día quedarían mal).
    `runCursoHuerfanoRepairIfNeeded` detecta cualquier cita con `cursoId`
    que no tenga curso correspondiente y reconstruye el curso usando los
    propios datos de la cita. La causa de fondo (guardar el documento
    completo) se resolvió en el punto 12.

11. **Un formulario abierto puede pisar el cambio de otro teléfono.** Una
    especialista marcaba sus citas como realizadas y "se desmarcaban
    solas": si Admin tenía ESA cita abierta (aunque solo mirándola) y
    después tocaba "Guardar", el formulario —con los datos de cuando se
    abrió— pisaba lo que ella había marcado. `saveApptFromForm` usa
    `mergeConcurrentApptChanges` (con `ui.modal.original`, la foto de la
    cita al abrirla): campo por campo, si Admin no tocó un campo y otra
    persona sí lo cambió mientras tanto, se queda el cambio de la otra
    persona.

12. **Guardado sin pisar a los demás (la causa de fondo de 10 y 11).** Los
    teléfonos dejan la agenda (instalada como app) abierta por horas o días
    en segundo plano, y su conexión en tiempo real se "duerme" sin avisar:
    siguen mostrando datos viejos. Antes, `saveData` escribía el documento
    COMPLETO tal como lo tenía ese teléfono, así que cualquier guardado
    desde un teléfono dormido borraba lo que otros habían hecho mientras
    tanto (los pagos marcados por la especialista desaparecían; en
    incógnito "funcionaba" porque siempre carga fresco). Ahora:
    - `saveData` usa `db.runTransaction`: lee la versión más reciente de
      la base de datos y le aplica SOLO lo que este teléfono cambió
      (`mergeDocs`: comparación de 3 vías contra `lastRemoteBase`, la
      última versión que este teléfono recibió, ya normalizada con
      `normalizeDoc`). Listas con `id` (citas, bloqueos, cursos, clientes,
      gastos, stock) se mezclan elemento por elemento y campo por campo;
      listas sin `id` (servicios) y la configuración clave por clave. Un
      borrado gana sobre una edición. Vacío/0/false/"no existe" cuentan
      igual al decidir si un campo cambió (`sameField`).
    - Si no hay señal, el guardado FALLA y lo dice ("No se pudo guardar",
      o a los 6 s "Todavía no se termina de guardar"), y la pantalla vuelve
      a lo que de verdad hay en la base (`restoreFromServer`) — nunca finge
      que se guardó. Aviso rojo arriba "Sin conexión" (`#sync-banner`,
      fuera de `#root`).
    - Al volver a la app (`visibilitychange`), al volver la señal y cada
      2 minutos en pantalla, `refreshFromServer` lee con una transacción
      (una lectura normal usa la misma conexión dormida y se cuelga — se
      comprobó con el emulador) y, si estaba atrasado, reinicia la conexión
      en tiempo real (`restartRealtime`).
    - **`APP_VERSION`**: cada guardado anota `appVersion` en el documento.
      Si un teléfono ve una versión más nueva que la suya, muestra "Hay una
      versión nueva… Recargar" y NO guarda. **Subir `APP_VERSION` cada vez
      que se publique un cambio en cómo se guardan o interpretan los
      datos.** (Los teléfonos con la versión anterior a este cambio no
      tienen esta protección: hay que recargarlos una vez a mano.) Un
      `DOC_KEYS` nuevo (ej. al agregar `vales`) CUENTA como este tipo de
      cambio y también exige subir `APP_VERSION` — un teléfono viejo, al no
      conocer esa clave, la manda como `undefined` al guardar, y
      `mergeList3` la interpreta como "este teléfono la borró", borrando de
      verdad todo lo que hubiera ahí. Pasó de verdad al agregar `vales`
      (ver más abajo): se detectó después de subirlo, no antes — revisar
      esto ANTES de agregar una clave nueva a `DOC_KEYS`, no después.
    - Las redes de seguridad siguen: 0 citas, más citas borradas que las
      permitidas (`allowRemoved`), y "no existe" nunca crea el documento.
    - Se probó con el SDK real de Firebase contra el emulador oficial de
      Firestore (`firebase setup:emulators:firestore`, SDK compat desde npm
      porque cdnjs está bloqueado en el entorno de pruebas), además del
      simulador. Para simular una conexión dormida: dejar colgadas las
      peticiones `Listen/channel`; para sin señal: `context.setOffline(true)`
      (`disableNetwork()` NO sirve: las transacciones igual pasan).

13. **Una prueba nunca debe asumir en qué mes/día real se va a correr.**
    Varias pruebas de Finanzas/Mis ganancias/cursos tenían citas fijas en
    septiembre u octubre de 2026 y daban por hecho que Finanzas (que por
    defecto muestra el mes de `new Date()`, es decir "hoy") y la vista Mes
    (que por defecto muestra `ui.currentDate`, también "hoy") iban a caer
    solas en el mes correcto, o navegaban con un número fijo de clics
    "mes siguiente/anterior" calculado a mano. Mientras "hoy" fue
    septiembre 2026 (mientras se escribieron), funcionaron; en cuanto
    pasó un día real (1 de octubre) dejaron de pasar, sin que nadie
    tocara el código de la app — un bug real detectado en esta sesión,
    nada que ver con el cambio que se estaba probando en ese momento. La
    corrección: fijar explícitamente `ui.reportsDate`/`ui.currentDate`
    con `page.evaluate(() => { ui.reportsDate = new Date(2026,8,1);
    render(); })` (mes 0-indexado) antes de revisar números de un mes en
    particular, en vez de navegar con clics relativos a "hoy" o confiar
    en el valor por defecto. Para algo que depende del reloj real en
    varios puntos a la vez (ej. una migración que calcula "el mes que
    viene" respecto a hoy, `test_mis_ganancias_cutoff.js`), mejor congelar
    el reloj completo de la página con `page.clock.install({time: new
    Date('2026-09-15T12:00:00')})` antes de cargar la agenda, en vez de
    parchar cada síntoma por separado.

## Reglas de negocio de Finanzas (definidas explícitamente, no adivinar)
- **Comisión de especialistas**: 50% por defecto (variable por mes, ver
  punto 8 arriba) sobre lo que genera cada cita — pero NUNCA sobre la
  crema post-tratamiento (ver punto 7) ni sobre el ingreso pasivo del box
  arrendado (abajo), y a cada micropigmentación se le restan antes $10.000
  (Santiago, precios nuevos) / 10 dólares (BA). Ver `apptCommissionBase` y
  "Comisión en AMBAS sedes" arriba.
- **Cita Cancelada o NoShow**: cuenta solo el abono como ingreso (si se
  cobró y no se devolvió) — confirmado explícitamente con el usuario, es la
  regla correcta, no un bug. Ese abono perdido NO genera comisión: es 100%
  del negocio (cambio confirmado el 04/10/2026, para citas desde el
  05/10/2026 en Santiago — ver "Sede de Buenos Aires" arriba; antes sí
  generaba comisión y esos meses no se recalculan). Si la clienta reagenda,
  ver "Abono reagendado" arriba. Si el abono SÍ se devolvió,
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
- **Cursos** (clases grupales, ver más abajo): cada inscrito cuenta en
  Finanzas exactamente igual que una cita normal — mismo `apptRevenue`,
  `apptCommissionBase`, etc. Si el curso tiene una especialista asignada,
  ella se lleva comisión normal por cada inscrito (confirmado
  explícitamente: NO es como el box, que nunca reparte comisión). El
  precio es uno solo, fijo por curso, igual para todos los inscritos (no
  hay precio distinto por persona).
- **Setiembre 2026 fue el mes de transición** de la agenda anterior (en
  papel/informal) a esta — tiene datos incompletos conocidos (ej. el 12
  de septiembre; en oct 2026 el usuario pidió sacarlo de la lista de
  pendientes: no se van a conseguir los datos reales, no volver a pedirlos).
  Por eso "Mis ganancias" (el panel que ve cada especialista) no muestra
  nada de septiembre para atrás hasta `state.settings.misGananciasDesde`
  (por defecto, el mes siguiente al que se activó esto) — el modo Admin
  no tiene este candado, siempre ve todo.
- **Semana de PAGO de comisión: lunes a sábado, confirmado explícitamente
  con el usuario** (`payoutWeekRange`) — se paga el domingo lo generado esa
  semana. Es DISTINTA del "Corte semanal" de Finanzas (lunes a domingo,
  `weekRangesForMonth`), que es solo para reportar ingresos por semana
  calendario, no para calcular pagos — no unificarlas. Los vales (ver
  "Vales" más abajo) se descuentan de la semana de pago (lun–sáb), nunca
  del corte semanal. Si en una semana los vales superan la comisión
  generada, NO se hace nada especial (no se avisa, no se arrastra a la
  semana siguiente) — confirmado explícitamente con el usuario que esto no
  ha pasado nunca y no va a pasar; si algún día pasa, hay que preguntar de
  nuevo antes de asumir qué hacer.

## Funciones agregadas (para no reinventar ni duplicar)
- **Finanzas "en ajuste" (oct 2026, a pedido del usuario):** los números de
  Finanzas todavía no son confiables mientras se termina de ajustar la
  agenda ("si nos guiáramos por Finanzas, pagaríamos mal"). Por eso
  **"Mis ganancias" está OCULTA para las especialistas**
  (`MIS_GANANCIAS_VISIBLE = false`: sin pestaña, y si algo las manda a
  Finanzas vuelven a la agenda) — no quería que creyeran que les
  corresponde un monto que no es. El código sigue intacto para volver a
  mostrarla. Admin conserva Finanzas con un aviso "⚠️ En ajuste… no usar
  para calcular pagos" arriba. La identidad "¿Quién eres?" sigue (vales y
  "pago marcado por").
- **"Mis ganancias"** (OCULTA por ahora, ver arriba): en modo Especialista, la pestaña de Finanzas muestra
  esto en vez del panel completo de Admin — cada especialista elige su
  nombre una vez (se recuerda por dispositivo, `STAFF_IDENTITY_KEY`) y ve
  solo sus propias citas/ingresos/comisión del mes, nada de las demás.
  **Recordatorio visible de "¿quién eres?"** (`checkStaffIdentityIfNeeded`,
  `staffIdentityBadgeHtml`, `ui.modal.type==='staff-identity'`): antes,
  elegir el nombre solo se preguntaba si la especialista entraba por su
  cuenta a Finanzas → Mis ganancias — si nunca abría esa pestaña, el
  teléfono se quedaba sin identidad para siempre (y "Vale"/"pago marcado
  por" le quedaban sin nombre asociado), algo que Juan Diego notó como un
  problema real. Ahora se pregunta sola (con un modal, mismo patrón que
  los demás avisos) la primera vez que se entra en modo Especialista sin
  identidad guardada — tanto al cargar la agenda como al tocar "🔒
  Especialista" desde Admin — y además queda un recordatorio SIEMPRE
  visible arriba del todo ("👤 Nombre" o "👤 ¿Quién eres?" si todavía no
  eligió), que se puede tocar en cualquier momento para elegir o cambiar
  el nombre, sin tener que entrar a Finanzas. Solo se ve en modo
  Especialista (Admin nunca lo necesita). Si el aviso automático se
  descarta sin elegir nombre ("Ahora no"), el aviso de tratamientos
  nuevos que se había saltado mientras tanto (`checkNewServicesIfNeeded`,
  que no se muestra si ya hay otro modal abierto) se vuelve a revisar
  justo después de cerrarlo, para que no se pierda.
- **Personas por cita** (`a.personas`, por defecto 1, ver `apptPersonas`):
  para fichas donde se atienden varias personas juntas (ej. clienta + amiga).
  "Personas atendidas" NO cuenta citas Cancelada/NoShow
  (`apptPersonasAtendidas`); "Citas" sí cuenta todas las fichas.
  Solo se muestra en estadísticas cuando difiere del número de citas. No
  afecta ningún cálculo de plata. Qué servicio se hizo cada persona NO se
  registra (decidido: basta con anotarlo en Notas). También se probó
  esconder este campo y "abono previo" bajo un desplegable "Más opciones"
  en Nueva cita, y el usuario decidió NO hacerlo (riesgo de que se olvide
  marcar las personas) — no volver a proponerlo.
  **`countPersonas` no duplica a la misma clienta**: si tiene más de una
  cita en el período que se está contando (ej. se le agendó dos veces el
  mismo día, a horas distintas — un bug real reportado por el usuario), es
  UNA persona que vino dos veces, no dos personas distintas, así que se
  cuenta una sola vez (agrupando por `a.client` normalizado). Si alguna de
  sus fichas fue con acompañante (`personas>1`), se usa la de más personas
  para no perder al acompañante. Esto corre tanto en el resumen de
  día/semana/mes como en el desglose por especialista de Finanzas
  (`monthFinancials`) y en "Mis ganancias" — mismo `countPersonas` en los
  tres lugares, para que no vuelvan a desalinearse.
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
- **Cuántas citas pueden cruzarse a la misma hora: `NUM_BOXES`** (una
  constante simple, no un ajuste en Configuración — a propósito, cambia muy
  de vez en cuando). Antes había un solo box físico, así que CUALQUIER
  superposición de horario avisaba ("como solo hay un box..."), sin
  importar la especialista. Ahora hay 2 (Lucy trajo su propio box, que ella
  arrienda aparte) — `NUM_BOXES = 2`, así que agendar 2 citas a la misma
  hora ya es normal y no avisa nada; el aviso (`overlappingAppts`, en
  `saveApptFromForm`) recién aparece al intentar una 3ra que se cruce con
  2 que ya están. Si el número de box cambia de nuevo, es solo cambiar esa
  constante. (Esto NO exige subir `APP_VERSION`: es una advertencia que se
  muestra ANTES de guardar, no cambia qué se guarda ni cómo se interpretan
  los datos ya guardados — distinto del caso de `vales` más abajo.)
  **`NUM_BOXES` nunca permite que UNA MISMA especialista quede agendada dos
  veces a la vez, sin importar cuántos box haya** — un bug real: al agregar
  el 2do box, el aviso pasó a mirar solo el total de superposiciones
  (`overlapping.length >= NUM_BOXES`), así que una sola cita encima de otra
  de la MISMA especialista (total=1) nunca llegaba al umbral de 2 y dejaba
  agendar dos citas a la vez para la misma persona — imposible en la vida
  real (no se puede "duplicar"). En `saveApptFromForm`, antes de mirar
  `NUM_BOXES`, se filtran las superposiciones por especialista igual a la
  de la cita que se está guardando (`normalizeName`) y, si hay alguna,
  siempre avisa — pase lo que pase con `NUM_BOXES`. Recién después de ese
  filtro se aplica el aviso de "solo hay `NUM_BOXES` box", que sigue siendo
  solo entre especialistas DISTINTAS.
  **El aviso de "solo hay `NUM_BOXES` box" mira el PICO real de ocupación,
  no cuántas citas simplemente "tocan" el rango de la cita nueva.** Otro bug
  real: dos citas consecutivas de especialistas distintas (ej. 15:30–16:30 y
  16:30–17:30) nunca coinciden entre sí — pero una tercera cita de 90 min que
  empieza a las 15:30 (15:30–17:00) toca el rango de AMBAS sin estar nunca
  las 3 activas al mismo tiempo (como mucho 2 a la vez, nunca 3). Antes,
  `overlapping.length >= NUM_BOXES` contaba cualquier cita que tocara en
  algún punto el horario de la nueva, así que este caso avisaba "solo hay 2
  box" sin motivo real. Ahora `peakBoxOccupancy(candidate, overlapping)`
  recorre el horario de la cita candidata y calcula, con un barrido de
  puntos de inicio/fin, cuántas citas están activas EN EL MISMO INSTANTE en
  el momento de mayor ocupación (contando la propia candidata) — el aviso
  solo aparece si ese pico real supera `NUM_BOXES`, y el detalle que se
  muestra son justo las citas que coinciden en ese instante (no todas las
  que simplemente tocan el rango).
- **Aviso de bloqueos nuevos para Admin** (`checkUnseenBlocksIfNeeded`):
  a Juan Diego se le pasó por alto más de una vez que una especialista
  bloqueó una hora, y solo se enteraba días después al intentar agendar
  justo ahí. Al crear un bloqueo se guarda `b.creadoEn` (los bloqueos
  viejos, de antes de esto, no lo tienen y nunca disparan el aviso). Cada
  bloqueo nuevo se compara contra `state.settings.bloqueosVistosHasta`
  (la última vez que Admin cerró este aviso); si hay alguno más nuevo, se
  muestra un diálogo con quién bloqueó y cuándo, la próxima vez que se
  entra en modo Admin — y también mientras Admin YA tiene la agenda
  abierta, aprovechando que Firestore ya se escucha en tiempo real (si
  alguien bloquea una hora en ese momento, el aviso aparece solo, sin que
  Admin haga nada). No interrumpe si hay un modal abierto (ej. cargando
  una cita). No es una notificación push de verdad — eso necesitaría
  infraestructura aparte (Firebase Cloud Functions de pago, service
  worker) que se evaluó y no se justificaba; esto resuelve el problema
  real sin ese costo.
- **Aviso de tratamientos nuevos para Especialista** (`checkNewServicesIfNeeded`):
  mismo patrón que el aviso de bloqueos de arriba, pero al revés — le
  interesa a quien atiende, no a quien los agrega. Al agregar un servicio
  (`add-service`) se guarda `s.creadoEn` (los servicios viejos no lo tienen
  y nunca disparan el aviso). A diferencia de `bloqueosVistosHasta`
  (compartido en `state.settings`, porque en la práctica hay un solo
  Admin), acá SÍ hay varias especialistas distintas, cada una con su
  propio dispositivo — por eso `SERVICIOS_VISTOS_KEY` se guarda en
  `localStorage` (por dispositivo, igual que `STAFF_IDENTITY_KEY`), NUNCA
  en Firestore: si se guardara compartido, que UNA especialista cierre el
  aviso lo marcaría como visto para TODAS, aunque las demás nunca lo hayan
  visto en su propio teléfono. Cada tratamiento muestra también cuándo se
  agregó ("Agregado el DD/MM a las HH:MM", mismo formato que
  `pagoMarcadoHtml`) — a pedido explícito del usuario, que consideró que
  sin esa fecha/hora el aviso no decía lo más importante.
- **"Ver bloqueos"** (Más → 🚫, solo Admin): lista todos los bloqueos desde
  hoy en adelante (los ya pasados no se muestran, para eso está el
  historial de la vista Mes), ordenados por fecha — para verlos todos
  juntos sin tener que ir cambiando de vista mes por mes. Tocar uno abre
  directo su edición (reusa `edit-block`).
- **Etiqueta "Sin abono"**: en la ficha de cada cita del día (vista Admin y
  Especialista), aparece un aviso visual cuando la cita no tiene abono
  cobrado (`abono <= 0`) y no está Cancelada/NoShow — para que la
  especialista lo sepa sin tener que abrir el detalle de la cita.
- **Código QR y checkbox/validaciones del consentimiento** (RUT chileno,
  detalle obligatorio si hay alergias, borrar fichas desde el Panel
  Sibana): todo vive en el repo aparte `sibana-consentimiento` (ver
  arriba), no en este.
- **Vincular/borrar consentimiento desde la agenda**: dentro de una cita se
  puede buscar y vincular la ficha de consentimiento firmada de esa
  clienta (`renderConsentSearch`). Borrarla desde ahí es **solo Admin**
  (decidido a propósito: si una clienta firmó mal, la solución es volver a
  firmar y vincular la ficha correcta, no borrar la anterior — evita que
  una especialista borre por error una ficha que sí sirve). Borrar una
  ficha desde la agenda o desde el Panel Sibana del repo de consentimiento
  se refleja en ambos lados solo, porque los dos leen/escriben la misma
  colección de Firestore.
- **"Deshacer último cambio"** (Más → "¿Te equivocaste?", solo Admin): un
  solo nivel de deshacer, restaura el documento a como estaba justo antes
  del último guardado real. Nunca queda algo para deshacer después de un
  guardado automático de migración (`saveData({recordUndo:false})`) — ver
  `undoSnapshot`/`lastRemoteData`.
- **Especialistas pueden marcar una cita como pagada/realizada**: desde la
  vista de solo-lectura de su propia cita, pueden elegir el método de pago
  del **saldo** (no del abono), marcar si la clienta compró la crema
  post-tratamiento (`f-staff-crema`, mismo campo `a.cremaComprada` que usa
  Admin — descuenta los $5.000 de la comisión, ver punto 7) y tocar
  "Marcar como realizada y guardar el pago" — así dejan de tener que
  avisarle a Juan Diego a mano (cuaderno/WhatsApp) para que él lo tipee.
  No pueden tocar precio, abono ni ningún otro campo — solo método de
  pago del saldo, la crema, y el estado a "Realizada".
  **Cantidad de cremas** (`a.cremaCantidad`, ver `apptCremas`): tanto Admin
  como la especialista eligen cuántas cremas compró (selector − N +), no
  solo sí/no. Cada crema suma $5.000 al precio y se descuenta completa de
  la comisión. Las citas viejas sin `cremaCantidad` y con
  `cremaComprada:true` cuentan como 1 (`cremaComprada` se sigue guardando
  como `cremaCantidad>0` por compatibilidad). Antes, el checkbox de la
  especialista marcaba la crema SIN sumarla al precio (bug: la comisión le
  restaba $5.000 que nunca se habían sumado) — ahora suma la diferencia a
  `price` y `saldo`.
  **"Crema incluida" (`state.settings.cremaIncluida`, Servicios y
  tarifario → casilla "🧴 Crema post-tratamiento incluida")**: a partir de
  octubre 2026 la crema post-tratamiento pasa a venir incluida gratis (ya
  no se cobra aparte), junto con una subida de precios que Juan Diego
  carga él mismo en Servicios y tarifario (no requiere código, porque cada
  cita ya guarda su propio precio para siempre apenas se agenda — nunca se
  recalcula sola). Es un interruptor manual, no un corte automático por
  fecha/hora — decidido explícitamente así para no depender del reloj de
  cada celular (que puede estar mal puesto) y para que Juan Diego tenga
  control total del momento exacto, igual que con los precios.
  Mientras la casilla está apagada, "Nueva cita" sigue mostrando el
  stepper de crema normal (`cremaStepperHtml`), exactamente como antes.
  Al crearse, cada cita NUEVA congela para siempre, en
  `a.cremaIncluidaPolitica`, si ese interruptor estaba prendido o no en
  ese momento (mismo patrón que `comisionHistory`: prender/apagar el
  interruptor después NUNCA reordena citas ya agendadas). Si
  `cremaIncluidaPolitica` es `true`, esa cita nunca vuelve a mostrar el
  stepper de crema (ni en el formulario de Admin al editarla, ni en la
  vista de solo-lectura de la especialista) — en su lugar se ve "Incluida
  sin costo adicional", y su `cremaCantidad` queda en 0 para siempre (sin
  cobro ni descuento de comisión, porque nunca se le sumó nada al
  precio). Las citas VIEJAS (de antes de esta función, sin
  `cremaIncluidaPolitica`) siguen mostrando el stepper normal siempre,
  sin importar el estado actual del interruptor.
  **Corregir una cita ambigua a mano** (botón discreto
  `#toggle-crema-policy-btn`, solo Admin, solo al EDITAR una cita ya
  existente — nunca en "Nueva cita"): a pedido explícito del usuario, por
  si alguna cita quedó agendada justo en el momento ambiguo del cambio
  (con la condición que no correspondía). El botón muestra, en texto
  chico, la acción contraria a la condición actual de ESA cita
  (`d.cremaIncluidaPolitica`) y permite cambiarla — solo para esa cita,
  sin tocar el interruptor general ni ninguna otra cita. Al pasar a
  "incluida" descuenta del precio/saldo justo el monto de las cremas que
  ya tenía cargadas (y las deja en 0); al volver a la condición anterior,
  simplemente vuelve a mostrar el stepper de crema normal, sin alterar el
  precio hasta que se toque el stepper. **Importante:** este botón
  expuso un bug real y pre-existente (no causado por él, pero sí
  encontrado al construirlo): tocar el stepper de crema al EDITAR una
  cita ya existente llamaba a `recomputeServiceFields()`, que recalcula
  el precio total desde la lista de precios ACTUAL de `state.services` —
  contradice directamente la regla ya confirmada de que una cita vieja
  mantiene su precio congelado aunque se edite después (ver "Crema
  incluida" más arriba). Se corrigió de forma acotada: el stepper de
  crema, SOLO al editar (no al crear una cita nueva, donde sí corresponde
  recalcular todo desde la lista actual), ahora ajusta el precio/saldo
  únicamente por la diferencia de cremas (±$5.000 por unidad), sin tocar
  el resto del precio. La recalculación general de PRECIO POR CANTIDAD DE
  SERVICIOS al editar (no solo crema) sigue teniendo este mismo problema
  de fondo (en oct 2026 el usuario pidió sacar "la lista completa de
  precios" de los pendientes — no insistir; arreglarlo solo si vuelve a
  aparecer como problema real).
  **Un retoque NUNCA lleva la crema incluida gratis** — a pedido
  explícito del usuario: se puede seguir comprando aparte (ej. si la
  clienta perdió o se le acabó la que le dieron en el tratamiento
  inicial), pero no se regala en el retoque, sin importar el interruptor
  general de "crema incluida". Solo aplica a citas NUEVAS (`isRetoqueAppt`,
  mismo detector que usa "Retoques pendientes" — si CUALQUIER servicio
  elegido coincide con "retoque", toda la ficha cuenta como retoque). En
  `apptModalHtml`, `cremaIncluidaActive` (calculado al abrir el modal) ya
  descarta la crema incluida si la selección inicial de servicios es un
  retoque; además, `recomputeServiceFields()` revisa la selección ACTUAL
  cada vez que cambian los servicios marcados (no solo al abrir el
  modal), para que el stepper de crema aparezca o se esconda solo según
  se agregue o quite un retoque — si al esconderlo ya había una cantidad
  cargada, se resetea a 0 antes de recalcular el precio. Al editar una
  cita ya existente esto NO se revisa automáticamente (el interruptor
  manual `#toggle-crema-policy-btn` de más arriba ya da control total
  sobre esa cita en particular, sin necesitar detección automática ahí).
  **Pago con dos métodos** (ej. parte en efectivo y parte por
  transferencia): botón "➕ Pagó con dos métodos" en la vista de la
  especialista. Usa los mismos campos que Admin (`metodoSaldo2` +
  `montoSaldo2` = lo pagado con el segundo método; el resto del saldo queda
  en `metodoSaldo`), así que Finanzas (`paymentBreakdown`) y el formulario
  de Admin lo muestran sin nada extra. Se valida que los dos métodos sean
  distintos y que el segundo monto sea menor que el saldo total.
  Al marcar se guarda también `a.pagoMarcadoPor` ({nombre, en}) y se ve en
  la cita ("✅ Pago marcado por X el …"). `nombre` es SOLO el que el
  teléfono tiene elegido en "Mis ganancias" — si no tiene ninguno (ej. modo
  incógnito) queda vacío y se muestra "en modo Especialista (desde un
  teléfono sin nombre elegido)". Antes se suponía la especialista de la
  cita, y una prueba hecha por Juan Diego apareció como si la hubiera
  hecho ella (confundió el diagnóstico). Además, se manda al respaldo de
  Sheets/Calendar (antes NO se mandaba), y solo se le dice "Listo, el pago quedó
  guardado" cuando Firestore confirma; si tarda más de 6 s, se le avisa que
  no cierre la agenda (sin señal, el cambio se ve en pantalla pero se pierde
  si se cierra). Si cambió el método o las cremas y toca "Cerrar"/fuera del
  modal sin guardar, se le pregunta antes de cerrar.
- **Retoques pendientes** y **Reseñas pendientes** funcionan DISTINTO a
  propósito (aunque antes se habían igualado, y resultó ser un error real
  de uso — ver más abajo): en Reseñas SÍ tiene sentido pedir la opinión
  una sola vez, así que marcar la casilla hace desaparecer a la clienta
  para siempre. En Retoques, en cambio, conviene poder **insistir varias
  veces** durante toda la ventana (una clienta puede no responder al
  primer mensaje y sí agendar si se le vuelve a escribir unos días
  después) — así que tocar "📨 Avisada hoy" (`a.retoqueUltimoAviso`,
  fecha) NO la saca de la lista, solo actualiza un "Avisada hace N días" /
  "Sin avisar todavía" junto a su fila, para saber a quién conviene
  insistirle. Solo desaparece cuando agenda una cita posterior o cuando
  pasan los 50 días desde la sesión (`touchupCandidates`, ventana 30–50
  días — el retoque mantiene su precio normal ~45 días, los 50 son un
  margen antes de darlo por perdido del todo). Reseñas pide primero un
  mensaje "Paso 1" (preguntar cómo le fue, genérico, sin pedir nada) antes
  del "Paso 2" (pedir la reseña en Google) — a propósito, para no pedirle
  una reseña pública a alguien que podría tener un reclamo sin resolver.
  El **"Lifting de Pestañas" no lleva retoque** (a diferencia de
  micropigmentación, que sí) — a pedido explícito del usuario, una ficha
  cuyo único servicio (o uno de ellos) sea Lifting de Pestañas no aparece
  en Retoques pendientes (`isLiftingPestanasAppt`, mismo patrón que
  `isRetoqueAppt`/`isEvaluacionAppt`/`isGarantiaAppt`: si CUALQUIER
  servicio de la ficha coincide, se excluye la ficha completa).
- **Cursos** (`state.courses` + `a.cursoId`/`a.cursoNombre` en las citas):
  para clases grupales de un solo día/horario (ej. un curso de
  micropigmentación), NO citas individuales. Un curso es un bloque de
  fecha/hora + nombre + especialista opcional + precio por persona (fijo
  para todos los inscritos). Cada inscrito (nombre, RUT, correo, teléfono
  opcional, abono/saldo/método de pago/estado) se guarda como una cita más
  en `state.appointments`, marcada con `cursoId`/`cursoNombre` — así
  Finanzas, comisión, "Mis ganancias" y el respaldo a Sheets/Calendar la
  toman automático, sin duplicar ningún cálculo. En la vista de Día, todos
  los inscritos de un mismo curso se agrupan en UN solo bloque ("📚 Nombre
  — N inscritos", `.curso-block`) en vez de mostrarse uno al lado del
  otro — al tocarlo se abre la lista de inscritos (`cursoModalHtml`). Ver
  y tocar el bloque lo puede hacer cualquiera (Admin o Especialista), pero
  agregar/editar/borrar inscritos o el curso mismo es **solo Admin**
  (decidido explícitamente). Reutilizable: se crea uno nuevo por cada
  curso futuro desde Más → "Ver cursos" → "+ Nuevo curso" — a propósito NO
  hay un botón en la barra principal (los cursos son poco frecuentes, no
  debía competirle protagonismo a "+ Nueva cita" ni cambiarla de lugar).
  Si se edita el nombre/fecha/hora/especialista del curso, se propaga a
  todos sus inscritos ya guardados. Borrar el curso borra también todos
  sus inscritos de una vez (avisa cuántos antes de confirmar). El curso
  también tiene un campo de texto libre opcional (`c.notas`, "Lugar /
  temario / notas") para guardar cosas como la dirección o el contenido
  que se les manda a las inscritas — solo se ve dentro del curso, no se
  manda a nadie ni afecta ningún cálculo.
- **Vales** (`state.vales`, `{id,specialist,date,monto,notas}`): plata que
  una especialista va sacando de la caja durante la semana a cuenta de su
  comisión — a veces fraccionada en varios días y a veces sin avisar ni
  anotarla en ningún lado, con lo que se perdía la cuenta. Botón "💵 Vale"
  en la barra principal, visible en AMBOS modos (a propósito — no en el
  menú "Más", que en modo Especialista ni siquiera existe; va al FINAL de
  la barra, después de "+ Nueva cita", para no correr de lugar ningún
  botón ya existente — ver "Orden de los botones" más abajo). Cualquiera
  puede registrar un vale (Especialista
  registra el suyo propio, identificada igual que en "Mis ganancias" con
  `STAFF_IDENTITY_KEY` — el campo de especialista le queda fijo, no
  elegible; Admin elige a quién); **borrar uno ya cargado es solo Admin**
  (mismo criterio que otros borrados sensibles del proyecto: evita que se
  borre por error o a propósito evidencia de plata ya sacada). Se
  descuentan de la semana de PAGO lun–sáb (ver regla de negocio arriba,
  NO del "Corte semanal"), mostrado como "💵 Semana de pago en curso" con
  comisión / vales / neto a pagar, tanto en "Mis ganancias" como en el
  panel de Finanzas de Admin (`payoutWeekBoxHtml`/`payoutRows`,
  `finanzasResumenHtml`).
- **Correo de la clienta** (`a.email`, campo "Correo electrónico" debajo
  del teléfono en la cita): se guarda limpio y en minúsculas, se valida el
  formato al guardar (vacío se permite) y, al elegir una clienta del
  autocompletado, se rellena solo con el correo de su cita más reciente que
  tenga uno (`lastEmailForClient` — NO se guarda en `state.clients`). La
  especialista lo ve en la vista de solo-lectura pero no lo edita. Viaja
  solo al respaldo de Sheets/Calendar (va dentro de la cita). No exigió
  subir `APP_VERSION`: no es un `DOC_KEYS` nuevo, y un teléfono viejo que
  edite la cita conserva el campo (`saveApptFromForm` parte de `...d`).
  **Para qué es (pendiente, decidido con el usuario):** mandar sola, por
  correo, la información post-tratamiento, que hoy se olvida mandar a mano.
  Reglas ya confirmadas: se manda todas las noches a las **20:30 hora de
  Chile** (`America/Santiago`) a todas las citas de ese día que tengan
  correo, MENOS Cancelada/NoShow (no se exige "Realizada", para no depender
  de que alguien la marque), evaluaciones, retoques (ya lo recibieron en la
  sesión inicial) e inscritos a cursos; nunca dos veces a la misma cita. El
  post-tratamiento son IMÁGENES (una o varias), distintas por tratamiento —
  plan: una carpeta de Google Drive por tratamiento, el correo adjunta todas
  las imágenes de la carpeta que corresponda (varios tratamientos en una
  cita = un solo correo con todas). Debe salir desde `sibana.cl@gmail.com`:
  hacerlo con un Apps Script aparte, creado en esa cuenta, sin tocar el
  script de respaldo que ya funciona.
  **El script está en `apps-script/correo-postratamiento.gs`** (este repo
  solo lo guarda; se instala pegándolo a mano en script.google.com con la
  cuenta sibana.cl). Lee la agenda directo de Firestore por REST, entrando
  como `equipo@sibanasantiago.app` (contraseña en la propiedad del script
  `CLAVE_EQUIPO`, nunca en el código). Toma citas de hoy Y de ayer (si una
  noche falla, se recupera al día siguiente); anota cada envío en una Hoja
  "Registro correos post-tratamiento" (Drive de sibana.cl), que es lo que
  evita repetir. Qué correo le toca a cada cita sale de `TRATAMIENTOS` (por
  palabras en el nombre del servicio; un servicio con "retoque" nunca
  cuenta): cejas = microblading/sombreado/mixbrows, labios = full lips.
  **Pendiente:** el usuario debe confirmar si Perfeccionamiento y Realce
  son micropigmentación de cejas (por ahora NO se les manda). Delineado de
  ojos no se manda hasta que haya imágenes de ojos. Imágenes: carpeta
  `Post-tratamiento/Cejas` y `/Labios` en ese Drive, en orden alfabético
  (Cejas: cuidados, proceso de cicatrización, retención de pigmento;
  Labios: cuidados, proceso de cicatrización, fotos día a día — los
  "cuidados" son diseños propios con la marca Sibana; los demás son
  imágenes del usuario con el logo cambiado a Sibana). Probado con un
  simulador de los servicios de Google (Node + mocks), no contra Google
  real (aunque la prueba de envío real del usuario funcionó). Instalado y
  con el envío diario programado (`instalarEnvioDiario`) el 03/10/2026.
  **Aviso dentro de la cita** (`postcareStatusHtml`, en el formulario de
  Admin al editar y en la vista de la especialista): SOLO "⚠️ Sin correo
  anotado" y solo mientras el envío está pendiente (cita futura, u hoy
  antes de las 20:30 hora de Chile — `sedeNow`, porque Juan Diego a veces
  usa la agenda desde otro país); para pedirle el correo a la clienta antes
  de que se vaya. Con correo anotado no se muestra nada: una versión que
  decía "se le enviarán por correo hoy a las 20:30" se quitó a pedido del
  usuario (siempre dice lo mismo, no aporta). **La agenda NO sabe si un correo ya salió**: se
  probó una versión en que el script anotaba cada envío en una colección
  aparte de Firestore para mostrar "✅ enviado" en la cita, pero exigía
  que el usuario volviera a pegar el script en Google y decidió que no
  valía la pena (opción "B") — se volvió atrás en ambos lados; el registro
  de envíos queda solo en la Hoja "Registro correos post-tratamiento". El
  script del repo es exactamente el que está instalado. No volver a
  proponer el ✅ salvo que el usuario lo pida. Citas anteriores a
  `POSTCARE_DESDE` (2026-10-03) no muestran nada. `POSTCARE_TRATAMIENTOS`
  (agenda) y `TRATAMIENTOS` (script) deben mantenerse iguales.
  El botón "📲 Recordatorios de mañana" (Más → Seguimiento) se QUITÓ a
  pedido del usuario: nunca lo usaban (mandan la confirmación como
  respuesta rápida de WhatsApp, reenviada a todas). No volver a agregarlo.

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
- Responder siempre en español. **Juan Diego es venezolano** (el negocio y
  las clientas son de Chile): con él usar español neutro, SIN modismos
  chilenos ("al tiro", "te tinca", "lata", "cachai", etc.) — lo pidió
  explícitamente. Los textos que van dirigidos a las clientas sí pueden
  sonar a Chile.
- El usuario (Juan Diego) no es programador — las explicaciones deben ser
  simples, paso a paso, sin dar por sentado vocabulario técnico.
- **"+ Nueva cita" siempre arriba a la derecha (computador, modo Admin).**
  Al agregar una 4ta especialista, la fila de filtros por especialista
  crecía y empujaba "+ Nueva cita" a la segunda línea (abajo a la
  izquierda) — el usuario pidió que quede SIEMPRE en el mismo lugar. Ahora
  (CSS `.toolbar.toolbar-admin`, solo pantallas >720px) es la fila de
  filtros la que se achica, SIEMPRE en una sola línea (una primera versión
  la partía en dos líneas y al usuario le pareció muy feo — no volver a
  eso): con más de 3 especialistas los botones se compactan
  (`.specfilter-compact`) y, si aun así no caben (5+), la fila se desliza de
  lado con el borde derecho difuminado (`.has-more`, se calcula en
  `render()`). "💵 Vale" va siempre al inicio de la 2da línea
  (`.toolbar-break`). En la práctica hay 2 especialistas fijas (Salomé y
  Lucy) más 1–2 de reemplazo. Modo Especialista y teléfono NO cambian. Se
  midió con 3, 4 y 5 especialistas a 1024–1517px de ancho (la pantalla de
  Juan Diego equivale a ~1517px): con 3 especialistas todo quedó en la
  misma posición exacta que antes.
- **Orden de los botones: nunca mover uno ya existente.** El equipo ya
  está acostumbrado a dónde está cada botón (sobre todo en la barra
  principal) — un botón nuevo se agrega estrictamente al final de donde
  vaya (ej. `.toolbar`), nunca insertado en el medio, aunque eso "tenga
  más sentido" visualmente. Insertar uno en el medio corre de lugar a los
  que venían después, y eso ya generó una queja real (el botón "+ Nueva
  cita" "se movió" al agregar "💵 Vale" en el medio, en vez de al final).
