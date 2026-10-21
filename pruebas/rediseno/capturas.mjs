// Guarda una captura de cada pantalla (teléfono y computador, oscuro y claro,
// Santiago y Buenos Aires, dueños y especialista) en $OUT.
// Uso: OUT=/ruta VERSION=trabajo npx firebase emulators:exec ... "node capturas.mjs"
import fs from 'fs';
import { prepararEmulador, cerrarEmulador, abrirAgenda, recorrer, htmlDe, cerrarNavegador } from './comun.mjs';
const OUT = process.env.OUT || './capturas'; fs.mkdirSync(OUT, { recursive: true });
const VERSION = process.env.VERSION || 'trabajo';
const ANCHOS = (process.env.ANCHOS || '390,1517').split(',').map(Number);
const TEMAS = (process.env.TEMAS || 'oscuro,claro').split(',');
const SEDES = (process.env.SEDES || 'santiago,buenosaires').split(',');
const ROLES = (process.env.ROLES || 'duenos,especialista').split(',');
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
let n = 0;
for (const sede of SEDES) for (const rol of ROLES) for (const tema of TEMAS) {
  if (rol === 'especialista' && sede !== 'santiago') continue;
  await prepararEmulador();
  for (const ancho of ANCHOS) {
    const { page, cerrar } = await abrirAgenda({ html: htmlDe(VERSION), rol, sede, ancho, tema });
    await recorrer(page, rol, async (nombre, ok) => {
      if (!ok || (SOLO && !SOLO.includes(nombre))) return;
      await page.screenshot({ path: `${OUT}/${sede}_${rol}_${tema}_${ancho}_${nombre}.png`, fullPage: ancho > 600 ? false : true });
      n++;
    });
    await cerrar();
  }
}
await cerrarNavegador(); await cerrarEmulador();
console.log(`${n} capturas en ${OUT}`);
