// Revisa que la hoja de estilos de la agenda use VARIABLES de color (así el
// modo claro y Buenos Aires cambian todo de una vez). Permitidos: las
// definiciones de variables (:root…{--x:…}), blanco/negro puros y transparentes.
// Uso: node colores.mjs   (sale con código 1 si encuentra colores sueltos)
import fs from 'fs';
import path from 'path';
const AGENDA_DIR = path.resolve(process.env.AGENDA_DIR || new URL('../..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(AGENDA_DIR, 'index.html'), 'utf8');
const ini = html.indexOf('<style>'), fin = html.indexOf('</style>', ini);
const css = html.slice(ini, fin);
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;
// blanco/negro puros y sombras negras; un blanco TRANSPARENTE no (en modo claro desaparece: así se perdieron las rayas de las horas cerradas)
const permitido = c => /^#(fff|ffffff|000|000000)$/i.test(c) || /^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,/.test(c);
const malos = [];
css.split('\n').forEach((l, i) => {
  // declaraciones de variables: --nombre: valor;
  const sinVars = l.replace(/--[\w-]+\s*:[^;{}]*;?/g, '');
  for (const c of sinVars.match(COLOR) || []) if (!permitido(c)) malos.push(`style línea ${i + 1}: ${c}   ${l.trim().slice(0, 110)}`);
});
// estilos en línea dentro de las plantillas de la agenda (después del <style>)
const resto = html.slice(fin);
const re = /style="([^"]*)"/g; let m;
while ((m = re.exec(resto))) for (const c of m[1].match(COLOR) || []) if (!permitido(c)) malos.push(`style="…": ${c}   ${m[1].slice(0, 100)}`);
malos.forEach(x => console.log('  ✗ ' + x));
console.log(`${malos.length} colores sueltos`);
process.exit(malos.length ? 1 : 0);
