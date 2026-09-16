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

## Lecciones aprendidas (importante no repetir)
1. **Nunca auto-guardar cuando Firestore reporta que el documento "no
   existe"**, salvo que sea genuinamente la primera vez que se configura
   el proyecto. Un bug así causó que, ante un glitch de conexión pasajero,
   la app reescribiera toda la base de datos real con datos de
   importación histórica — se perdió un día completo de citas reales.
   La función `startRealtimeSync()` ahora nunca guarda nada en la rama de
   "no existe"; además hay una red de seguridad en `saveData()` que
   bloquea cualquier guardado que deje la agenda en 0 citas si antes se
   habían visto varias en la sesión (`lastKnownGoodCount`).
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
5. El botón "Sincronizar todo con Sheets/Calendar" (en el menú Más) es
   idempotente — nunca duplica filas/eventos, porque cada cita se
   identifica por su `id`. Se puede correr las veces que se quiera.

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
