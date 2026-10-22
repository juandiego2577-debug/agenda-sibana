// Revisa que nada se salga de la pantalla ni quede cortado, en todos los anchos,
// modos, sedes y roles. Sin MODO=antes, compara contra medidas-antes.txt y
// solo falla por problemas NUEVOS.
// Uso: VERSION=trabajo npx firebase emulators:exec ... "node medidas.mjs"
import fs from 'fs';
import { prepararEmulador, cerrarEmulador, abrirAgenda, recorrer, revisarMedidas, htmlDe, cerrarNavegador } from './comun.mjs';
const VERSION = process.env.VERSION || 'trabajo';
const ANCHOS = (process.env.ANCHOS || '320,360,390,430,768,1024,1517').split(',').map(Number);
const TEMAS = (process.env.TEMAS || 'oscuro,claro').split(',');
const SEDES = (process.env.SEDES || 'santiago,buenosaires').split(',');
const ROLES = (process.env.ROLES || 'duenos,especialista').split(',');
const LARGOS = process.env.LARGOS === '1';
const SALIDA = process.env.SALIDA;
const lineas = [];
for (const sede of SEDES) for (const rol of ROLES) for (const tema of TEMAS) {
  if (rol === 'especialista' && sede !== 'santiago') continue;
  await prepararEmulador({ nombresLargos: LARGOS });
  for (const ancho of ANCHOS) {
    const { page, errores, cerrar } = await abrirAgenda({ html: htmlDe(VERSION), rol, sede, ancho, tema });
    await recorrer(page, rol, async (nombre, ok) => {
      if (!ok) return;
      for (const p of await revisarMedidas(page)) lineas.push(`${sede}|${rol}|${tema}|${ancho}|${nombre}|${p}`);
    });
    errores.forEach(e => lineas.push(`${sede}|${rol}|${tema}|${ancho}|-|ERROR ${e}`));
    await cerrar();
  }
}
await cerrarNavegador(); await cerrarEmulador();
if (SALIDA) fs.writeFileSync(SALIDA, lineas.join('\n') + '\n');
// Comparar contra lo que ya pasaba antes (sin contar tema: antes solo había oscuro)
const base = fs.existsSync(new URL('./medidas-antes.txt', import.meta.url)) && !SALIDA
  ? new Set(fs.readFileSync(new URL('./medidas-antes.txt', import.meta.url), 'utf8').split('\n').filter(Boolean).map(l => l.split('|').filter((_, i) => i !== 2).join('|')))
  : null;
const nuevos = base ? lineas.filter(l => !base.has(l.split('|').filter((_, i) => i !== 2).join('|'))) : lineas;
nuevos.forEach(l => console.log('  ✗ ' + l));
console.log(`${nuevos.length} problemas${base ? ' nuevos' : ''} (${lineas.length} en total)`);
process.exit(nuevos.length ? 1 : 0);
