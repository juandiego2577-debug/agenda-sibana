// Citas cortas seguidas (10 min) en la vista Día: nunca una encima de otra.
// Uso: npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node cortas.mjs"
import { prepararEmulador, cerrarEmulador, htmlDe, abrirAgenda, cerrarNavegador, esperarCalma } from './comun.mjs';
let n = 0, fallas = 0;
const ok = (t, c, x = '') => { n++; if (c) console.log('  ✓', t); else { fallas++; console.log('  ✗', t, x); } };
await prepararEmulador();
const html = htmlDe(process.env.VER || 'trabajo');
const OUT = process.env.OUT;
for (const ancho of [390, 1517]) {
  const { page, errores, cerrar } = await abrirAgenda({ html, ancho, movil: ancho < 600 });
  await page.evaluate(() => {
    const c = (id, start, end, sp, services, extra = {}) => ({ id, date: '2026-10-28', start, end, client: 'Clienta ' + id, services, specialist: sp, estado: 'Pendiente', price: 9990, abono: 0, saldo: 9990, ...extra });
    state.appointments.push(
      c('c1', '14:30', '14:40', 'Lucy', ['Perfilado de Cejas (C)']),
      c('c2', '15:00', '17:00', 'Lucy', ['Delineado de Ojos (DO)']),
      c('c3', '17:00', '17:10', 'Lucy', ['Depilación']),
      c('c4', '17:10', '17:20', 'Lucy', ['Perfilado de Cejas (C)']),
      c('c5', '17:20', '17:30', 'Lucy', ['Perfilado de Cejas (C)']),
      c('c6', '11:00', '12:00', 'Salomé', ['Microblading (MB)']),
      c('c7', '11:00', '11:10', 'Lucy', ['Perfilado de Cejas (C)']),
    );
    ui.currentDate = new Date(2026, 9, 28); ui.view = 'day'; render();
  });
  await esperarCalma(page);
  const r = await page.evaluate(() => {
    const cajas = [...document.querySelectorAll('.appt')].filter(e => !e.classList.contains('ghost-appt')).map(e => { const b = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 40), l: b.left, r: b.right, top: b.top, bot: b.bottom }; });
    const choques = [];
    for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) {
      const a = cajas[i], b = cajas[j];
      if (Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.bot, b.bot) - Math.max(a.top, b.top) > 1) choques.push(a.t + ' ⟂ ' + b.t);
    }
    return { n: cajas.length, choques, anchoTotal: cajas.filter(c => /c2/.test(c.t)).map(c => c.r - c.l) };
  });
  ok(`${ancho}px: se ven las 7 citas`, r.n === 7, r.n);
  ok(`${ancho}px: ninguna cita tapa a otra`, r.choques.length === 0, r.choques.join(' | '));
  const pos = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.appt')].map(e => { const m = e.textContent.match(/Clienta (c\d)/); const b = e.getBoundingClientRect(); return [m && m[1], { l: Math.round(b.left), w: Math.round(b.width), h: b.height, top: b.top }]; })));
  ok(`${ancho}px: las 3 cortas seguidas de Lucy van en la misma columna, una debajo de otra`, pos.c3.l === pos.c4.l && pos.c4.l === pos.c5.l && pos.c3.w === pos.c4.w && pos.c3.top < pos.c4.top && pos.c4.top < pos.c5.top, JSON.stringify([pos.c3, pos.c4, pos.c5]));
  ok(`${ancho}px: cada cita de 10 min mide lo mismo (lo que dura)`, Math.abs(pos.c3.h - pos.c4.h) < 1 && pos.c3.h >= 25, JSON.stringify([pos.c3.h, pos.c4.h]));
  ok(`${ancho}px: Salomé 11:00–12:00 y Lucy 11:00–11:10 (se cruzan de verdad) siguen lado a lado`, pos.c6.l < pos.c7.l);
  const filas = await page.evaluate(() => [...document.querySelectorAll('.timecol .slot')].map(e => [e.textContent.trim(), Math.round(e.getBoundingClientRect().height)]));
  const alto = Object.fromEntries(filas);
  ok(`${ancho}px: solo se agranda la hora de 17:00 (y la de 11:00 no)`, alto['17:00'] > 56 && alto['11:00'] === 56 && alto['14:00'] === 56 && alto['16:00'] === 56, JSON.stringify(filas));
  ok(`${ancho}px: una cita sola (15:00–17:00) sigue a todo el ancho`, await page.evaluate(() => { const e = [...document.querySelectorAll('.appt')].find(x => x.textContent.includes('Clienta c2')); return e && !e.style.width; }));
  if (OUT) await page.screenshot({ path: `${OUT}/cortas-${ancho}.png`, fullPage: true });
  ok(`${ancho}px: sin errores`, errores.length === 0, errores.join(' | '));
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(`${n - fallas}/${n} bien`); process.exit(fallas ? 1 : 0);
