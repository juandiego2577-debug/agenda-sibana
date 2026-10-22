// Finanzas → Gráficos: antes y después de los precios nuevos.
import { prepararEmulador, cerrarEmulador, htmlDe, abrirAgenda, cerrarNavegador, esperarCalma } from './comun.mjs';
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
await prepararEmulador();
const html = htmlDe('trabajo');
for (const [ancho, tema] of [[1517, 'oscuro'], [390, 'oscuro'], [390, 'claro']]) {
  const { page, errores, cerrar } = await abrirAgenda({ html, ancho, tema, movil: ancho < 600 });
  const r = await page.evaluate(() => {
    state.appointments = state.appointments.filter(a => a.cursoId);
    let id = 0; const add = (date, price, nueva) => state.appointments.push({ id: 'p' + (id++), date, start: '10:00', end: '11:00', client: 'C' + id, services: ['Microblading (MB)'], specialist: 'Salomé', estado: 'Realizada', price, abono: 5000, saldo: price - 5000, metodoSaldo: 'Efectivo', ...(nueva ? { cremaIncluidaPolitica: true } : {}) });
    // 4 semanas antes (desde 7/9) con precio viejo; precios nuevos desde el mié 7/10
    ['2026-09-08', '2026-09-09', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-22', '2026-09-23', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-06'].forEach(d => add(d, 54990, false));
    ['2026-10-07', '2026-10-08', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-19'].forEach(d => add(d, 69990, true));
    ui.section = 'finanzas'; ui.financeTab = 'graficos'; ui.reportsDate = new Date(2026, 9, 1); render();
    return { cambios: cambiosDePrecio(), texto: document.querySelector('.precios-card')?.textContent.replace(/\s+/g, ' ') };
  });
  await esperarCalma(page);
  ok(`${ancho} ${tema}: la fecha del cambio sale de la primera cita con precios nuevos (7/10)`, r.cambios[0] === '2026-10-07' && /miércoles 7 de octubre/.test(r.texto), JSON.stringify(r));
  ok(`${ancho} ${tema}: antes 4 semanas, ahora 1 (la del 5/10 es mixta, la del 19/10 en curso)`, /Antes · 4 semanas/.test(r.texto) && /Ahora · 1 semana\b/.test(r.texto), r.texto);
  const fuera = await page.evaluate(() => { const c = document.querySelector('.precios-card').getBoundingClientRect(); return c.right > innerWidth || c.left < 0; });
  ok(`${ancho} ${tema}: cabe en la pantalla`, !fuera);
  await page.locator('.precios-card').screenshot({ path: `${process.env.OUT}/precios-${ancho}-${tema}.png` });
  if (ancho === 1517) {
    // Un cambio de precio en Servicios y tarifario queda anotado
    const c2 = await page.evaluate(() => { ui.modal = { type: 'services' }; render(); const inp = document.querySelector('[data-svc-price]'); inp.value = Number(inp.value) + 1000; return true; });
    const anot = await page.evaluate(() => { const inp = document.querySelector('[data-svc-price]'); const antes = state.services[Number(inp.dataset.svcPrice)].price; let err = ''; window.saveData = () => Promise.resolve(true); try { saveServicesFromForm(); } catch (e) { err = e.message; } return { lista: (state.settings.cambiosPrecio || []).map(c => c.desde), antes, valor: inp.value, err, hoy: sedeNow().date }; });
    ok('cambiar un precio anota la fecha de hoy', anot.lista.includes('2026-10-20'), JSON.stringify(anot));
    ok('y la tarjeta pasa a comparar desde ese cambio', (await page.evaluate(() => { ui.modal = null; render(); return cambiosDePrecio().slice(-1)[0]; })) === '2026-10-20');
  }
  ok(`${ancho} ${tema}: sin errores`, errores.length === 0, errores.join(' | '));
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(`${n - fallas}/${n} bien`); process.exit(fallas ? 1 : 0);
