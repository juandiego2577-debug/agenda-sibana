// ============================================================================
// Respaldo de la agenda Sibana → Hoja de Google + Google Calendar
// ============================================================================
// Este repo solo GUARDA el código: el que funciona de verdad está pegado en
// script.google.com (proyecto del respaldo, "Implementar" como aplicación web
// con acceso "Cualquier usuario"). Cada vez que se guarda o borra una cita, la
// agenda le manda un aviso (doPost) y este script:
//   1. Escribe/actualiza la fila de esa cita en la pestaña "Citas" de la Hoja.
//   2. Crea/actualiza su evento en Google Calendar, lo más parecido posible a
//      la agenda: estado con el mismo color (🟣🟡🟢⚫🔴) en el título, color del
//      evento según la especialista, y toda la información adentro.
//
// Para actualizar el script sin cambiar su dirección (URL):
//   Implementar → Gestionar implementaciones → ✏️ (editar) → Versión: "Nueva
//   versión" → Implementar. (NO "Nueva implementación": eso crea otra URL.)
// Si se pegó código nuevo: antes de implementar, elegir "probar" arriba →
// Ejecutar (pide los permisos que falten y muestra si todo funciona).
// Después, en la agenda: Más → Respaldos → "☁️ Reenviar todo a Sheets/Calendar"
// para que todas las citas ya guardadas tomen el formato nuevo (no duplica
// nada; además junta y borra los eventos que estuvieran repetidos).
// ============================================================================

// Calendario donde van los eventos: el de Sibana, que es el que usan Juan
// Diego y su papá. (La versión anterior usaba "el calendario principal de la
// cuenta donde vive el script"; como el script pasó por la cuenta personal de
// Juan Diego, terminó habiendo eventos en los DOS calendarios y cada cita se
// veía repetida — ver limpiarCalendarioAnterior más abajo.) Si el script vive
// en otra cuenta, esa cuenta necesita permiso de "Realizar cambios en los
// eventos" en este calendario. Vacío = calendario principal de la cuenta.
var CALENDAR_ID = 'sibana.cl@gmail.com';
// Si la agenda no manda su zona horaria (versiones viejas), se usa esta.
var ZONA_POR_DEFECTO = 'America/Santiago';
var HOJA = 'Citas';
// Las primeras 14 columnas son las de siempre (no se tocan, para no
// desordenar la Hoja que ya existe); las nuevas van al final.
var COLUMNAS = ['ID','Fecha','Inicio','Fin','Cliente','Teléfono','Servicios','Especialista','Estado','Precio','Abono','Saldo','Notas','Actualizado',
                'Correo','Personas','Método abono','Método saldo','Por cobrar','Pago marcado por','Curso'];
// Mismos colores que la leyenda de la agenda.
var ESTADOS = {
  Pendiente:  {emoji: '🟣', texto: 'Pendiente'},
  Confirmada: {emoji: '🟡', texto: 'Confirmada'},
  Realizada:  {emoji: '🟢', texto: 'Realizada'},
  Cancelada:  {emoji: '⚫', texto: 'Cancelada'},
  NoShow:     {emoji: '🔴', texto: 'No llegó'}
};
// Los 11 colores que permite Google Calendar para un evento (id → color).
var COLORES_GOOGLE = [['1','#a4bdfc'],['2','#7ae7bf'],['3','#dbadff'],['4','#ff887c'],['5','#fbd75b'],['6','#ffb878'],
                      ['7','#46d6db'],['8','#e1e1e1'],['9','#5484ed'],['10','#51b749'],['11','#dc2127']];
var COLOR_GRIS = '8'; // citas canceladas o en que la clienta no llegó

// Solo se aceptan avisos que vengan de la agenda con una sesión de verdad.
// La dirección de este script está en el código de la agenda (que es
// público), así que antes CUALQUIERA podía mandarle avisos y borrar o
// inventar filas de la Hoja y eventos del Calendar. Ahora la agenda manda su
// "token" de Firebase (una prueba de que entró con contraseña, que vence en
// una hora) y el script le pregunta a Firebase de qué cuenta es: si no es una
// de estas, el aviso se ignora. Para la copia de Buenos Aires de este
// script, cambiar la primera por 'sibana.cl+buenosaires@gmail.com'.
var CUENTAS_PERMITIDAS = ['sibana.cl+equipo@gmail.com', 'juandiego2577+duenos@gmail.com'];
var FIREBASE_API_KEY = 'AIzaSyCpmGl31qLkbXU-OAJyK-thqGYOFnAoa-Y'; // la misma de la agenda (es pública)

// ---------------- Prueba (ejecutar a mano) ----------------
// Elegir "probar" arriba → Ejecutar. La primera vez pide permisos (aceptar).
// Muestra en el registro dónde está la Hoja, si encuentra el calendario y el
// último error que haya tenido un aviso de la agenda (si hubo alguno).
function probar() {
  var hoja = hojaDeCalculo();
  Logger.log('Hoja de respaldo: ' + hoja.getName() + ' → ' + hoja.getUrl());
  var cal = calendario();
  if (!cal) throw new Error('No se encontró el calendario ' + CALENDAR_ID + ' (¿esta cuenta tiene permiso de "Realizar cambios en los eventos"?)');
  var hoy = new Date();
  var eventos = cal.getEvents(hoy, new Date(hoy.getTime() + 7 * 24 * 3600 * 1000));
  Logger.log('Calendario: ' + cal.getName() + ' (' + cal.getId() + ') — eventos en los próximos 7 días: ' + eventos.length);
  var props = PropertiesService.getScriptProperties();
  Logger.log('Último aviso recibido de la agenda: ' + (props.getProperty('ultimoAviso') || 'ninguno todavía'));
  Logger.log('Último error: ' + (props.getProperty('ultimoError') || 'ninguno'));
  Logger.log('Último aviso rechazado (no venía de la agenda): ' + (props.getProperty('ultimoRechazado') || 'ninguno'));
}
function verHoja() { probar(); }
function ahoraTexto() {
  return Utilities.formatDate(new Date(), ZONA_POR_DEFECTO, 'dd/MM/yyyy HH:mm');
}

// La Hoja donde se guarda la copia. Si el script se creó desde la Hoja
// (Extensiones → Apps Script) es esa misma. Si se creó suelto en
// script.google.com no tiene Hoja "propia": antes eso hacía fallar TODO el
// aviso sin que nadie se enterara (ni la Hoja ni el Calendar se
// actualizaban). Ahora usa una Hoja propia, creada la primera vez en el Drive
// de la cuenta del script.
function hojaDeCalculo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('HOJA_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) {}
  }
  ss = SpreadsheetApp.create('Respaldo Agenda Sibana — Citas');
  props.setProperty('HOJA_ID', ss.getId());
  return ss;
}

// De qué cuenta de la agenda viene el aviso (o null si el token no es
// válido o ya venció). Se recuerda 5 minutos para no preguntarle a Firebase
// en cada aviso.
function cuentaDelAviso(token) {
  if (!token || typeof token !== 'string') return null;
  var cache = CacheService.getScriptCache();
  var clave = 'tok_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  var recordada = cache.get(clave);
  if (recordada) return recordada;
  var r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({idToken: token}),
  });
  if (r.getResponseCode() !== 200) return null;
  var u = (JSON.parse(r.getContentText()).users || [])[0];
  if (!u || !u.email || u.disabled) return null;
  var email = String(u.email).toLowerCase();
  cache.put(clave, email, 300);
  return email;
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respuesta({ok: false, error: 'Aviso ilegible'});
  }
  var cuenta = cuentaDelAviso(data.token);
  if (!cuenta || CUENTAS_PERMITIDAS.indexOf(cuenta) < 0) {
    props.setProperty('ultimoRechazado', ahoraTexto() + ' · ' + (cuenta || 'sin sesión válida de la agenda'));
    return respuesta({ok: false, error: 'No autorizado'});
  }
  // Un aviso a la vez: si llegan dos casi juntos para la misma cita (ej. se
  // guarda y enseguida se marca el pago), sin esto los dos podían crear su
  // propio evento → la cita aparecía duplicada.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(120000);
  } catch (err) {
    props.setProperty('ultimoError', ahoraTexto() + ' · Demasiados avisos juntos (se esperó 2 minutos): ' + err);
    return respuesta({ok: false, error: String(err)});
  }
  try {
    // "Reenviar todo" manda las citas en tandas ("lote"); un guardado normal
    // manda una sola ("appointment").
    var avisos = data.lote || [{action: data.action, appointment: data.appointment, extra: data.extra}];
    var errores = [];
    avisos.forEach(function(aviso) {
      var appt = aviso.appointment;
      var extra = aviso.extra || {};
      if (!appt || !appt.id) { errores.push('Aviso sin cita'); return; }
      // La Hoja y el Calendar van por separado: si una falla, la otra igual
      // se hace. Los errores quedan en "Ejecuciones" y en probar().
      try { updateSheetRow(appt, aviso.action, extra); }
      catch (err) { errores.push((appt.client || appt.id) + ' · Hoja: ' + err); }
      try { syncToCalendar(appt, aviso.action, extra); }
      catch (err) { errores.push((appt.client || appt.id) + ' · Calendar: ' + err); }
    });
    var ultima = avisos[avisos.length - 1].appointment || {};
    props.setProperty('ultimoAviso', ahoraTexto() + ' · ' + (ultima.client || ultima.id || '') +
                      (avisos.length > 1 ? ' (tanda de ' + avisos.length + ' citas)' : ''));
    if (errores.length) {
      console.error(errores.join(' | '));
      props.setProperty('ultimoError', ahoraTexto() + ' · ' + errores.join(' | ').slice(0, 8000));
    }
    return respuesta({ok: !errores.length, errores: errores});
  } catch (err) {
    console.error(String(err));
    props.setProperty('ultimoError', ahoraTexto() + ' · ' + err);
    return respuesta({ok: false, error: String(err)});
  } finally {
    lock.releaseLock();
  }
}
function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------- Formato ----------------
function plata(n, moneda) {
  var v = Math.round(Number(n) || 0);
  var s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + '$' + s + (moneda && moneda !== 'CLP' ? ' ' + moneda : '');
}
// "Microblading (MB) ×2 + Lifting" (los servicios repetidos se agrupan)
function serviciosTexto(services) {
  var orden = [], cant = {};
  (services || []).forEach(function(s) {
    if (!cant[s]) { cant[s] = 0; orden.push(s); }
    cant[s]++;
  });
  return orden.map(function(s) { return s + (cant[s] > 1 ? ' ×' + cant[s] : ''); }).join(' + ');
}
function estadoDe(appt) {
  return ESTADOS[appt.estado] || {emoji: '⚪', texto: appt.estado || 'Sin estado'};
}
function cancelada(appt) {
  return appt.estado === 'Cancelada' || appt.estado === 'NoShow';
}
// Cómo se pagó una parte (abono o saldo): "Efectivo" o "$20.000 Efectivo + $30.000 Transferencia"
function pagoTexto(total, metodo1, metodo2, monto2, moneda) {
  var m2 = Number(monto2) || 0;
  if (m2 > 0 && metodo2) {
    return plata(total - m2, moneda) + ' ' + (metodo1 || '¿?') + ' + ' + plata(m2, moneda) + ' ' + metodo2;
  }
  return metodo1 || '';
}
function porCobrar(appt) {
  if (cancelada(appt)) return 0;
  if (appt.metodoSaldo) return 0; // ya se marcó cómo pagó el saldo
  return Math.max(0, (Number(appt.price) || 0) - (Number(appt.abono) || 0));
}
function pagoMarcadoTexto(appt, zona) {
  var m = appt.pagoMarcadoPor;
  if (!m || !m.en) return '';
  var cuando = Utilities.formatDate(new Date(m.en), zona, 'dd/MM HH:mm');
  return (m.nombre || 'una especialista') + ' el ' + cuando;
}
function tituloEvento(appt) {
  var est = estadoDe(appt);
  var quien = appt.cursoId ? ('📚 ' + (appt.cursoNombre || 'Curso') + ' — ' + appt.client)
                           : (appt.client + ' — ' + serviciosTexto(appt.services));
  return est.emoji + ' ' + quien + (appt.specialist ? ' · ' + appt.specialist : '');
}
function descripcionEvento(appt, extra, zona) {
  var moneda = extra.moneda;
  var est = estadoDe(appt);
  var L = [];
  L.push('Estado: ' + est.emoji + ' ' + est.texto);
  L.push('Especialista: ' + (appt.specialist || 'Sin asignar'));
  if (appt.cursoId) L.push('Curso: ' + (appt.cursoNombre || ''));
  else L.push('Tratamientos: ' + serviciosTexto(appt.services));
  if (Number(appt.personas) > 1) L.push('Personas: ' + appt.personas);
  if (appt.phone) L.push('Teléfono: ' + appt.phone);
  if (appt.email) L.push('Correo: ' + appt.email);
  if (appt.rut) L.push('Documento: ' + appt.rut);
  L.push('');
  L.push('Precio: ' + plata(appt.price, moneda));
  var abono = Number(appt.abono) || 0;
  if (abono > 0) {
    var a = 'Abono: ' + plata(abono, moneda);
    var am = appt.abonoPrevio ? 'pagado en una cita anterior' : pagoTexto(abono, appt.metodoAbono, appt.metodoAbono2, appt.montoAbono2, moneda);
    if (am) a += ' (' + am + ')';
    if (appt.abonoDevuelto) a += ' — DEVUELTO a la clienta';
    L.push(a);
  } else if (!cancelada(appt)) {
    L.push('Abono: sin abono');
  }
  if (!cancelada(appt)) {
    var saldo = Number(appt.saldo) || 0;
    var sm = pagoTexto(saldo, appt.metodoSaldo, appt.metodoSaldo2, appt.montoSaldo2, moneda);
    L.push('Saldo: ' + plata(saldo, moneda) + (sm ? ' (' + sm + ')' : ''));
    var pc = porCobrar(appt);
    L.push(pc > 0 ? 'Falta por cobrar: ' + plata(pc, moneda) : 'Pagado ✅');
  }
  var pm = pagoMarcadoTexto(appt, zona);
  if (pm) L.push('Pago marcado por: ' + pm);
  if (appt.notas) { L.push(''); L.push('Notas: ' + appt.notas); }
  L.push('');
  L.push('(Copia automática de la agenda Sibana' + (extra.sede ? ' · ' + extra.sede : '') +
         ' · actualizada ' + Utilities.formatDate(new Date(), zona, 'dd/MM/yyyy HH:mm') + ')');
  return L.join('\n');
}
// Color de Google más parecido al color de la especialista en la agenda.
function colorGoogle(hex) {
  var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return null;
  var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  var mejor = null, dist = Infinity;
  COLORES_GOOGLE.forEach(function(c) {
    if (c[0] === COLOR_GRIS) return; // el gris queda para las canceladas
    var cr = parseInt(c[1].substr(1, 2), 16), cg = parseInt(c[1].substr(3, 2), 16), cb = parseInt(c[1].substr(5, 2), 16);
    var d = (r - cr) * (r - cr) * 2 + (g - cg) * (g - cg) * 4 + (b - cb) * (b - cb) * 3;
    if (d < dist) { dist = d; mejor = c[0]; }
  });
  return mejor;
}

// ---------------- Hoja ----------------
function updateSheetRow(appt, action, extra) {
  var ss = hojaDeCalculo();
  var sheet = ss.getSheetByName(HOJA);
  if (!sheet) {
    sheet = ss.insertSheet(HOJA);
    sheet.appendRow(COLUMNAS);
  } else if (sheet.getLastColumn() < COLUMNAS.length) {
    // Hoja de la versión anterior: se agregan los títulos de las columnas nuevas.
    sheet.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]);
  }
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === appt.id) { rowIndex = i + 1; break; }
  }
  if (action === 'delete') {
    if (rowIndex > 0) sheet.deleteRow(rowIndex);
    return;
  }
  var zona = extra.zonaHoraria || ZONA_POR_DEFECTO;
  var row = [
    appt.id, appt.date, appt.start, appt.end, appt.client, appt.phone || '',
    serviciosTexto(appt.services), appt.specialist || '', estadoDe(appt).texto,
    Number(appt.price) || 0, Number(appt.abono) || 0, Number(appt.saldo) || 0, appt.notas || '',
    new Date(),
    appt.email || '', Number(appt.personas) || 1,
    appt.abonoPrevio ? 'Abono de cita anterior' : (appt.metodoAbono || '') + (appt.abonoDevuelto ? ' (devuelto)' : ''),
    pagoTexto(Number(appt.saldo) || 0, appt.metodoSaldo, appt.metodoSaldo2, appt.montoSaldo2, extra.moneda),
    porCobrar(appt), pagoMarcadoTexto(appt, zona), appt.cursoId ? (appt.cursoNombre || 'Curso') : ''
  ];
  // Un texto que empiece con "=", "+", "-" o "@" la Hoja lo tomaría como
  // fórmula (ej. un teléfono "+56 9 …" daba error): se guarda como texto.
  row = row.map(function(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

// ---------------- Calendar ----------------
function calendario() {
  return CALENDAR_ID ? CalendarApp.getCalendarById(CALENDAR_ID) : CalendarApp.getDefaultCalendar();
}
function fechaHora(fecha, hora, zona) {
  return Utilities.parseDate(fecha + ' ' + hora, zona, 'yyyy-MM-dd HH:mm');
}
// Todos los eventos de esta cita: el que quedó anotado, más los que tengan su
// marca (sibanaId), más los de la versión anterior del script (sin marca) que
// sean claramente la misma cita: mismo título "Clienta — ..." y a menos de 3
// horas de distancia. (Una hora exacta no sirve: la versión anterior armaba la
// hora con la zona horaria del proyecto —Venezuela— y no la de Chile, así que
// sus eventos quedaron corridos una hora.) Así se juntan los duplicados.
var MARGEN_VIEJOS_MS = 3 * 3600 * 1000;
function eventosDeLaCita(cal, appt, zona, props) {
  var lista = [], vistos = {};
  var agregar = function(ev) {
    if (!ev) return;
    var id = ev.getId();
    if (vistos[id]) return;
    vistos[id] = true;
    lista.push(ev);
  };
  var anotado = props.getProperty('evt_' + appt.id);
  if (anotado) { try { agregar(cal.getEventById(anotado)); } catch (e) {} }
  if (appt.date) {
    var dia = fechaHora(appt.date, '00:00', zona).getTime();
    var desde = new Date(dia - MARGEN_VIEJOS_MS);
    var hasta = new Date(dia + 24 * 3600 * 1000 + MARGEN_VIEJOS_MS);
    var inicio = appt.start ? fechaHora(appt.date, appt.start, zona).getTime() : null;
    cal.getEvents(desde, hasta).forEach(function(ev) {
      var marca = ev.getTag('sibanaId');
      if (marca === appt.id) { agregar(ev); return; }
      if (!marca && inicio !== null && appt.client &&
          Math.abs(ev.getStartTime().getTime() - inicio) <= MARGEN_VIEJOS_MS &&
          String(ev.getTitle()).indexOf(appt.client + ' — ') === 0) {
        agregar(ev);
      }
    });
  }
  return lista;
}
function syncToCalendar(appt, action, extra) {
  var cal = calendario();
  if (!cal) throw new Error('No se encontró el calendario ' + CALENDAR_ID);
  var props = PropertiesService.getScriptProperties();
  var key = 'evt_' + appt.id;
  var zona = extra.zonaHoraria || ZONA_POR_DEFECTO;
  var eventos = eventosDeLaCita(cal, appt, zona, props);

  if (action === 'delete') {
    eventos.forEach(function(ev) { try { ev.deleteEvent(); } catch (e) {} });
    props.deleteProperty(key);
    return;
  }

  var start = fechaHora(appt.date, appt.start, zona);
  var end = fechaHora(appt.date, appt.end, zona);
  var titulo = tituloEvento(appt);
  var descripcion = descripcionEvento(appt, extra, zona);
  var color = cancelada(appt) ? COLOR_GRIS : colorGoogle(extra.especialistaColor);

  // Se queda con uno (el anotado si existe) y borra los repetidos.
  var evt = eventos.length ? eventos[0] : null;
  for (var i = 1; i < eventos.length; i++) { try { eventos[i].deleteEvent(); } catch (e) {} }
  if (evt) {
    evt.setTime(start, end);
    evt.setTitle(titulo);
    evt.setDescription(descripcion);
  } else {
    evt = cal.createEvent(titulo, start, end, {description: descripcion});
  }
  if (color) evt.setColor(color);
  evt.setTag('sibanaId', appt.id);
  props.setProperty(key, evt.getId());
}

// ---------------- Limpieza (ejecutar a mano UNA vez) ----------------
// La versión anterior guardaba los eventos en el calendario principal de la
// cuenta donde vive el script. Si ese calendario no es CALENDAR_ID, esos
// eventos quedaron repetidos. Esto borra SOLO los eventos que este script
// creó y tiene anotados (nada más del calendario se toca). Hay que ejecutarlo
// ANTES de "Reenviar todo" en la agenda (que reemplaza esas anotaciones).
function limpiarCalendarioAnterior() {
  var destino = calendario();
  var principal = CalendarApp.getDefaultCalendar();
  if (!destino) { Logger.log('No se encontró el calendario ' + CALENDAR_ID + ': no se borró nada.'); return; }
  if (destino.getId() === principal.getId()) {
    Logger.log('El calendario principal de esta cuenta YA es ' + destino.getId() + ': no hay nada que limpiar.');
    return;
  }
  var props = PropertiesService.getScriptProperties();
  var todas = props.getProperties();
  var borrados = 0, revisados = 0;
  Object.keys(todas).forEach(function(k) {
    if (k.indexOf('evt_') !== 0) return;
    revisados++;
    try {
      var ev = principal.getEventById(todas[k]);
      if (ev) { ev.deleteEvent(); borrados++; props.deleteProperty(k); }
    } catch (e) {}
  });
  Logger.log('Revisados: ' + revisados + ' · borrados del calendario ' + principal.getId() + ': ' + borrados +
             '. Ahora, en la agenda: Más → Respaldos → "Reenviar todo a Sheets/Calendar".');
}
