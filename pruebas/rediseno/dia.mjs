// Vista Día (Task 4 del rediseño): ninguna línea de una ficha queda cortada a
// la mitad, la cita de 1 hora muestra hora + nombre + tratamiento, "Sin abono"
// y "Falta firmar" siempre se ven (texto o ícono), y un nombre larguísimo no se
// sale de su ficha. En 320–1517 px, con letra normal y con letra grande (130%).
import { prepararEmulador, cerrarEmulador, abrirAgenda, htmlDe, cerrarNavegador } from './comun.mjs';
const VERSION = process.env.VERSION || 'trabajo';
let fallos = 0; const ok = (c, m) => { if (!c) console.log('  ✗', m); if (!c) fallos++; return c; };
let pruebas = 0;
for (const largos of [false, true]) {
  await prepararEmulador({ nombresLargos: largos });
  for (const rol of ['duenos', 'especialista']) for (const ancho of [320, 360, 390, 430, 768, 1024, 1517]) for (const zoom of [100, 130]) {
    const { page, cerrar } = await abrirAgenda({ html: htmlDe(VERSION), rol, ancho });
    // Letra grande del teléfono: se agranda solo el texto de las fichas (como
    // la escala de texto de Android) y la agenda tiene que volver a acomodarlas.
    if (zoom !== 100) { await page.evaluate(z => {
      const els = [...document.querySelectorAll('.dayrow .appt *')].map(e => [e, getComputedStyle(e)]);
      for (const [e, s] of els) { e.style.fontSize = parseFloat(s.fontSize) * z / 100 + 'px'; if (/px$/.test(s.lineHeight)) e.style.lineHeight = parseFloat(s.lineHeight) * z / 100 + 'px'; }
      if (typeof ajustarFichasDia === 'function') ajustarFichasDia(document);
    }, zoom); await page.waitForTimeout(200); }
    const r = await page.evaluate(() => {
      const vis = e => e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length;
      const out = [];
      for (const c of document.querySelectorAll('.dayrow .appt')) {
        const cr = c.getBoundingClientRect();
        for (const t of c.querySelectorAll('.t-time,.t-name,.t-name-compact,.t-service,.no-abono-badge,.firma-badge')) {
          if (!vis(t)) continue;
          const tr = t.getBoundingClientRect();
          if (tr.bottom > cr.bottom + 1 || tr.top < cr.top - 1) out.push('cortada ' + c.dataset.id + ' ' + t.className + ' (' + Math.round(tr.bottom - cr.bottom) + 'px)');
          if (tr.right > cr.right + 1) out.push('se sale a la derecha ' + c.dataset.id + ' ' + t.className);
        }
      }
      const ficha = id => document.querySelector(`.dayrow .appt[data-id="${id}"]`);
      const c3 = ficha('c3'), c7 = ficha('c7');
      const seVe = (c, sel) => !!c && [...c.querySelectorAll(sel)].some(vis);
      return { out, c3: !!c3, c3serv: seVe(c3, '.t-service'), c3nombre: seVe(c3, '.t-name,.t-name-compact'),
        c3sinAbono: seVe(c3, '.no-abono-badge'), c3sinAbonoTexto: !!c3 && [...c3.querySelectorAll('.no-abono-badge .txt')].some(e => vis(e) && e.getBoundingClientRect().width > 20), c7sinAbono: seVe(c7, '.no-abono-badge'), c3firma: seVe(c3, '.firma-badge,.firma-esquina') };
    });
    const k = `${rol} ${ancho}px${zoom !== 100 ? ' letra ' + zoom + '%' : ''}${largos ? ' nombres largos' : ''}`;
    pruebas++;
    ok(!r.out.length, `${k}: ${r.out.join('; ')}`);
    if (r.c3 && zoom === 100) {
      ok(r.c3nombre, `${k}: la cita de 1 h (Emma) muestra el nombre`);
      ok(r.c3serv, `${k}: la cita de 1 h (Emma) muestra el tratamiento`);
      ok(r.c3sinAbono, `${k}: Emma muestra "Sin abono"`);
      if (ancho >= 390) ok(r.c3sinAbonoTexto, `${k}: en Emma "Sin abono" se lee en palabras (hay espacio)`);
      ok(r.c7sinAbono, `${k}: Valentina (30 min) muestra "Sin abono"`);
      ok(r.c3firma, `${k}: Emma muestra "Falta firmar"`);
    }
    await cerrar();
  }
}
await cerrarNavegador(); await cerrarEmulador();
console.log(fallos ? `${fallos} fallos en ${pruebas} pantallas` : `todo bien (${pruebas} pantallas)`); process.exit(fallos ? 1 : 0);
