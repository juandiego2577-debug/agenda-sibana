// Sede Viña del Mar con la agenda real contra los emuladores (datos inventados):
// crear la agenda, precios de apertura, comisión, datos separados de Santiago,
// nombre de la sede y aviso, especialista con dos sedes, y que las que trabajan
// en una sola sede no vean nada nuevo.
// Uso: npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node vina.mjs"
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { prepararEmulador, cerrarEmulador, abrirAgenda, htmlDe, cerrarNavegador, datosPrueba, inicio, esperarCalma, AGENDA_DIR, CLAVE } from './comun.mjs';
await prepararEmulador({ sinVina: true });
const env = await initializeTestEnvironment({ projectId: 'sibana-santiago', firestore: { rules: fs.readFileSync(AGENDA_DIR + '/firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
const leer = async doc => { let d; await env.withSecurityRulesDisabled(async ctx => { d = (await ctx.firestore().doc(doc).get()).data(); }); return d; };
const escribir = async (doc, data, merge) => env.withSecurityRulesDisabled(async ctx => { await ctx.firestore().doc(doc).set(data, { merge: !!merge }); });
const alta = async email => {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: CLAVE, returnSecureToken: true }) });
  return (await r.json()).localId;
};
let n = 0, fallas = 0;
const ok = (nombre, cond, extra = '') => { n++; if (cond) console.log('  ✓', nombre); else { fallas++; console.log('  ✗', nombre, extra); } };
const html = htmlDe('trabajo');
const santiagoAntes = await leer('sibana-agenda/santiago');

console.log('1. Crear la agenda de Viña (dueños)');
let { page, cerrar, errores } = await abrirAgenda({ html, rol: 'duenos', sede: 'vina', esperar: '#crear-sede-btn' });
ok('pantalla "Crear la agenda de Viña del Mar"', (await page.textContent('#crear-sede-btn')).includes('Viña del Mar'));
ok('explica que quedan los precios de apertura', (await page.textContent('body')).includes('precios de apertura de Viña del Mar'));
await page.click('#crear-sede-btn');
await page.waitForSelector('[data-act="new-block"]', { timeout: 20000 }); await esperarCalma(page);
const vina = await leer('sibana-agenda/vina');
const precio = nombre => (vina.services.find(s => s.name === nombre) || {}).price;
ok('Microblading $79.990', precio('Microblading (MB)') === 79990, precio('Microblading (MB)'));
ok('Delineado $79.990', precio('Delineado de Ojos (DO)') === 79990);
ok('Full Lips $99.990', precio('Full Lips (FL)') === 99990);
ok('Retoque con el precio de Santiago ($19.990)', precio('Retoque Microblading (RMB)') === 19990);
ok('Lifting con el precio de Santiago ($29.990)', precio('Lifting de Pestañas') === 29990);
ok('Garantía en $0', precio('Garantía de servicio') === 0);
ok('micropigmentación marcada (MB, FL, DO)', ['Microblading (MB)', 'Full Lips (FL)', 'Delineado de Ojos (DO)'].every(x => vina.services.find(s => s.name === x).micropigmentacion === true));
ok('retoque sin marca de micropigmentación', !vina.services.find(s => s.name === 'Retoque Microblading (RMB)').micropigmentacion);
ok('crema incluida', vina.settings.cremaIncluida === true);
ok('arranca sin citas ni especialistas', vina.appointments.length === 0 && vina.specialists.length === 0);
ok('Santiago no se tocó', JSON.stringify(await leer('sibana-agenda/santiago')) === JSON.stringify(santiagoAntes));
ok('nombre de la sede grande junto al logo', (await page.textContent('.tagline-sede')).trim() === 'Viña del Mar');
ok('aviso "Estás en la agenda de Viña del Mar"', ((await page.textContent('.aviso-sede').catch(() => '')) || '').includes('Viña del Mar'));
await page.waitForTimeout(3800);
ok('el aviso se va solo', !(await page.$('.aviso-sede')));

console.log('2. Reglas de dinero en Viña');
const r = await page.evaluate(() => {
  const base = { id: 'z', date: '2026-10-20', start: '10:00', end: '12:00', client: 'X', specialist: 'Camila', abono: 5000 };
  return {
    abono: abonoSugeridoPorTratamiento(),
    micro: apptCommission({ ...base, services: ['Microblading (MB)'], price: 79990, estado: 'Realizada' }),
    labios: apptCommission({ ...base, services: ['Full Lips (FL)'], price: 99990, estado: 'Realizada' }),
    lifting: apptCommission({ ...base, services: ['Lifting de Pestañas'], price: 29990, estado: 'Realizada' }),
    cancelada: apptCommission({ ...base, services: ['Microblading (MB)'], price: 79990, estado: 'Cancelada' }),
    ingresoCancelada: apptRevenue({ ...base, services: ['Microblading (MB)'], price: 79990, estado: 'Cancelada' }),
  };
});
ok('abono sugerido $5.000', r.abono === 5000, r.abono);
ok('comisión microblading = (79.990 − 10.000) / 2 = 34.995', r.micro === 34995, r.micro);
ok('comisión Full Lips = (99.990 − 10.000) / 2 = 44.995', r.labios === 44995, r.labios);
ok('comisión lifting 50/50 directo = 14.995', r.lifting === 14995, r.lifting);
ok('cancelada: el abono es del negocio (comisión 0, ingreso 5.000)', r.cancelada === 0 && r.ingresoCancelada === 5000, JSON.stringify(r));
await page.evaluate(() => {
  state.specialists.push({ id: 'v1', name: 'Camila', color: '#c03aa8' }, { id: 'v2', name: 'Salomé', color: '#2f9e57' });
  state.appointments.push({ id: 'vcita1', date: '2026-10-22', start: '11:00', end: '13:00', client: 'Clienta Viña', phone: '+56 9 1111 2222',
    services: ['Microblading (MB)'], specialist: 'Camila', estado: 'Pendiente', price: 79990, abono: 5000, saldo: 74990 });
  saveData();
});
await esperarCalma(page); await page.waitForTimeout(800);
ok('la cita de Viña queda en Viña', (await leer('sibana-agenda/vina')).appointments.some(a => a.id === 'vcita1'));
ok('y no en Santiago', !(await leer('sibana-agenda/santiago')).appointments.some(a => a.id === 'vcita1'));

console.log('3. Equipo: Salomé también en Viña');
await inicio(page);
await page.click('[data-act="toggle-menu"]'); await page.click('[data-act="open-equipo"]');
await page.waitForSelector('[data-act="equipo-otra-sede"][data-sede="vina"]', { timeout: 10000 });
ok('botón "＋ También en Viña del Mar"', (await page.textContent('[data-act="equipo-otra-sede"][data-sede="vina"]')).includes('También en Viña del Mar'));
await page.click('[data-act="equipo-otra-sede"][data-sede="vina"]'); await page.click('#dlg-ok');
await page.waitForTimeout(1500);
let perfil; await env.withSecurityRulesDisabled(async ctx => { const q = await ctx.firestore().collection('sibana-usuarios').where('email', '==', 'salome@prueba.cl').get(); perfil = q.docs[0].data(); });
ok('su perfil queda con otrasSedes = [vina]', JSON.stringify(perfil.otrasSedes) === '["vina"]', JSON.stringify(perfil.otrasSedes));
ok('el aviso recuerda poner el mismo nombre en Especialistas', ((await page.textContent('#custom-dialog').catch(() => '')) || '').includes('mismo nombre'));
ok('sin errores en la página (dueños)', errores.length === 0, errores.join(' | '));
await cerrar();

console.log('4. Salomé con dos sedes');
({ page, cerrar, errores } = await abrirAgenda({ html, rol: 'especialista', sede: 'santiago' }));
ok('entra a Santiago (su sede principal)', await page.evaluate(() => SEDE.id) === 'santiago');
ok('ve "Santiago" junto al logo', (await page.textContent('.tagline-sede')).trim() === 'Santiago');
await page.click('[data-act="open-sede"]');
const opciones = await page.$$eval('[data-act="set-sede"]', b => b.map(x => x.dataset.sede));
ok('puede elegir solo Santiago y Viña (no Buenos Aires)', JSON.stringify(opciones) === '["santiago","vina"]', JSON.stringify(opciones));
await page.click('[data-act="set-sede"][data-sede="vina"]');
await page.waitForFunction(() => typeof SEDE !== 'undefined' && SEDE.id === 'vina' && ui.loaded, null, { timeout: 30000 });
await page.waitForSelector('[data-act="new-block"]'); await esperarCalma(page);
ok('ahora ve la agenda de Viña', await page.evaluate(() => state.appointments.some(a => a.id === 'vcita1')));
ok('"Viña del Mar" junto al logo', (await page.textContent('.tagline-sede')).trim() === 'Viña del Mar');
ok('aviso al cambiar de sede', ((await page.textContent('.aviso-sede').catch(() => '')) || '').includes('Viña del Mar'));
ok('su nombre sigue siendo Salomé', await page.evaluate(() => staffIdentity()) === 'Salomé');
ok('sin errores en la página (Salomé)', errores.length === 0, errores.join(' | '));
await cerrar();

console.log('5. Especialistas de una sola sede: nada nuevo');
const uidLucy = await alta('lucy@prueba.cl'), uidCamila = await alta('camila@prueba.cl');
await escribir('sibana-usuarios/' + uidLucy, { nombre: 'Lucy', email: 'lucy@prueba.cl', sede: 'santiago', rol: 'especialista', activo: true });
await escribir('sibana-usuarios/' + uidCamila, { nombre: 'Camila', email: 'camila@prueba.cl', sede: 'vina', rol: 'especialista', activo: true });
({ page, cerrar, errores } = await abrirAgenda({ html, rol: 'lucy@prueba.cl', sede: 'santiago' }));
ok('Lucy (Santiago): la barra de arriba como siempre', (await page.textContent('.tagline')).trim() === 'Santiago · Panel interno' && !(await page.$('.tagline-sede')));
ok('Lucy: sin botón de sede', !(await page.$('[data-act="open-sede"]')));
ok('Lucy: sin aviso', !(await page.$('.aviso-sede')));
await cerrar();
({ page, cerrar, errores } = await abrirAgenda({ html, rol: 'camila@prueba.cl', sede: 'santiago' }));
ok('Camila (Viña): entra a Viña', await page.evaluate(() => SEDE.id) === 'vina');
ok('Camila: ve su cita', await page.evaluate(() => state.appointments.some(a => a.id === 'vcita1')));
ok('Camila: barra normal ("Viña del Mar · Panel interno"), sin botón de sede', (await page.textContent('.tagline')).trim() === 'Viña del Mar · Panel interno' && !(await page.$('[data-act="open-sede"]')));
ok('Camila: "Mi pago" visible', !!(await page.$('[data-act="goto-section"][data-section="finanzas"]')));
ok('sin errores en la página (Camila)', errores.length === 0, errores.join(' | '));
await cerrar();

await cerrarNavegador(); await cerrarEmulador(); await env.cleanup();
console.log(`${n - fallas}/${n} pruebas de Viña bien`);
process.exit(fallas ? 1 : 0);
