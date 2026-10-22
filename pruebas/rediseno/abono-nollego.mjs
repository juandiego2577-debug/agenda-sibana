// "Sin abono" solo en tratamientos que piden abono, y botón "No llegó" de la especialista.
// Uso: npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node abono-nollego.mjs"
import { prepararEmulador, cerrarEmulador, htmlDe, abrirAgenda, cerrarNavegador, esperarCalma } from './comun.mjs';
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
await prepararEmulador();
const html = htmlDe(process.env.VER || 'trabajo');
// ---- dueños: Sin abono y abono sugerido
{ const { page, errores, cerrar } = await abrirAgenda({ html, ancho: 1517 });
  const badge = id => page.evaluate(id => { const e = [...document.querySelectorAll('.appt')].find(x => x.querySelector('[data-id]') ? false : x.dataset.id === id) || document.querySelector(`.appt[data-id="${id}"]`); return e ? !!e.querySelector('.no-abono-badge') : null; }, id);
  ok('perfilado sin abono: NO dice "Sin abono"', await badge('c7') === false);
  ok('retoque sin abono: SÍ dice "Sin abono"', await badge('c3') === true);
  await page.evaluate(() => { state.appointments.push(
    { id: 'e1', date: '2026-10-20', start: '18:30', end: '19:00', client: 'Eva Luna', services: ['Evaluación'], specialist: 'Lucy', estado: 'Pendiente', price: 0, abono: 0, saldo: 0 },
    { id: 'e2', date: '2026-10-20', start: '19:00', end: '20:00', client: 'Combo Uno', services: ['Perfilado de cejas', 'Lifting de Pestañas'], specialist: 'Lucy', estado: 'Pendiente', price: 39980, abono: 0, saldo: 39980 }); render(); });
  await esperarCalma(page);
  ok('evaluación sin abono: NO dice "Sin abono"', await badge('e1') === false);
  ok('combo perfilado + lifting sin abono: SÍ dice "Sin abono"', await badge('e2') === true);
  // abono sugerido en cita nueva
  const sugerido = await page.evaluate(async () => {
    const r = {};
    for (const [k, nombres] of Object.entries({ perf: ['Perfilado de cejas'], lift: ['Lifting de Pestañas'], ambos: ['Perfilado de cejas', 'Lifting de Pestañas'], ev: ['Evaluación'] })) {
      ui.modal = { type: 'appt', mode: 'new', data: { date: '2026-10-21', start: '10:00', end: '11:00', services: nombres, specialist: '' } }; render();
      if (typeof recomputeServiceFields === 'function') recomputeServiceFields();
      r[k] = Number(document.getElementById('f-abono').value);
    }
    ui.modal = null; render(); return r;
  });
  ok('cita nueva: perfilado sugiere $0, lifting $5.000, los dos $5.000, evaluación $0', sugerido.perf === 0 && sugerido.lift === 5000 && sugerido.ambos === 5000 && sugerido.ev === 0, JSON.stringify(sugerido));
  // casilla en Servicios y tarifario
  await page.evaluate(() => { ui.modal = { type: 'services' }; render(); });
  await page.waitForTimeout(200);
  const casillas = await page.evaluate(() => [...document.querySelectorAll('[data-svc-abono]')].map(c => [state.services[Number(c.dataset.svcAbono)].name, c.checked]));
  ok('Servicios: casilla "💵 Pide abono" (perfilado sin marcar, microblading marcado, sin casilla en garantía/evaluación)', casillas.length > 0 && casillas.find(c => /Perfilado/.test(c[0]))[1] === false && casillas.find(c => /^Microblading/.test(c[0]))[1] === true && !casillas.some(c => /Garant|Evaluaci/.test(c[0])), JSON.stringify(casillas));
  ok('sin errores (dueños)', errores.length === 0, errores.join(' | '));
  await page.evaluate(() => { ui.modal = null; render(); });
  await cerrar(); }
// ---- especialista: No llegó
{ const { page, errores, cerrar } = await abrirAgenda({ html, rol: 'especialista', ancho: 390, movil: true });
  const abrir = async id => { await page.evaluate(id => { const a = state.appointments.find(x => x.id === id); ui.modal = { type: 'appt', mode: 'edit', data: Object.assign({}, a), original: JSON.parse(JSON.stringify(a)) }; render(); }, id); await page.waitForTimeout(150); };
  await abrir('c5');
  ok('cita que todavía no empieza: sin botón "No llegó"', !await page.$('[data-act="staff-mark-nollego"]'));
  await abrir('c3');
  ok('cita ya empezada: botón "🚫 La clienta no llegó"', !!await page.$('[data-act="staff-mark-nollego"]'));
  if (process.env.OUT) { await page.locator('[data-act="staff-mark-nollego"]').scrollIntoViewIfNeeded(); await page.screenshot({ path: process.env.OUT + '/nollego.png' }); }
  await page.click('[data-act="staff-mark-nollego"]');
  await page.waitForTimeout(200);
  const txt = await page.evaluate(() => document.getElementById('custom-dialog')?.textContent || '');
  ok('pide confirmar', /Emma Carrasco no llegó/.test(txt), txt);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#custom-dialog button')].find(x => /Sí|Aceptar|Confirmar/i.test(x.textContent)) || [...document.querySelectorAll('#custom-dialog button')].pop(); b.click(); });
  await page.waitForTimeout(1500);
  const guardado = await page.evaluate(async () => { const d = await db.collection('sibana-agenda').doc('santiago').get(); const a = d.data().appointments.find(x => x.id === 'c3'); return { estado: a.estado, por: a.noLlegoMarcadoPor && a.noLlegoMarcadoPor.nombre }; });
  ok('quedó "No llegó" en la base, con su nombre', guardado.estado === 'NoShow' && guardado.por === 'Salomé', JSON.stringify(guardado));
  await page.evaluate(() => { const d = document.getElementById('custom-dialog'); if (d) d.remove(); });
  await abrir('c3');
  const vista = await page.textContent('.modal');
  ok('en la cita dice quién lo marcó y ya no hay botón de pago', /"No llegó" marcado por Salomé/.test(vista) && !await page.$('[data-act="staff-mark-realizada"]'));
  ok('botón "↩️ Me equivoqué: sí llegó"', !!await page.$('[data-act="staff-deshacer-nollego"]'));
  if (process.env.OUT) { await page.locator('[data-act="staff-deshacer-nollego"]').scrollIntoViewIfNeeded(); await page.screenshot({ path: process.env.OUT + '/nollego-deshacer.png' }); }
  await page.click('[data-act="staff-deshacer-nollego"]'); await page.waitForTimeout(200);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#custom-dialog button')].find(x => /Sí|Aceptar|Confirmar/i.test(x.textContent)) || [...document.querySelectorAll('#custom-dialog button')].pop(); b.click(); });
  await page.waitForTimeout(1500);
  const vuelta = await page.evaluate(async () => { const d = await db.collection('sibana-agenda').doc('santiago').get(); const a = d.data().appointments.find(x => x.id === 'c3'); return { estado: a.estado, por: a.noLlegoMarcadoPor || null }; });
  ok('deshacer: vuelve a Pendiente', vuelta.estado === 'Pendiente' && !vuelta.por, JSON.stringify(vuelta));
  ok('y se puede marcar realizada', !!await page.$('[data-act="staff-mark-realizada"]'));
  ok('sin errores (especialista)', errores.length === 0, errores.join(' | '));
  await cerrar(); }
await cerrarNavegador(); await cerrarEmulador();
console.log(`${n - fallas}/${n} bien`); process.exit(fallas ? 1 : 0);
