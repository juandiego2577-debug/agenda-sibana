// Ficha de consentimiento (repo sibana-consentimiento) con ?sede=vina y el
// Panel Sibana con las dos sedes. Contra los emuladores, datos inventados.
// FICHA_DIR = carpeta del repo sibana-consentimiento (por defecto ../../../sibana-consentimiento).
// Uso: npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node ficha-vina.mjs"
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { createRequire } from 'module';
import { AGENDA_DIR, CLAVE, CORREO_DUENOS } from './comun.mjs';
const FICHA_DIR = path.resolve(process.env.FICHA_DIR || path.join(AGENDA_DIR, '..', 'sibana-consentimiento'));
const NM = path.dirname(createRequire(import.meta.url).resolve('firebase/package.json'));
const env = await initializeTestEnvironment({ projectId: 'sibana-santiago', firestore: { rules: fs.readFileSync(process.env.REGLAS || (AGENDA_DIR + '/firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
await fetch('http://127.0.0.1:9099/emulator/v1/projects/sibana-santiago/accounts', { method: 'DELETE' });
const alta = async email => (await (await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST',
  headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: CLAVE, returnSecureToken: true }) })).json()).localId;
await alta(CORREO_DUENOS);
const uidLucy = await alta('lucy@prueba.cl');
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await db.doc('sibana-usuarios/' + uidLucy).set({ nombre: 'Lucy', email: 'lucy@prueba.cl', sede: 'santiago', rol: 'especialista', activo: true });
  await db.doc('sibana-consentimientos/s1').set({ nombre: 'Clienta Santiago', rut: '1-9', ciudad: 'Santiago', firmaDataUrl: png, submittedAtClient: '2026-10-19T12:00:00.000Z' });
});
let html = fs.readFileSync(path.join(FICHA_DIR, 'index.html'), 'utf8');
const marca = 'db = firebase.firestore();';
html = html.replace(marca, marca + " db.useEmulator('127.0.0.1', 8080); firebase.auth().useEmulator('http://127.0.0.1:9099', {disableWarnings:true});");
const srv = http.createServer((q, r) => {
  const ruta = decodeURIComponent(q.url.split('?')[0]);
  if (ruta.startsWith('/fonts/') && fs.existsSync(path.join(FICHA_DIR, ruta))) { r.writeHead(200, { 'content-type': 'font/woff2' }); return r.end(fs.readFileSync(path.join(FICHA_DIR, ruta))); }
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html);
});
await new Promise(r => srv.listen(5098, '127.0.0.1', r));
const b = await chromium.launch();
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
async function abrir(q, tactil) {
  const ctx = await b.newContext(tactil ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 } : { viewport: { width: 420, height: 900 } });
  await ctx.route('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.14.1/*', route => {
    const f = route.request().url().split('/').pop().replace('.min.js', '.js');
    route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(NM, f), 'utf8') });
  });
  await ctx.route(/^https:\/\/(?!cdnjs)/, route => route.abort());
  const page = await ctx.newPage(); const errores = []; page.on('pageerror', e => errores.push(e.message));
  await page.goto('http://127.0.0.1:5098/' + q); await page.waitForTimeout(1500);
  return { page, ctx, errores };
}
const leerCol = async col => { let out; await env.withSecurityRulesDisabled(async ctx => { out = (await ctx.firestore().collection(col).get()).docs.map(d => d.data()); }); return out; };

console.log('Ficha de Viña (?sede=vina)');
let { page, ctx, errores } = await abrir('?sede=vina');
ok('dice "VIÑA DEL MAR" arriba', (await page.textContent('.brand .sub')).includes('VIÑA DEL MAR'));
ok('Ciudad viene puesta: Viña del Mar', await page.inputValue('[data-bind="ciudad"]') === 'Viña del Mar');
// Se firma "por dentro" (la validación de cada paso ya está probada en Santiago).
await page.evaluate(png => { Object.assign(state, { nombre: 'Clienta Viña', rut: '11.111.111-1', edad: '30', telefono: '+56 9 1111 1111',
  acepta_cuidados: true, acepta_datos: true, acepta_terminos: true, declara_firma: true, firmaDataUrl: png, step: 4 }); return submitForm(); }, png);
await page.waitForTimeout(1200);
const vina = await leerCol('sibana-consentimientos-vina'), stgo = await leerCol('sibana-consentimientos');
ok('la ficha queda en las fichas de Viña', vina.length === 1 && vina[0].nombre === 'Clienta Viña', JSON.stringify(vina.map(x => x.nombre)));
ok('y no en las de Santiago', stgo.length === 1);
ok('sin errores (ficha Viña)', errores.length === 0, errores.join(' | '));
await ctx.close();

({ page, ctx, errores } = await abrir(''));
ok('sin ?sede: Santiago (dice "SANTIAGO", no Viña; Ciudad vacía)', (await page.textContent('.brand .sub')).includes('· SANTIAGO') && !(await page.textContent('.brand .sub')).includes('VIÑA') && await page.inputValue('[data-bind="ciudad"]') === '');
await page.screenshot({ path: (process.env.FOTO || '/tmp') + '/ficha_santiago.png' });
ok('Santiago: ejemplo de Ciudad "Santiago"', (await page.getAttribute('[data-bind="ciudad"]', 'placeholder')) === 'Ej: Santiago');
ok('la ficha ya no tiene botón "Panel Sibana"', !(await page.$('#adminBtn')) && !(await page.$('text=Panel Sibana')));
await ctx.close();
({ page, ctx, errores } = await abrir('?sede=vina'));
{
  const sub = await page.textContent('.brand .sub');
  const enPantalla = await page.evaluate(() => document.getElementById('app').innerText + ' ' + [...document.querySelectorAll('#app [placeholder]')].map(x => x.placeholder).join(' ') + ' ' + document.querySelector('[data-bind="ciudad"]').value);
  ok('Viña: dice solo Viña del Mar (nada de Santiago)', sub.includes('· VIÑA DEL MAR') && !/santiago/i.test(enPantalla), enPantalla.match(/.{0,40}santiago.{0,40}/i));
  ok('Viña: ejemplo de Ciudad "Viña del Mar"', (await page.getAttribute('[data-bind="ciudad"]', 'placeholder')) === 'Ej: Viña del Mar');
}
await ctx.close();

console.log('Ficha completa en un teléfono, firmando con el dedo (Santiago)');
({ page, ctx, errores } = await abrir('', true));
await page.tap('#btnNext');
ok('Continuar sin nombre marca "Falta responder" en Nombre', await page.isVisible('.field.falta #f_nombre') && (await page.textContent('#errbox')).includes('nombre'));
await page.fill('#f_nombre', 'Daniela Firma Dedo'); await page.fill('#f_rut', '11.111.111-1'); await page.fill('#f_edad', '29'); await page.fill('#f_telefono', '+56 9 2222 2222');
ok('al escribir se quita el rojo', !(await page.$('.field.falta')));
await page.tap('#btnNext');
await page.tap('[data-yn="alergias"][data-val="no"]');
await page.tap('#btnNext');
ok('historial: marca en rojo las 7 sin responder', (await page.$$('.sn-fila.falta')).length === 7);
for (const f of ['diabetes','hipertension','vih','hepatitis','enf_inmunes','cond_piel','herpes']) await page.tap(`[data-yn="${f}"][data-val="no"]`);
ok('Sí/No dice cuál está elegido (aria-checked)', await page.getAttribute('[data-yn="vih"][data-val="no"]', 'aria-checked') === 'true');
await page.tap('#btnNext');
await page.tap('[data-yn="diseno_aprobado"][data-val="si"]'); await page.tap('#btnNext');
await page.tap('label[for="acepta_cuidados"]'); await page.tap('#btnNext');
await page.tap('label[for="acepta_terminos"]'); await page.tap('label[for="acepta_datos"]');
await page.tap('#btnNext');
ok('sin firma no deja enviar (recuadro en rojo)', await page.isVisible('.sig-box.falta'));
// Firma con el dedo: toques de verdad (touchstart / touchmove / touchend)
const lienzo = await page.$('#sigpad'); await lienzo.scrollIntoViewIfNeeded();
const bb = await lienzo.boundingBox();
ok('el recuadro de la firma mide al menos 220 px de alto', bb.height >= 220, String(bb.height));
const cdp = await ctx.newCDPSession(page);
const toque = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
await toque('touchStart', bb.x + 30, bb.y + 140);
for (let i = 1; i <= 40; i++) await toque('touchMove', bb.x + 30 + i * 7, bb.y + 140 - Math.sin(i / 4) * 40);
await toque('touchEnd');
await page.waitForTimeout(200);
ok('al firmar se esconde "Firma aquí" y se quita el rojo', await page.isHidden('.sig-aqui') && !(await page.$('.sig-box.falta')));
await page.tap('label[for="declara_firma"]');
await page.tap('#btnNext');
await page.waitForSelector('.done-screen', { timeout: 10000 });
ok('pantalla final "Listo, Daniela"', (await page.textContent('.done-screen h1')).trim() === 'Listo, Daniela');
const guardadas = (await leerCol('sibana-consentimientos')).filter(x => x.nombre === 'Daniela Firma Dedo');
ok('la ficha quedó guardada en Santiago', guardadas.length === 1);
const g = guardadas[0] || {};
ok('la firma guardada es una imagen PNG con trazo', /^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(g.firmaDataUrl || '') && (g.firmaDataUrl || '').length > 2000, String((g.firmaDataUrl || '').length));
const hoyChile = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
ok('fecha de la ficha = hoy en hora de Chile', g.fecha === hoyChile, g.fecha + ' vs ' + hoyChile);
ok('se guardan los mismos campos de siempre (nada nuevo)', Object.keys(g).every(k => ['step','fecha','ciudad','nombre','rut','edad','telefono','email','alergias','alergias_detalle','diabetes','hipertension','vih','hepatitis','enf_inmunes','cond_piel','cond_piel_detalle','herpes','herpes_detalle','proc_quimicos','proc_esteticos','n_tratamientos','microblading','tatuaje','tiempo_anterior','tecnica','diseno_aprobado','acepta_cuidados','acepta_datos','acepta_terminos','declara_firma','firmaDataUrl','nombre_buscar','submittedAtClient','submittedAt'].includes(k)), Object.keys(g).join(','));
// La copia en PDF trae la firma, el nombre y el texto aceptado
await page.evaluate(() => buildPrintSummary());
const copia = await page.textContent('#printSummary');
ok('copia: sede, hora de Chile y texto del consentimiento', copia.includes('Sede Santiago') && copia.includes('hora de Chile') && copia.includes('Declaro que la información entregada'));
ok('copia: firma y nombre (sin RUT bajo la firma)', !!(await page.$('#printSummary img.psig')) && (await page.textContent('#printSummary .pfirma-nombre')).trim() === 'Daniela Firma Dedo');
ok('sin errores (ficha con el dedo)', errores.length === 0, errores.join(' | '));
await page.screenshot({ path: (process.env.FOTO || '/tmp') + '/ficha_listo.png' });
await ctx.close();

console.log('Panel Sibana');
async function panel(correo) {
  const r = await abrir('?panel');
  await r.page.waitForSelector('#pcInput');
  if (correo) await r.page.fill('#pcUser', correo);
  await r.page.fill('#pcInput', CLAVE); await r.page.press('#pcInput', 'Enter');
  await r.page.waitForSelector('.entry, .empty-admin', { timeout: 15000 }); await r.page.waitForTimeout(500);
  return r;
}
({ page, ctx, errores } = await panel(''));
const nombres = await page.$$eval('.entry-name', e => e.map(x => x.textContent));
ok('dueños ven las fichas de las dos sedes', nombres.includes('Clienta Viña') && nombres.includes('Clienta Santiago'), JSON.stringify(nombres));
const chips = await page.$$eval('.entry .sede-chip', e => e.map(x => x.textContent));
ok('cada ficha marcada con su sede', chips.includes('Viña del Mar') && chips.includes('Santiago'), JSON.stringify(chips));
await page.click('[data-sede-filtro="vina"]'); await page.waitForTimeout(300);
ok('filtro "Viña del Mar" muestra solo las de Viña', JSON.stringify(await page.$$eval('.entry-name', e => e.map(x => x.textContent))) === '["Clienta Viña"]');
await page.click('[data-sede-filtro=""]'); await page.waitForTimeout(300);
await page.click('.entry:has-text("Clienta Viña")');
await page.click('.entry:has-text("Clienta Viña") [data-act="delete-entry"]'); await page.click('#cfOk'); await page.waitForTimeout(1000);
ok('eliminar una ficha de Viña la borra de Viña', (await leerCol('sibana-consentimientos-vina')).length === 0);
ok('y no toca las de Santiago', (await leerCol('sibana-consentimientos')).length === 2);
ok('sin errores (Panel dueños)', errores.length === 0, errores.join(' | '));
await ctx.close();
await env.withSecurityRulesDisabled(async c => { await c.firestore().doc('sibana-consentimientos-vina/v9').set({ nombre: 'Otra de Viña', firmaDataUrl: png, submittedAtClient: '2026-10-20T12:00:00.000Z' }); });
{
  const r = await panel('');
  await r.page.goto('http://127.0.0.1:5098/?panel'); await r.page.waitForTimeout(1500);
  ok('con la sesión ya abierta, ?panel entra directo (sin contraseña)', !!(await r.page.$('.entry')) && !(await r.page.$('#pcInput')));
  await r.page.keyboard.press('Escape');
  await r.ctx.close();
}
({ page, ctx, errores } = await panel('lucy@prueba.cl'));
const n2 = await page.$$eval('.entry-name', e => e.map(x => x.textContent));
ok('especialista de Santiago ve solo las de Santiago', JSON.stringify(n2) === '["Daniela Firma Dedo","Clienta Santiago"]', JSON.stringify(n2));
ok('y sin marcas ni filtro de sede', !(await page.$('.sede-chip')) && !(await page.$('[data-sede-filtro]')));
await ctx.close();
await b.close(); srv.close(); await env.cleanup();
console.log(`${n - fallas}/${n} pruebas de la ficha bien`);
process.exit(fallas ? 1 : 0);
