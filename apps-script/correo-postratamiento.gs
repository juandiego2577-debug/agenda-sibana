/**
 * Correo automático de cuidados post-tratamiento — Sibana
 * ---------------------------------------------------------
 * Este programa vive en la cuenta de Google sibana.cl@gmail.com (los correos
 * salen desde ahí). Todas las noches, a las 20:30 hora de Chile, revisa las
 * citas de ese día en la agenda y, a cada clienta que tenga correo, le manda
 * las imágenes de cuidados que correspondan a su tratamiento.
 *
 * Reglas (decididas con Juan Diego, ver CLAUDE.md de la agenda):
 *  - Solo citas de HOY (y de AYER, por si una noche Google no alcanzó a
 *    correr el envío: así se recupera al día siguiente), con correo, que NO
 *    estén Cancelada ni NoShow
 *    (no se exige "Realizada", para no depender de que alguien la marque).
 *  - Nunca a retoques (ya lo recibieron en la sesión inicial), evaluaciones,
 *    garantías ni inscritos a cursos.
 *  - Nunca dos veces la misma cita: cada envío queda anotado en la Hoja
 *    "Registro correos post-tratamiento" (en el Drive de esta cuenta).
 *  - Si la misma clienta tiene varias citas/tratamientos el mismo día, le
 *    llega UN solo correo con todas las imágenes que correspondan.
 *
 * Instalación (una sola vez):
 *  1. Drive de sibana.cl: carpeta "Post-tratamiento" con dos carpetas dentro,
 *     "Cejas" y "Labios", con sus imágenes (se mandan en orden alfabético
 *     del nombre de archivo: "Cejas 1 …", "Cejas 2 …", etc.).
 *  2. Configuración del proyecto → Propiedades de la secuencia de comandos →
 *     agregar CLAVE_EQUIPO = la contraseña del usuario "sistema" de la agenda
 *     (un usuario de SOLO LECTURA creado para este script; ver EQUIPO_EMAIL).
 *  3. Ejecutar probarEnvio (manda un correo de muestra a esta misma cuenta).
 *  4. Ejecutar instalarEnvioDiario (deja programado el envío de cada noche).
 */

// ---------------- Configuración ----------------
const FIREBASE_API_KEY = 'AIzaSyCpmGl31qLkbXU-OAJyK-thqGYOFnAoa-Y'; // la misma de la agenda (es pública)
const FIREBASE_PROJECT = 'sibana-santiago';
const AGENDA_DOC = 'sibana-agenda/santiago';
// Usuario "sistema" de la agenda: solo puede LEER la agenda de Santiago (rol
// "lector" en las reglas de Firebase), así que aunque alguien sacara su
// contraseña de las propiedades de este script, no podría cambiar ni borrar
// nada. Antes entraba con la cuenta compartida del equipo, que sí podía
// escribir (y que se va a apagar cuando cada especialista tenga su usuario).
const EQUIPO_EMAIL = 'juandiego2577+usr.sistema@gmail.com';
const ZONA = 'America/Santiago';
const HORA_ENVIO = 20, MINUTO_ENVIO = 30;
const CARPETA_RAIZ = 'Post-tratamiento';
const NOMBRE_REGISTRO = 'Registro correos post-tratamiento';

// Qué correo le toca a cada tratamiento, según el NOMBRE del servicio en la
// agenda (sin importar mayúsculas ni tildes). Un servicio que contenga
// "retoque" nunca cuenta. Para sumar un tratamiento: agregar una palabra a
// la lista. Para un tratamiento nuevo (ej. ojos): agregar otra entrada aquí
// y una carpeta con el mismo nombre en Drive.
const TRATAMIENTOS = [
  {carpeta: 'Cejas',  nombre: 'cejas',  palabras: ['microblading', 'sombreado', 'mixbrows']},
  {carpeta: 'Labios', nombre: 'labios', palabras: ['full lips']},
];

// ---------------- Lo que se ejecuta cada noche ----------------
function enviarPostTratamientos() {
  const hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  const registro = abrirRegistro_();
  const yaEnviadas = idsYaEnviados_(registro);
  const citas = leerCitas_();
  const pendientes = correosParaEnviar_(citas, [hoy, diaAnterior_(hoy)], yaEnviadas);
  pendientes.forEach(p => {
    try {
      mandarCorreo_(p.email, p.nombre, p.tratamientos);
      p.citas.forEach(c => registro.appendRow([new Date(), c.date, c.id, p.nombre, p.email, p.tratamientos.map(t => t.nombre).join(' + '), 'Enviado']));
    } catch (e) {
      p.citas.forEach(c => registro.appendRow([new Date(), c.date, c.id, p.nombre, p.email, p.tratamientos.map(t => t.nombre).join(' + '), 'ERROR: ' + e.message]));
    }
  });
  console.log('Correos enviados hoy (' + hoy + '): ' + pendientes.length);
}

// Decide a quién mandarle qué. No toca nada afuera (se puede probar sola).
function correosParaEnviar_(citas, fechas, yaEnviadas) {
  const porCorreo = {};
  citas.forEach(a => {
    if (!a || fechas.indexOf(a.date) < 0) return;
    if (a.estado === 'Cancelada' || a.estado === 'NoShow') return;
    if (a.cursoId) return;
    if (a.id && yaEnviadas[a.id]) return;
    const email = String(a.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const trats = tratamientosDeCita_(a);
    if (!trats.length) return;
    if (!porCorreo[email]) porCorreo[email] = {email: email, nombre: primerNombre_(a.client), tratamientos: [], citas: []};
    const g = porCorreo[email];
    g.citas.push(a);
    trats.forEach(t => { if (g.tratamientos.indexOf(t) < 0) g.tratamientos.push(t); });
  });
  return Object.keys(porCorreo).map(k => {
    const g = porCorreo[k];
    g.tratamientos.sort((x, y) => TRATAMIENTOS.indexOf(x) - TRATAMIENTOS.indexOf(y));
    return g;
  });
}

function tratamientosDeCita_(a) {
  const out = [];
  (a.services || []).forEach(s => {
    const n = sinTildes_(s);
    if (n.indexOf('retoque') >= 0) return;
    TRATAMIENTOS.forEach(t => {
      if (t.palabras.some(p => n.indexOf(p) >= 0) && out.indexOf(t) < 0) out.push(t);
    });
  });
  return out;
}

function diaAnterior_(ymd) {
  const p = ymd.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] - 1));
  return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}
function sinTildes_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function primerNombre_(s) {
  const n = String(s || '').trim().split(/\s+/)[0] || '';
  return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
}

// ---------------- El correo ----------------
function mandarCorreo_(email, nombre, tratamientos) {
  const imagenes = [];
  tratamientos.forEach(t => imagenesDeCarpeta_(t.carpeta).forEach(f => imagenes.push(f)));
  if (!imagenes.length) throw new Error('No hay imágenes en las carpetas de Drive');
  const inline = {};
  let imgsHtml = '';
  imagenes.forEach((f, i) => {
    const cid = 'img' + i;
    inline[cid] = f.getBlob();
    imgsHtml += '<img src="cid:' + cid + '" alt="Cuidados post-tratamiento" style="display:block;width:100%;max-width:600px;height:auto;margin:0 auto 16px;border-radius:8px;">';
  });
  const que = tratamientos.map(t => t.nombre).join(' y ');
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#2A2118;max-width:600px;margin:0 auto;">' +
    '<p style="font-size:16px;">Hola' + (nombre ? ' ' + escaparHtml_(nombre) : '') + ' 💛</p>' +
    '<p style="font-size:16px;line-height:1.5;">¡Gracias por confiar en <b>Sibana</b>! Te dejamos los cuidados para tu tratamiento de <b>' + que + '</b>. ' +
    'Guarda este correo para tenerlo siempre a mano, y recuerda usar la crema post-tratamiento que te entregamos.</p>' +
    imgsHtml +
    '<p style="font-size:16px;line-height:1.5;">Si tienes cualquier duda, escríbenos por WhatsApp. ¡Nos vemos en tu retoque! ✨</p>' +
    '<p style="font-size:16px;">Con cariño,<br><b>Equipo Sibana</b></p></div>';
  const texto = 'Hola' + (nombre ? ' ' + nombre : '') + ', ¡gracias por confiar en Sibana! Te dejamos los cuidados para tu tratamiento de ' + que +
    '. Si no ves las imágenes, abre este correo desde la app de Gmail o desde un navegador. Cualquier duda, escríbenos por WhatsApp. Equipo Sibana';
  MailApp.sendEmail({
    to: email,
    subject: 'Tus cuidados post-tratamiento ✨ Sibana',
    body: texto,
    htmlBody: html,
    inlineImages: inline,
    name: 'Sibana',
  });
}

function imagenesDeCarpeta_(nombreCarpeta) {
  const raices = DriveApp.getFoldersByName(CARPETA_RAIZ);
  if (!raices.hasNext()) throw new Error('No existe la carpeta "' + CARPETA_RAIZ + '" en Drive');
  const subs = raices.next().getFoldersByName(nombreCarpeta);
  if (!subs.hasNext()) throw new Error('No existe la carpeta "' + CARPETA_RAIZ + '/' + nombreCarpeta + '" en Drive');
  const archivos = [];
  const it = subs.next().getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (String(f.getMimeType()).indexOf('image/') === 0) archivos.push(f);
  }
  archivos.sort((x, y) => x.getName().localeCompare(y.getName(), 'es', {numeric: true}));
  return archivos;
}

function escaparHtml_(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
}

// ---------------- Leer la agenda (Firestore) ----------------
function leerCitas_() {
  const clave = PropertiesService.getScriptProperties().getProperty('CLAVE_EQUIPO');
  if (!clave) throw new Error('Falta la propiedad CLAVE_EQUIPO (contraseña del usuario "sistema" de la agenda) en la configuración del proyecto');
  const login = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FIREBASE_API_KEY, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({email: EQUIPO_EMAIL, password: clave, returnSecureToken: true}),
  });
  if (login.getResponseCode() !== 200) throw new Error('No se pudo entrar a la agenda (¿la contraseña del usuario "sistema" en CLAVE_EQUIPO es correcta?): ' + login.getContentText());
  const token = JSON.parse(login.getContentText()).idToken;
  const resp = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents/' + AGENDA_DOC, {
    headers: {Authorization: 'Bearer ' + token}, muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) throw new Error('No se pudo leer la agenda: ' + resp.getContentText());
  const doc = desdeFirestore_({mapValue: {fields: JSON.parse(resp.getContentText()).fields || {}}});
  return doc.appointments || [];
}

// Convierte el formato de Firestore ({stringValue:...}, {arrayValue:...}) a
// objetos normales de JavaScript.
function desdeFirestore_(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(desdeFirestore_);
  if ('mapValue' in v) {
    const out = {};
    const f = v.mapValue.fields || {};
    Object.keys(f).forEach(k => { out[k] = desdeFirestore_(f[k]); });
    return out;
  }
  return null;
}

// ---------------- Registro (Hoja de Google) ----------------
function abrirRegistro_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('REGISTRO_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) { /* se borró: se crea otra */ }
  }
  const ss = SpreadsheetApp.create(NOMBRE_REGISTRO);
  const hoja = ss.getSheets()[0];
  hoja.appendRow(['Enviado el', 'Fecha de la cita', 'ID de la cita', 'Clienta', 'Correo', 'Tratamiento', 'Resultado']);
  hoja.setFrozenRows(1);
  props.setProperty('REGISTRO_ID', ss.getId());
  return hoja;
}

function idsYaEnviados_(hoja) {
  const out = {};
  const filas = hoja.getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    if (String(filas[i][6]) === 'Enviado') out[String(filas[i][2])] = true;
  }
  return out;
}

// ---------------- Para instalar y probar ----------------

// Manda un correo de muestra (cejas + labios) a esta misma cuenta, para ver
// cómo le llega a la clienta. No anota nada en el registro.
function probarEnvio() {
  const yo = Session.getEffectiveUser().getEmail();
  mandarCorreo_(yo, 'Prueba', TRATAMIENTOS);
  console.log('Correo de prueba enviado a ' + yo + '. Revisa la bandeja de entrada.');
}

// Muestra (sin mandar nada) a quién se le enviaría hoy si fueran las 20:30.
function verQueSeEnviariaHoy() {
  const hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  const lista = correosParaEnviar_(leerCitas_(), [hoy, diaAnterior_(hoy)], idsYaEnviados_(abrirRegistro_()));
  if (!lista.length) console.log('Hoy (' + hoy + ') no hay correos para enviar.');
  lista.forEach(p => console.log(p.nombre + ' <' + p.email + '>: ' + p.tratamientos.map(t => t.nombre).join(' + ')));
}

// Deja programado el envío de todas las noches (20:30 hora de Chile).
// Se puede ejecutar de nuevo sin problema: borra el anterior y crea uno solo.
function instalarEnvioDiario() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'enviarPostTratamientos')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('enviarPostTratamientos')
    .timeBased().everyDays(1).atHour(HORA_ENVIO).nearMinute(MINUTO_ENVIO).inTimezone(ZONA)
    .create();
  abrirRegistro_();
  console.log('Listo: el envío queda programado todas las noches a las ' + HORA_ENVIO + ':' + MINUTO_ENVIO + ' (hora de Chile).');
}
