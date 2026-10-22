// ⚖️ Reparto de trabajo: recuadro al final de Pagos y "le falta trabajo" en la
// lista de especialistas al agendar (solo dueños). Datos inventados.
// Uso: npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node reparto.mjs"
import { prepararEmulador, cerrarEmulador, htmlDe, abrirAgenda, cerrarNavegador, esperarCalma } from './comun.mjs';
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
await prepararEmulador();
const html = htmlDe('trabajo');
const { page, errores, cerrar } = await abrirAgenda({ html, ancho: 1517 });
const irPagos = async () => { await page.click('[data-act="goto-section"][data-section="pagos"]'); await page.waitForTimeout(300); };
await irPagos();
const ultimo = await page.evaluate(() => { const r = document.querySelector('.reparto'); return r && !r.nextElementSibling; });
ok('Pagos: recuadro "⚖️ Reparto de trabajo" al final de la página', ultimo);
let txt = await page.textContent('.reparto');
ok('entran Salomé, Lucy y Helen (no Melissa)', /Salomé/.test(txt) && /Lucy/.test(txt) && /Helen/.test(txt) && !/Melissa/.test(txt));
ok('arranca de cero el 22 de octubre (las citas de antes no cuentan)', txt.includes('desde el 22 de octubre') && txt.includes('Todavía no hay citas'), txt.slice(0, 300));
// Citas desde el 22/10 (y algunas que no deben contar)
await page.evaluate(() => {
  const c = (id, date, sp, price, estado = 'Confirmada', extra = {}) => ({ id, date, start: '10:00', end: '11:00', client: 'Prueba ' + id, services: ['Microblading (MB)'], specialist: sp, estado, price, abono: 0, saldo: price, ...extra });
  state.appointments.push(
    c('r1', '2026-10-23', 'Salomé', 69990, 'Realizada'), c('r2', '2026-10-27', 'Salomé', 69990),
    c('r3', '2026-10-24', 'Lucy', 99990),
    c('r4', '2026-10-23', 'Helen', 9990),
    c('r5', '2026-10-25', 'Helen', 69990, 'Cancelada'),   // cancelada: no cuenta
    c('r6', '2026-10-21', 'Helen', 99990, 'Realizada'),   // antes del 22: no cuenta
    c('r7', '2026-10-26', 'Melissa', 99990),              // no entra en el reparto
  );
  render();
});
txt = await page.textContent('.reparto');
ok('Salomé $139.980 (56%), Lucy $99.990 (40%), Helen $9.990 (4%)', txt.includes('$139.980 · 56%') && txt.includes('$99.990 · 40%') && txt.includes('$9.990 · 4%'), txt.replace(/\s+/g, ' ').slice(0, 400));
ok('cuenta las ya agendadas, no las canceladas ni las de antes', txt.includes('2 citas') && (txt.match(/1 cita\b/g) || []).length === 2);
ok('aviso: conviene darle las próximas a Helen', txt.includes('conviene darle las próximas citas a Helen'));
// Al agendar
await page.click('[data-act="goto-section"][data-section="agenda"]').catch(() => {});
await page.click('[data-act="new-appt"]'); await page.waitForSelector('#f-specialist');
const ops = await page.$$eval('#f-specialist option', o => o.map(x => x.textContent));
ok('la lista marca a Helen con "⚖️ le falta trabajo"', ops.some(t => t.startsWith('Helen') && t.includes('⚖️ le falta trabajo')), JSON.stringify(ops));
ok('y a nadie más', ops.filter(t => t.includes('⚖️')).length === 1);
ok('sin texto extra en el formulario', !(await page.textContent('.modal')).includes('le toca más trabajo'));
const orden = async () => page.evaluate(() => { ui.modal = { type: 'appt', mode: 'new', data: {} }; const h = opcionesEspecialistaHtml(['Microblading (MB)'], '', null, { date: '2026-10-28', start: '10:00', end: '12:00' }); const d = document.createElement('select'); d.innerHTML = h; return [...d.options].map(o => o.textContent); });
const conRep = await orden();
await page.evaluate(() => { window.__rep = state.specialists.map(s => s.reparto); state.specialists.forEach(s => s.reparto = false); });
const sinRep = await orden();
await page.evaluate(() => state.specialists.forEach((s, i) => { s.reparto = window.__rep[i]; if (s.reparto === undefined) delete s.reparto; }));
ok('el orden de la lista (medallas) es el mismo con o sin reparto', JSON.stringify(conRep.map(t => t.split(' ')[0])) === JSON.stringify(sinRep.map(t => t.split(' ')[0])), JSON.stringify(conRep) + ' / ' + JSON.stringify(sinRep));
ok('Helen bloqueada a esa hora: no se le marca ⚖️ (y sin bloqueo, sí)', await page.evaluate(() => { ui.modal = { type: 'appt', mode: 'new', data: {} }; const libre = opcionesEspecialistaHtml([], '', null, { date: '2026-10-28', start: '10:00', end: '12:00' }); if (!/Helen[^<]*⚖️/.test(libre)) return false; state.blocks.push({ id: 'bx', date: '2026-10-28', start: '09:00', end: '13:00', specialist: 'Helen', motivo: 'x' }); const h = opcionesEspecialistaHtml([], '', null, { date: '2026-10-28', start: '10:00', end: '12:00' }); state.blocks.pop(); return !/Helen[^<]*⚖️/.test(h); }));
await page.evaluate(() => { ui.modal = null; render(); });
// Al EDITAR una cita ya dada no sale el ⚖️
await page.evaluate(() => { ui.modal = { type: 'appt', mode: 'edit', data: state.appointments.find(a => a.id === 'r3') }; render(); });
await page.waitForSelector('#f-specialist');
ok('al editar una cita ya agendada no sale el ⚖️', !(await page.$$eval('#f-specialist option', o => o.some(x => x.textContent.includes('⚖️')))));
await page.evaluate(() => { ui.modal = null; render(); });
// Parejas: sin aviso
await page.evaluate(() => { state.appointments.push({ id: 'r8', date: '2026-10-29', start: '10:00', end: '11:00', client: 'x', services: [], specialist: 'Helen', estado: 'Confirmada', price: 129990 }, { id: 'r9', date: '2026-10-29', start: '12:00', end: '13:00', client: 'y', services: [], specialist: 'Lucy', estado: 'Confirmada', price: 39990 }); ui.modal = null; render(); });
await irPagos();
txt = await page.textContent('.reparto');
ok('cuando están parejas: "✅ Están parejas" y sin ⚖️ en la lista', txt.includes('Están parejas') && await page.evaluate(() => { ui.modal = { type: 'appt', mode: 'new', data: {} }; const h = opcionesEspecialistaHtml([], '', null, null); ui.modal = null; return !h.includes('⚖️'); }), txt.replace(/\s+/g, ' ').slice(-120));
// Especialistas: la casilla
await page.click('[data-act="goto-section"][data-section="agenda"]'); await page.click('[data-act="toggle-menu"]'); await page.click('[data-act="open-specialists"]'); await page.waitForSelector('[data-spec-reparto]');
const marcadas = await page.$$eval('[data-spec-reparto]', cs => cs.map(c => c.checked));
ok('Especialistas: casilla marcada para Salomé, Lucy y Helen, no para Melissa', JSON.stringify(marcadas) === '[true,true,false,true]', JSON.stringify(marcadas));
await page.click('[data-spec-reparto="3"]'); await page.click('[data-act="save-specialists"]'); await esperarCalma(page);
await irPagos();
ok('desmarcar a Helen la saca del reparto', await page.evaluate(() => state.specialists[3].reparto === false && !document.querySelector('.reparto').textContent.includes('Helen')));
ok('lo demás de la especialista no cambia', await page.evaluate(() => state.specialists[3].name === 'Helen' && !('box' in state.specialists[3])));
// Pasadas 4 semanas: ventana móvil
await page.evaluate(() => { state.specialists[3].reparto = true; render(); });
await page.clock.setFixedTime(new Date('2026-12-15T12:00:00-03:00'));
await page.evaluate(() => render());
txt = await page.textContent('.reparto');
ok('después de 4 semanas mira solo las últimas 4 semanas', txt.includes('en las últimas 4 semanas') && txt.includes('Todavía no hay citas'), txt.slice(0, 200));
ok('sin errores', errores.length === 0, errores.join(' | '));
// ?reparto28: solo para mirar los 28 días de atrás (sin el corte del 22/10)
await page.clock.setFixedTime(new Date('2026-10-20T13:10:00-03:00'));
await page.goto(page.url().split('?')[0] + '?reparto28'); await page.waitForSelector('[data-act="new-block"]', { timeout: 30000 }); await esperarCalma(page);
await irPagos();
txt = await page.textContent('.reparto');
ok('?reparto28: cuenta los 28 días de atrás (citas de octubre que antes no contaban)', txt.includes('en los últimos 28 días') && txt.includes('solo para mirar') && !txt.includes('Todavía no hay citas'), txt.replace(/\s+/g, ' ').slice(0, 300));
ok('?reparto28 no cambia el ⚖️ del formulario (sigue desde el 22/10)', await page.evaluate(() => { ui.modal = { type: 'appt', mode: 'new', data: {} }; const d = repartoDatos(); const v = repartoDatos(true); ui.modal = null; return d.desde === '2026-10-22' && v.desde < '2026-10-22'; }));
ok('dos especialistas con el mismo nombre: una sola fila', await page.evaluate(() => { state.specialists.push({ id: 'dup', name: 'lucy ', color: '#123456' }); const n = repartoDatos().filas.filter(f => normalizeName(f.name) === 'lucy').length; state.specialists.pop(); return n === 1; }));
await cerrar();
// Especialista: no ve nada de esto
const e = await abrirAgenda({ html, rol: 'especialista', ancho: 1517 });
ok('especialista: no ve Pagos ni el reparto', !(await e.page.$('[data-section="pagos"]')) && !(await e.page.$('.reparto')));
await e.cerrar();
// Viña: nadie entra por defecto
const v = await abrirAgenda({ html, sede: 'vina', ancho: 1517 });
await v.page.click('[data-act="goto-section"][data-section="pagos"]'); await v.page.waitForTimeout(300);
ok('Viña: sin recuadro hasta que se marque quién entra', !(await v.page.$('.reparto')));
await v.cerrar();
await cerrarNavegador(); await cerrarEmulador();
console.log(`\n${n - fallas}/${n} bien`); process.exit(fallas ? 1 : 0);
