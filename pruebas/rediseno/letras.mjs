// Letra mínima 11 px (rediseño): revisa la hoja de estilos y los style="…" de
// las plantillas. Sale con código 1 si encuentra algo más chico.
import fs from 'fs';
import path from 'path';
const AGENDA_DIR = path.resolve(process.env.AGENDA_DIR || new URL('../..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(AGENDA_DIR, 'index.html'), 'utf8');
const malos = [];
const re = /font-size:\s*([\d.]+)px/g; let m;
const ini = html.indexOf('<style>'), fin = html.indexOf('</style>', ini);
const revisar = (txt, donde) => { let k; re.lastIndex = 0; while ((k = re.exec(txt))) if (parseFloat(k[1]) < 11) malos.push(`${donde}: ${k[0]}  …${txt.slice(Math.max(0, k.index - 60), k.index + 20).replace(/\s+/g, ' ')}`); };
revisar(html.slice(ini, fin), 'style');
const rs = /style="([^"]*)"/g; while ((m = rs.exec(html.slice(fin)))) revisar(m[1], 'style="…"');
// textos de los gráficos SVG
const rf = /font-size="([\d.]+)"/g; while ((m = rf.exec(html))) if (parseFloat(m[1]) < 11) malos.push('svg font-size=' + m[1]);
malos.forEach(x => console.log('  ✗ ' + x));
console.log(`${malos.length} letras de menos de 11 px`); process.exit(malos.length ? 1 : 0);
