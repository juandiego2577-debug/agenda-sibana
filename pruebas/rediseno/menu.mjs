// El menú "Más" siempre dentro de la pantalla (antes, a 768 px, se salía).
import { prepararEmulador, cerrarEmulador, abrirAgenda, htmlDe, cerrarNavegador } from './comun.mjs';
let fallos = 0;
await prepararEmulador();
for (const ancho of [320, 390, 430, 768, 1024, 1517]) {
  const { page, cerrar } = await abrirAgenda({ html: htmlDe(process.env.VERSION || 'trabajo'), ancho });
  await page.click('[data-act="toggle-menu"]'); await page.waitForTimeout(200);
  const r = await page.evaluate(() => { const m = document.querySelector('.moremenu').getBoundingClientRect(); return [Math.round(m.left), Math.round(m.right), innerWidth]; });
  const ok = r[0] >= 0 && r[1] <= r[2]; if (!ok) fallos++;
  console.log((ok ? '  ✓' : '  ✗') + ` ${ancho}px menú Más dentro de la pantalla ${r}`);
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(fallos ? fallos + ' fallos' : 'todo bien'); process.exit(fallos ? 1 : 0);
