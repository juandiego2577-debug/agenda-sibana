// Barra de arriba y de herramientas (Task 3 del rediseño):
// - con 5 especialistas, "+ Nueva cita" sigue arriba a la derecha (1024 y 1517 px)
// - la inicial de cada especialista se lee sobre su color (textoSobre)
// - pestañas y barra llevan íconos dibujados (SVG), no emojis
import { prepararEmulador, cerrarEmulador, abrirAgenda, htmlDe, cerrarNavegador, datosPrueba } from './comun.mjs';
let fallos = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) fallos++; };
const cinco = d => { d.specialists.push({ id: 'e5', name: 'Antonella', color: '#f5f5f5' }, { id: 'e6', name: 'Noemí', color: '#111111' }); return d; };
await prepararEmulador({ modificar: cinco });
for (const ancho of [1024, 1517]) {
  const { page, cerrar } = await abrirAgenda({ html: htmlDe('trabajo'), ancho });
  const r = await page.evaluate(() => {
    const b = document.querySelector('[data-act="new-appt"]').getBoundingClientRect();
    const hoy = document.querySelector('[data-act="today"]').getBoundingClientRect();
    return { right: b.right, top: b.top, hoyTop: hoy.top, W: innerWidth };
  });
  ok(Math.abs(r.top - r.hoyTop) < 12, `${ancho}px: "+ Nueva cita" en la primera fila de la barra (top ${Math.round(r.top)} vs Hoy ${Math.round(r.hoyTop)})`);
  ok(r.W - r.right <= 24, `${ancho}px: "+ Nueva cita" pegado a la derecha (${Math.round(r.W - r.right)} px del borde)`);
  if (ancho === 1517) {
    const t = await page.evaluate(() => typeof textoSobre === 'function' ? [textoSobre('#f5f5f5'), textoSobre('#111111'), textoSobre('#c03aa8'), textoSobre('#7fd3db')] : null);
    ok(t && t[0] === '#0b0a08' && t[1] === '#ffffff' && t[2] === '#ffffff' && t[3] === '#0b0a08', 'textoSobre elige negro o blanco según el color: ' + JSON.stringify(t));
    const ic = await page.evaluate(() => [...document.querySelectorAll('.section-tabs button, .toolbar > .btn, .toolbar .morewrap > .btn')].map(b => ({ t: b.textContent.trim(), svg: !!b.querySelector('svg'), emoji: /\p{Extended_Pictographic}/u.test(b.textContent) })));
    ok(ic.length >= 9 && ic.every(x => !x.emoji), 'pestañas y barra sin emojis: ' + ic.filter(x => x.emoji).map(x => x.t).join(', '));
    ok(ic.filter(x => x.t !== 'Hoy').every(x => x.svg), 'cada pestaña/botón (menos Hoy) lleva su ícono dibujado');
    const ini = await page.evaluate(() => [...document.querySelectorAll('.specfilter .inicial')].map(e => [e.textContent, getComputedStyle(e).color]));
    ok(ini.length === 6, 'cada especialista lleva su inicial en el filtro (' + ini.length + ')');
  }
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(fallos ? `${fallos} fallos` : 'todo bien'); process.exit(fallos ? 1 : 0);
