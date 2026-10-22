// Compara la agenda ANTES (versión publicada) con la de AHORA, pantalla por
// pantalla: mismos botones, mismo orden, mismos datos y textos (sin contar
// emojis ni íconos). Sale con código 1 si hay alguna diferencia.
// Uso: ANTES=b5082a2 AHORA=trabajo npx firebase emulators:exec ... "node paridad.mjs"
import fs from 'fs';
import { prepararEmulador, cerrarEmulador, abrirAgenda, recorrer, huella, htmlDe, cerrarNavegador } from './comun.mjs';
const ANTES = process.env.ANTES || 'b5082a2', AHORA = process.env.AHORA || 'trabajo';
const ANCHOS = (process.env.ANCHOS || '390,1517').split(',').map(Number);
const SEDES = (process.env.SEDES || 'santiago,buenosaires').split(',');
const ROLES = (process.env.ROLES || 'duenos,especialista').split(',');
const OUT = process.env.OUT; if (OUT) fs.mkdirSync(OUT, { recursive: true });

async function tomar(version, rol, sede, ancho) {
  await prepararEmulador();
  const { page, errores, cerrar } = await abrirAgenda({ html: htmlDe(version), rol, sede, ancho });
  const res = {};
  await recorrer(page, rol, async (nombre, ok) => { res[nombre] = ok ? await huella(page) : ['NO-DISPONIBLE']; });
  await cerrar();
  return { res, errores };
}
let difs = 0, pantallas = 0;
for (const sede of SEDES) for (const rol of ROLES) {
  if (rol === 'especialista' && sede !== 'santiago') continue; // Salomé es de Santiago
  for (const ancho of ANCHOS) {
    const a = await tomar(ANTES, rol, sede, ancho), b = await tomar(AHORA, rol, sede, ancho);
    if (b.errores.length) { console.log(`  ✗ errores de la página (${AHORA}, ${rol}, ${sede}, ${ancho}): ${b.errores.join(' | ')}`); difs++; }
    for (const nombre of Object.keys(a.res)) {
      pantallas++;
      const x = a.res[nombre], y = b.res[nombre] || ['FALTA'];
      const n = Math.max(x.length, y.length); let i = 0;
      while (i < n && x[i] === y[i]) i++;
      if (i === n) continue;
      difs++;
      console.log(`  ✗ ${sede} · ${rol} · ${ancho}px · ${nombre}: primera diferencia en la línea ${i}\n      antes: ${(x[i] || '(nada)').slice(0, 400)}\n      ahora: ${(y[i] || '(nada)').slice(0, 400)}`);
      if (OUT) fs.writeFileSync(`${OUT}/${sede}_${rol}_${ancho}_${nombre}.txt`, `ANTES\n${x.join('\n')}\n\nAHORA\n${y.join('\n')}\n`);
    }
    console.log(`  · ${sede} · ${rol} · ${ancho}px revisado`);
  }
}
await cerrarNavegador(); await cerrarEmulador();
console.log(`${difs} diferencias en ${pantallas} pantallas`);
process.exit(difs ? 1 : 0);
