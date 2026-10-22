// Modo claro (Task 5 del rediseño): botón sol/luna en la barra de arriba, a la
// izquierda del nombre / "Sede", que no mueve nada; se recuerda por aparato
// (localStorage 'sibanaTema'), nunca en Firebase; la barra de arriba sigue negra.
import { prepararEmulador, cerrarEmulador, abrirAgenda, htmlDe, cerrarNavegador, CLAVE, CORREO_SALOME } from './comun.mjs';
let fallos = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) fallos++; };
const fondo = p => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
const barra = p => p.evaluate(() => getComputedStyle(document.querySelector('header.topbar')).backgroundImage + ' ' + getComputedStyle(document.querySelector('header.topbar')).backgroundColor);
const derecha = p => p.evaluate(() => { const e = document.querySelector('.topbar-right > :last-child').getBoundingClientRect(); return Math.round(innerWidth - e.right); });
await prepararEmulador();
for (const [rol, ancho] of [['duenos', 1517], ['especialista', 390], ['duenos', 320]]) {
  const { page, ctx, cerrar } = await abrirAgenda({ html: htmlDe('trabajo'), rol, ancho });
  const k = `${rol} ${ancho}px`;
  ok(await page.evaluate(() => !document.documentElement.dataset.tema), `${k}: por defecto, modo oscuro`);
  ok(await fondo(page) === 'rgb(16, 13, 9)', `${k}: fondo oscuro #100d09 (${await fondo(page)})`);
  const btn = await page.$('.topbar-right > [data-act="toggle-tema"]:first-child');
  ok(!!btn, `${k}: botón sol/luna es lo primero de la derecha de la barra`);
  ok(await derecha(page) <= 24, `${k}: el nombre / Sede sigue pegado a la derecha (${await derecha(page)} px)`);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${k}: nada se sale de la pantalla`);
  if (!btn) { await cerrar(); continue; }
  ok(/claro/i.test(await btn.getAttribute('aria-label') || ''), `${k}: dice "Modo claro" para lectores de pantalla`);
  await btn.click(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.documentElement.dataset.tema === 'claro' && localStorage.getItem('sibanaTema') === 'claro'), `${k}: al tocarlo pasa a claro y se recuerda`);
  ok(await fondo(page) === 'rgb(243, 242, 238)', `${k}: fondo claro #f3f2ee (${await fondo(page)})`);
  const b = await barra(page);
  ok(/rgb\(0, 0, 0\)|rgb\(10, 9, 8\)/.test(b), `${k}: la barra de arriba sigue negra (${b.slice(0, 60)})`);
  ok(/oscuro/i.test(await page.getAttribute('[data-act="toggle-tema"]', 'aria-label') || ''), `${k}: ahora el botón dice "Modo oscuro"`);
  await page.reload(); await page.waitForSelector('[data-act="new-block"]', { timeout: 30000 });
  ok(await page.evaluate(() => document.documentElement.dataset.tema === 'claro'), `${k}: al recargar sigue en claro`);
  await page.click('[data-act="toggle-tema"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !document.documentElement.dataset.tema && localStorage.getItem('sibanaTema') === null), `${k}: volver a tocar → oscuro y se borra la preferencia`);
  await cerrar();
}
// Sin destello: con 'claro' guardado, la página nace clara (antes de cargar Firebase)
{
  const { page, cerrar } = await abrirAgenda({ html: htmlDe('trabajo'), tema: 'claro', ancho: 390 });
  await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
  const t = await page.evaluate(() => document.documentElement.dataset.tema || 'oscuro');
  ok(t === 'claro', 'con modo claro guardado, la página nace clara (sin destello oscuro)');
  await cerrar();
}
await cerrarNavegador(); await cerrarEmulador();
console.log(fallos ? `${fallos} fallos` : 'todo bien'); process.exit(fallos ? 1 : 0);
