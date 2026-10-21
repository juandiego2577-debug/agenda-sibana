// Herramientas compartidas por las pruebas del rediseño: siembra datos
// INVENTADOS en los emuladores de Firebase, abre la agenda (cualquier versión)
// apuntando a ellos, entra como dueño o como especialista y recorre pantallas.
// Ver LEEME.md para cómo correrlas.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { execSync } from 'child_process';
import { createRequire } from 'module';

export const AGENDA_DIR = path.resolve(process.env.AGENDA_DIR || new URL('../..', import.meta.url).pathname);
const require = createRequire(import.meta.url);
const NM_FIREBASE = path.dirname(require.resolve('firebase/package.json'));
export const ORIGEN = 'http://127.0.0.1:5099'; // loopback: si no, Chrome bloquea las llamadas al emulador de Auth
export const HOY = '2026-10-20T13:10:00-03:00'; // martes 20/10/2026, 13:10 hora de Chile
export const CLAVE = 'ClaveDePrueba123';
export const CORREO_DUENOS = 'juandiego2577+duenos@gmail.com';
export const CORREO_SALOME = 'salome@prueba.cl';

// ---- datos inventados (nunca de clientas reales) ----
const cita = (id, date, start, end, client, service, specialist, estado, price, abono, extra = {}) => ({
  id, date, start, end, client, phone: '+56 9 1234 56' + id.replace(/\D/g, '').padStart(2, '0').slice(-2), email: '',
  services: [service], specialist, estado, price, abono, metodoAbono: abono ? 'Transferencia' : '',
  saldo: price - abono, metodoSaldo: estado === 'Realizada' ? 'Transferencia' : '', notas: '', ...extra });
export function datosPrueba({ nombresLargos = false } = {}) {
  const largo = 'María Fernanda de los Ángeles Valenzuela Rodríguez';
  return {
    specialists: [
      { id: 'e1', name: 'Salomé', color: '#2f9e57' },
      { id: 'e2', name: 'Lucy', color: '#c03aa8' },
      { id: 'e3', name: 'Melissa', color: '#7fd3db' },
      { id: 'e4', name: nombresLargos ? 'María José Fernanda' : 'Helen', color: '#f28c28' },
    ],
    services: [
      { name: 'Microblading (MB)', price: 69990, duration: 120, micropigmentacion: true },
      { name: 'Full Lips (FL)', price: 99990, duration: 120, micropigmentacion: true },
      { name: 'Delineado de Ojos (DO)', price: 69990, duration: 60, micropigmentacion: true },
      { name: 'Retoque Microblading (RMB)', price: 19990, duration: 60 },
      { name: 'Lifting de Pestañas', price: 29990, duration: 60 },
      { name: 'Perfilado de cejas', price: 9990, duration: 30 },
      { name: 'Garantía de servicio', price: 0, duration: 60 },
      { name: 'Evaluación', price: 0, duration: 30 },
    ],
    appointments: [
      cita('c1', '2026-10-20', '10:00', '12:00', 'Camila Ahumada', 'Microblading (MB)', 'Salomé', 'Realizada', 69990, 5000),
      cita('c2', '2026-10-20', '10:30', '11:15', 'Isamary Jordán', 'Lifting de Pestañas', 'Lucy', 'Realizada', 29990, 5000),
      cita('c3', '2026-10-20', '12:30', '13:30', 'Emma Carrasco', 'Retoque Microblading (RMB)', 'Salomé', 'Confirmada', 19990, 0),
      cita('c4', '2026-10-20', '12:00', '13:30', 'Karyn García', 'Microblading (MB)', 'Lucy', 'Confirmada', 69990, 5000),
      cita('c5', '2026-10-20', '14:30', '16:30', 'Fernanda Rojas', 'Full Lips (FL)', 'Salomé', 'Pendiente', 99990, 5000),
      cita('c6', '2026-10-20', '16:00', '17:00', 'Daniela Muñoz', 'Delineado de Ojos (DO)', 'Lucy', 'Cancelada', 69990, 5000),
      cita('c7', '2026-10-20', '15:00', '15:30', 'Valentina Soto', 'Perfilado de cejas', 'Melissa', 'Pendiente', 9990, 0),
      cita('c8', '2026-10-20', '17:30', '18:30', 'Antonia Pérez', 'Lifting de Pestañas', nombresLargos ? 'María José Fernanda' : 'Helen', 'Confirmada', 29990, 5000),
      cita('c9', '2026-10-20', '15:00', '16:00', nombresLargos ? largo : 'Paula Herrera', 'Perfilado de cejas', nombresLargos ? 'María José Fernanda' : 'Helen', 'Confirmada', 9990, 5000),
      cita('c10', '2026-10-19', '11:00', '13:00', 'Lorena Díaz', 'Microblading (MB)', 'Salomé', 'NoShow', 69990, 5000),
      cita('c11', '2026-10-06', '10:00', '12:00', 'Rocío Fuentes', 'Microblading (MB)', 'Salomé', 'Realizada', 69990, 5000),
      cita('c12', '2026-10-08', '15:00', '17:00', 'Carla Méndez', 'Full Lips (FL)', 'Lucy', 'Realizada', 99990, 5000),
      cita('c13', '2026-10-16', '11:00', '12:00', 'Rocío Fuentes', 'Garantía de servicio', 'Lucy', 'Realizada', 0, 0, { garantiaDe: 'Microblading (MB)' }),
      cita('c14', '2026-10-24', '10:00', '17:00', 'Ana Torres', 'Curso de prueba', 'Salomé', 'Confirmada', 150000, 25000,
        { cursoId: 'k1', cursoNombre: 'Curso de prueba', rut: '11.111.111-1' }),
    ],
    blocks: [{ id: 'b1', date: '2026-10-20', start: '18:00', end: '20:00', specialist: 'Salomé', motivo: 'Trámite' }],
    courses: [{ id: 'k1', nombre: 'Curso de prueba', date: '2026-10-24', start: '10:00', end: '17:00', specialist: 'Salomé', price: 150000, notas: 'Lugar de prueba' }],
    vales: [{ id: 'v1', specialist: 'Salomé', date: '2026-10-20', monto: 10000, notas: 'Prueba' }],
    expenses: [{ id: 'g1', date: '2026-10-10', monto: 12000, categoria: 'Insumos', descripcion: 'Algodón' }],
    clients: [], stockItems: [], ajustes: [], pagos: [], recurringExpenses: [], recurringIncomes: [],
    settings: {},
  };
}

// ---- emuladores ----
let env;
export async function prepararEmulador(opts = {}) {
  env = env || await initializeTestEnvironment({ projectId: 'sibana-santiago',
    firestore: { rules: fs.readFileSync(path.join(AGENDA_DIR, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
  await env.clearFirestore();
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/sibana-santiago/accounts', { method: 'DELETE' });
  const alta = async email => {
    const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: CLAVE, returnSecureToken: true }) });
    if (!r.ok) throw new Error('auth ' + await r.text());
    return (await r.json()).localId;
  };
  await alta(CORREO_DUENOS);
  const uidSalome = await alta(CORREO_SALOME);
  const datos = opts.modificar ? opts.modificar(datosPrueba(opts)) : datosPrueba(opts);
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await db.doc('sibana-agenda/santiago').set(datos);
    await db.doc('sibana-agenda/buenosaires').set(datos);
    await db.doc('sibana-usuarios/' + uidSalome).set({ usuario: 'salome', nombre: 'Salomé', nombreCompleto: 'Salomé Prueba',
      email: CORREO_SALOME, sede: 'santiago', rol: 'especialista', activo: true });
  });
}
export async function cerrarEmulador() { if (env) await env.cleanup(); }

// ---- la agenda ----
export function htmlDe(version) {
  const html = version === 'trabajo' ? fs.readFileSync(path.join(AGENDA_DIR, 'index.html'), 'utf8')
    : execSync(`git -C "${AGENDA_DIR}" show ${version}:index.html`, { maxBuffer: 64 << 20 }).toString();
  const marca = 'db.settings({ experimentalForceLongPolling: true });';
  if (!html.includes(marca)) throw new Error('no encontré db.settings en ' + version);
  return html.replace(marca, marca + " db.useEmulator('127.0.0.1', 8080); firebase.auth().useEmulator('http://127.0.0.1:9099', {disableWarnings:true});");
}

let browser;
export async function navegador() { return browser = browser || await chromium.launch(); }
export async function cerrarNavegador() { if (browser) await browser.close(); browser = null; if (srv) { srv.close(); srv = null; } }

// Servidor local de verdad (con route() Chrome bloquea las llamadas a los emuladores).
let srv, htmlActual = '';
async function servidor() {
  if (srv) return;
  srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, ORIGEN).pathname);
    if (p === '/' || p === '/index.html') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(htmlActual); }
    const f = path.join(AGENDA_DIR, p);
    if (!f.startsWith(AGENDA_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(''); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
  });
  await new Promise(r => srv.listen(5099, '127.0.0.1', r));
}
const TIPOS = { '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' };

// Abre la agenda y entra. Devuelve {page, ctx, errores, cerrar}.
export async function abrirAgenda({ html, rol = 'duenos', sede = 'santiago', ancho = 1517, tema = 'oscuro', movil = false }) {
  const b = await navegador();
  const ctx = await b.newContext({ viewport: { width: ancho, height: ancho > 600 ? 900 : 844 },
    ...(movil ? { isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' } : {}) });
  await ctx.route('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.14.1/*', route => {
    const f = route.request().url().split('/').pop().replace('.min.js', '.js');
    route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(NM_FIREBASE, f), 'utf8') });
  });
  await servidor(); htmlActual = html;
  await ctx.route(/^https:\/\/(?!cdnjs)/, route => route.abort());
  await ctx.addInitScript(({ tema, sede }) => {
    try {
      // solo la primera vez: después manda lo que la agenda haya guardado
      if (!sessionStorage.getItem('pruebaTemaPuesto')) {
        sessionStorage.setItem('pruebaTemaPuesto', '1');
        if (tema === 'claro') localStorage.setItem('sibanaTema', 'claro'); else localStorage.removeItem('sibanaTema');
      }
      localStorage.setItem('sibanaSedeDuenos', sede);
      localStorage.setItem('sibanaServiciosVistosHasta', '2099-01-01T00:00:00.000Z');
      localStorage.setItem('sibanaInstalarBannerOculto', String(Date.now()));
      sessionStorage.setItem('sibanaInstalarSaltado', String(Date.now()));
    } catch (e) {}
  }, { tema, sede });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(HOY)); // todas las versiones ven el mismo "hoy"
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  if (process.env.DEPURAR) page.on('console', m => console.log('[consola]', m.type(), m.text().slice(0, 300)));
  await page.goto(ORIGEN + '/');
  await entrar(page, rol);
  return { page, ctx, errores, cerrar: () => ctx.close() };
}

export async function entrar(page, rol) {
  await page.waitForSelector('#team-login-input', { timeout: 30000 });
  await page.waitForTimeout(1500); // la entrada se vuelve a dibujar cuando termina la sesión anónima
  if (rol === 'especialista') await page.fill('#team-login-user', CORREO_SALOME);
  await page.fill('#team-login-input', CLAVE);
  await page.click('#team-login-btn');
  await page.waitForSelector('[data-act="new-block"]', { timeout: 30000 });
  await esperarCalma(page);
}

// Espera a que la agenda termine de guardar migraciones y de redibujar.
export async function esperarCalma(page) {
  await page.waitForFunction(() => typeof ui !== 'undefined' && !ui.saving && (typeof pendingSaves === 'undefined' || !pendingSaves.length), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}

// Vuelve a la vista Día del martes 20/10, sin ventanas abiertas.
export async function inicio(page) {
  await page.evaluate(() => {
    ui.modal = null; ui.menuOpen = false; ui.section = 'agenda'; ui.view = 'day';
    ui.currentDate = new Date(2026, 9, 20); ui.reportsDate = new Date(2026, 9, 1); ui.specialistFilter = 'all';
    const d = document.getElementById('custom-dialog'); if (d) d.remove();
    render();
  });
  await page.waitForTimeout(150);
}
const clic = async (page, sel) => { await page.click(sel, { timeout: 4000 }); await page.waitForTimeout(250); };

// Pantallas a recorrer: cada una parte desde inicio().
const menu = (act, extra) => ({ nombre: act, roles: ['duenos'], ir: async p => { await clic(p, '[data-act="toggle-menu"]'); await clic(p, `[data-act="${act}"]`); if (extra) await extra(p); await p.waitForTimeout(500); } });
export const PANTALLAS = [
  { nombre: 'dia', roles: ['duenos', 'especialista'], ir: async () => {} },
  { nombre: 'semana', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="view-week"]') },
  { nombre: 'mes', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="view-month"]') },
  { nombre: 'buscar', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="open-search"]') },
  { nombre: 'nueva-cita', roles: ['duenos'], ir: p => clic(p, '[data-act="new-appt"]') },
  { nombre: 'aviso', roles: ['duenos'], ir: async p => { await clic(p, '[data-act="new-appt"]'); await clic(p, '[data-act="save-appt"]'); await p.waitForTimeout(300); } },
  { nombre: 'editar-cita', roles: ['duenos'], ir: p => clic(p, '[data-act="edit-appt"][data-id="c5"]') },
  { nombre: 'cita-sin-abono', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="edit-appt"][data-id="c3"]') },
  { nombre: 'cita-propia', roles: ['especialista'], ir: p => clic(p, '[data-act="edit-appt"][data-id="c5"]') },
  { nombre: 'mi-pago', roles: ['especialista'], ir: p => clic(p, '[data-act="goto-section"][data-section="finanzas"]') },
  { nombre: 'pagos', roles: ['duenos'], ir: p => clic(p, '[data-act="goto-section"][data-section="pagos"]') },
  { nombre: 'finanzas', roles: ['duenos'], ir: p => clic(p, '[data-act="goto-section"][data-section="finanzas"]') },
  { nombre: 'finanzas-gastos', roles: ['duenos'], ir: async p => { await clic(p, '[data-act="goto-section"][data-section="finanzas"]'); await clic(p, '[data-act="finance-tab"][data-tab="gastos"]'); } },
  { nombre: 'finanzas-graficos', roles: ['duenos'], ir: async p => { await clic(p, '[data-act="goto-section"][data-section="finanzas"]'); await clic(p, '[data-act="finance-tab"][data-tab="graficos"]'); } },
  { nombre: 'garantias', roles: ['duenos'], ir: p => clic(p, '[data-act="goto-section"][data-section="garantias"]') },
  { nombre: 'stock', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="goto-section"][data-section="stock"]') },
  { nombre: 'menu', roles: ['duenos'], ir: p => clic(p, '[data-act="toggle-menu"]') },
  menu('open-services'), menu('open-specialists'), menu('open-schedule'), menu('open-clients'), menu('open-noshows'),
  menu('open-touchups'), menu('open-reviews'), menu('open-courses'), menu('open-blocks-list'), menu('open-autobackups'),
  menu('open-security'), menu('open-valores-sede'), menu('open-equipo'), menu('open-certificados'),
  menu('open-courses', p => clic(p, '[data-act="open-curso"][data-id="k1"]')),
  { nombre: 'vale', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="open-vales"]') },
  { nombre: 'bloquear', roles: ['duenos', 'especialista'], ir: p => clic(p, '[data-act="new-block"]') },
  { nombre: 'mi-cuenta', roles: ['especialista'], ir: p => clic(p, '[data-act="open-mi-cuenta"]') },
  { nombre: 'sede', roles: ['duenos'], ir: p => clic(p, '[data-act="open-sede"]') },
];
PANTALLAS.forEach((s, i) => { if (s.nombre === 'open-courses' && PANTALLAS.findIndex(x => x.nombre === 'open-courses') !== i) s.nombre = 'curso'; });

// Recorre las pantallas de un rol y llama a fn(nombre) en cada una ('NO-DISPONIBLE' si no se pudo abrir).
export async function recorrer(page, rol, fn) {
  for (const s of PANTALLAS.filter(s => s.roles.includes(rol))) {
    await inicio(page);
    let ok = true;
    try { await s.ir(page); } catch (e) { ok = false; }
    await fn(s.nombre, ok);
  }
}

// Huella de una pantalla: qué botones hay, en qué orden, con qué datos y textos.
export async function huella(page) {
  return page.evaluate(() => {
    const norm = t => (t || '').replace(/\p{Extended_Pictographic}|️|‍|[‹›⋯]/gu, '').replace(/\s+/g, ' ').trim();
    const out = [];
    const raiz = [document.getElementById('root'), document.getElementById('custom-dialog')].filter(Boolean);
    for (const r of raiz) {
      for (const el of r.querySelectorAll('[data-act]')) {
        if (el.dataset.act === 'toggle-tema') continue;
        const datos = Object.entries(el.dataset).filter(([k]) => k !== 'act').map(([k, v]) => k + '=' + (k === 'uid' ? '*' : v)).sort().join(',');
        out.push(`act:${el.dataset.act}[${datos}]${el.classList.contains('active') ? '*' : ''}${el.disabled ? '!' : ''} "${norm(el.textContent)}"`);
      }
      for (const el of r.querySelectorAll('input,select,textarea')) out.push(`campo:${el.id || el.name || '?'}:${el.type}:${el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value}`);
      const clon = r.cloneNode(true);
      clon.querySelectorAll('[data-act="toggle-tema"]').forEach(e => e.remove());
      out.push('texto:' + norm(clon.textContent));
    }
    return out;
  });
}

// Revisión de medidas: devuelve la lista de problemas (vacía = bien).
export async function revisarMedidas(page) {
  return page.evaluate(() => {
    const W = innerWidth, out = [];
    const vis = e => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.fontSize) > 0 && e.getClientRects().length; };
    const lbl = e => (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase()) + (e.dataset && e.dataset.act ? '[' + e.dataset.act + ']' : '') + ' "' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '"';
    if (document.documentElement.scrollWidth > W + 1) out.push('PAGINA-SCROLL-HORIZONTAL ' + document.documentElement.scrollWidth);
    const todos = [...document.body.querySelectorAll('*')].filter(vis);
    const recortaX = a => /(hidden|auto|scroll|clip)/.test(getComputedStyle(a).overflowX);
    for (const e of todos) {
      const r = e.getBoundingClientRect(); if (!r.width) continue;
      if (r.right > W + 1 || r.left < -1) {
        let a = e.parentElement, cubierto = false;
        while (a && a !== document.body) { if (recortaX(a)) { const ar = a.getBoundingClientRect(); if (ar.right <= W + 1 && ar.left >= -1) { cubierto = true; break; } } a = a.parentElement; }
        if (!cubierto) out.push('FUERA-DE-PANTALLA ' + lbl(e));
      }
    }
    for (const c of todos.filter(e => /hidden|clip/.test(getComputedStyle(e).overflowY) && e.clientHeight > 0)) {
      const cr = c.getBoundingClientRect();
      for (const t of c.querySelectorAll('*')) {
        if (!vis(t) || t.classList.contains('bar')) continue;
        if (![...t.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) continue;
        const tr = t.getBoundingClientRect();
        if (tr.top < cr.bottom - 1 && tr.bottom > cr.bottom + 1 && tr.top >= cr.top - 1) out.push('CORTADO-ABAJO ' + lbl(c) + ' > ' + lbl(t));
      }
    }
    for (const t of todos) {
      const own = [...t.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
      if (!own) continue;
      const s = getComputedStyle(t);
      // (un texto oculto a propósito para lectores de pantalla mide 1 px: no cuenta)
      if (t.clientWidth > 2 && t.scrollWidth > t.clientWidth + 1 && /hidden|clip/.test(s.overflowX) && s.textOverflow !== 'ellipsis') out.push('CORTADO-LADO ' + lbl(t));
      if (parseFloat(s.fontSize) < 11) out.push('LETRA-CHICA ' + s.fontSize + ' ' + lbl(t));
    }
    if (W <= 600) for (const b of todos.filter(e => e.matches('button,select,input:not([type=checkbox]):not([type=radio]),[data-act]'))) {
      const r = b.getBoundingClientRect(); if (r.height && r.height < 36 && r.width > 0) out.push('BOTON-CHICO ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + lbl(b));
    }
    return [...new Set(out)];
  });
}
