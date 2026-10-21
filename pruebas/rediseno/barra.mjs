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
    const ic = await page.evaluate(() => [...document.querySelectorAll('.section-tabs button, .toolbar > .btn, .toolbar .morewrap > .btn')].map(b => ({ t: b.textContent.trim(), svg: !!b.querySelector('svg, .mas-circulo'), emoji: /\p{Extended_Pictographic}/u.test(b.textContent) })));
    ok(ic.length >= 9 && ic.every(x => !x.emoji), 'pestañas y barra sin emojis: ' + ic.filter(x => x.emoji).map(x => x.t).join(', '));
    ok(ic.filter(x => x.t !== 'Hoy').every(x => x.svg), 'cada pestaña/botón (menos Hoy) lleva su ícono dibujado');
    const ini = await page.evaluate(() => [...document.querySelectorAll('.specfilter .inicial')].map(e => [e.textContent, getComputedStyle(e).color]));
    ok(ini.length === 6, 'cada especialista lleva su inicial en el filtro (' + ini.length + ')');
  }
  await cerrar();
}
// Especialista en computador: "Vale" sigue en la misma fila, a la derecha (como antes)
for (const ancho of [1024, 1517]) {
  const { page, cerrar } = await abrirAgenda({ html: htmlDe('trabajo'), ancho, rol: 'especialista' });
  const r = await page.evaluate(() => {
    const q = s => document.querySelector(s).getBoundingClientRect();
    const v = q('[data-act="open-vales"]');
    return { top: v.top, hoyTop: q('[data-act="today"]').top, bloqTop: q('[data-act="new-block"]').top, right: v.right, W: innerWidth };
  });
  // Antes: a 1517 todo en una fila; a 1024 especialistas + Bloquear + Vale en la 2da fila. Vale siempre a la derecha, junto a Bloquear.
  const fila = ancho === 1517 ? r.hoyTop : r.bloqTop;
  ok(Math.abs(r.top - fila) < 12 && Math.abs(r.top - r.bloqTop) < 12 && r.W - r.right <= 24, `${ancho}px especialista: "Vale" a la derecha, junto a "Bloquear hora"${ancho === 1517 ? ', en la primera fila' : ''} (top ${Math.round(r.top)}, Hoy ${Math.round(r.hoyTop)}, Bloquear ${Math.round(r.bloqTop)}, ${Math.round(r.W - r.right)} px del borde)`);
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(fallos ? `${fallos} fallos` : 'todo bien'); process.exit(fallos ? 1 : 0);
