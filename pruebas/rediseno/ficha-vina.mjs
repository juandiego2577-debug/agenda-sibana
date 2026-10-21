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
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(5098, '127.0.0.1', r));
const b = await chromium.launch();
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
async function abrir(q) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
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
ok('sin ?sede: la ficha de siempre (sin "VIÑA DEL MAR", Ciudad vacía)', !(await page.textContent('.brand .sub')).includes('VIÑA') && await page.inputValue('[data-bind="ciudad"]') === '');
await ctx.close();

console.log('Panel Sibana');
async function panel(correo) {
  const r = await abrir('');
  await r.page.click('#adminBtn'); await r.page.waitForSelector('#pcInput');
  if (correo) await r.page.fill('#pcUser', correo);
  await r.page.fill('#pcInput', CLAVE); await r.page.click('#pcOk');
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
ok('y no toca las de Santiago', (await leerCol('sibana-consentimientos')).length === 1);
ok('sin errores (Panel dueños)', errores.length === 0, errores.join(' | '));
await ctx.close();
await env.withSecurityRulesDisabled(async c => { await c.firestore().doc('sibana-consentimientos-vina/v9').set({ nombre: 'Otra de Viña', firmaDataUrl: png, submittedAtClient: '2026-10-20T12:00:00.000Z' }); });
({ page, ctx, errores } = await panel('lucy@prueba.cl'));
const n2 = await page.$$eval('.entry-name', e => e.map(x => x.textContent));
ok('especialista de Santiago ve solo las de Santiago', JSON.stringify(n2) === '["Clienta Santiago"]', JSON.stringify(n2));
ok('y sin marcas ni filtro de sede', !(await page.$('.sede-chip')) && !(await page.$('[data-sede-filtro]')));
await ctx.close();
await b.close(); srv.close(); await env.cleanup();
console.log(`${n - fallas}/${n} pruebas de la ficha bien`);
process.exit(fallas ? 1 : 0);
