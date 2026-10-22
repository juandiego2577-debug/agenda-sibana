// Resumen de abajo: semana con curso muestra el total y, aparte, citas y curso.
import { prepararEmulador, cerrarEmulador, htmlDe, abrirAgenda, cerrarNavegador, esperarCalma } from './comun.mjs';
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
await prepararEmulador();
const html = htmlDe('trabajo');
for (const ancho of [390, 1517]) {
  const { page, errores, cerrar } = await abrirAgenda({ html, ancho, movil: ancho < 600 });
  await page.evaluate(() => { ui.view = 'week'; render(); }); await esperarCalma(page);
  const t = (await page.textContent('footer.summary')).replace(/\s+/g, ' ');
  ok(`${ancho}: semana con curso separa 📅 Citas y 📚 Curso`, /📅 Citas/.test(t) && /📚 Curso/.test(t), t);
  ok(`${ancho}: cuenta inscritas aparte`, /Inscritas al curso\s*1/.test(t), t);
  const nums = await page.evaluate(() => { const ap = filtroCitasDelResumen(); const r = resumenDinero(ap), c = resumenDinero(ap.filter(a => !a.cursoId)), k = resumenDinero(ap.filter(a => a.cursoId)); return [r.entro, c.entro + k.entro, r.esperado, c.esperado + k.esperado]; });
  ok(`${ancho}: citas + curso = total`, nums[0] === nums[1] && nums[2] === nums[3], JSON.stringify(nums));
  if (process.env.OUT && ancho === 390) await page.locator('footer.summary').screenshot({ path: process.env.OUT + '/resumen-curso.png' });
  await page.evaluate(() => { ui.view = 'day'; render(); }); await esperarCalma(page);
  const d = await page.textContent('footer.summary');
  ok(`${ancho}: día sin curso no cambia`, !/📚 Curso/.test(d) && !/Inscritas/.test(d));
  ok(`${ancho}: sin errores`, errores.length === 0, errores.join(' | '));
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(`${n - fallas}/${n} bien`); process.exit(fallas ? 1 : 0);
