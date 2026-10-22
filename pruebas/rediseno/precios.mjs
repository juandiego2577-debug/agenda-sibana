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
  const g = await page.evaluate(() => {
    const h = [...document.querySelectorAll('.fin-sub')].find(x => /semana a semana/.test(x.textContent));
    const box = h && h.nextElementSibling; const svg = box && box.querySelector('svg');
    const nota = document.querySelector('.semana-nota');
    return { hay: !!svg, barras: svg ? svg.querySelectorAll('g').length : 0, raya: svg ? !!svg.querySelector('line[stroke-dasharray]') : false, curso: svg ? /en curso/.test(svg.textContent) : false, nota: nota ? nota.textContent.replace(/\s+/g, ' ') : '', fuera: box ? box.getBoundingClientRect().right > innerWidth : true };
  });
  ok(`${ancho} ${tema}: la fecha del cambio sale de la primera cita con precios nuevos (7/10)`, r.cambios[0] === '2026-10-07', JSON.stringify(r.cambios));
  ok(`${ancho} ${tema}: gráfico "Lo que entró semana a semana" con raya de precios nuevos y semana en curso`, g.hay && g.raya && g.curso, JSON.stringify(g));
  ok(`${ancho} ${tema}: con límite (12 semanas en computador, 8 en teléfono)`, g.barras <= (ancho < 600 ? 8 : 12) && g.barras >= 6, g.barras);
  ok(`${ancho} ${tema}: promedio desde los precios nuevos (sin la semana mixta ni la en curso)`, /Desde los precios nuevos \(7\/10\)/.test(g.nota) && /\$279\.960/.test(g.nota) && /antes \$137\.475/.test(g.nota), g.nota);
  ok(`${ancho} ${tema}: cabe en la pantalla`, !g.fuera);
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
