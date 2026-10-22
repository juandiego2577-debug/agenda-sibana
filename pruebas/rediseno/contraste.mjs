// Contraste AA (4.5:1) de los pares de colores que la agenda usa para TEXTO,
// en los dos modos y en las dos sedes (Buenos Aires = reemplazos de
// TEMA_BANDERA_ARGENTINA + su "extra"). Lee las variables de index.html.
import fs from 'fs';
import path from 'path';
const AGENDA_DIR = path.resolve(process.env.AGENDA_DIR || new URL('../..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(AGENDA_DIR, 'index.html'), 'utf8');
const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
const bloque = sel => { const i = css.indexOf(sel + '{'); if (i < 0) return ''; return css.slice(i, css.indexOf('}', i)); };
const vars = txt => Object.fromEntries([...txt.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)].map(m => [m[1], m[2].toLowerCase()]));
const oscuro = vars(bloque('  :root')), claro = { ...oscuro, ...vars(bloque('  :root[data-tema="claro"]')) };
// Buenos Aires: mismos reemplazos que aplicarTemaSede
const ba = html.slice(html.indexOf('const TEMA_BANDERA_ARGENTINA'));
const reemplazos = [...ba.slice(0, ba.indexOf('extra:')).matchAll(/\['(#[0-9A-Fa-f]{6})',\s*'(#[0-9A-Fa-f]{6})'\]/g)].map(m => [m[1].toLowerCase(), m[2].toLowerCase()]);
const extra = ba.slice(ba.indexOf('extra:'), ba.indexOf('themeColor'));
const aBA = v => Object.fromEntries(Object.entries(v).map(([k, c]) => [k, (reemplazos.find(r => r[0] === c) || [0, c])[1]]));
const baClaro = { ...aBA(claro), ...vars((extra.match(/:root\[data-tema="claro"\]\{[^}]*\}/) || [''])[0]) };
const baOscuro = { ...aBA(oscuro), ...vars((extra.match(/:root\{[^}]*\}/) || [''])[0]) };
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// [texto, fondo] — los usos reales de las variables como texto
const PARES = [['ink', 'bg'], ['ink', 'panel'], ['ink-soft', 'panel'], ['ink-soft', 'bg'], ['mute', 'panel'], ['mute', 'bg'],
  ['gold', 'panel'], ['gold', 'bg'], ['warn-text', 'panel'], ['ok-text', 'panel'], ['danger-text', 'panel'], ['on-accent', 'gold-fill'], ['wine-dark', 'wine']];
let fallos = 0;
for (const [nombre, v] of [['Santiago oscuro', oscuro], ['Santiago claro', claro], ['Buenos Aires oscuro', baOscuro], ['Buenos Aires claro', baClaro]]) {
  for (const [t, f] of PARES) {
    if (!v[t] || !v[f]) { console.log(`  ✗ ${nombre}: falta la variable --${!v[t] ? t : f}`); fallos++; continue; }
    const r = ratio(v[t], v[f]);
    if (r < 4.5) { console.log(`  ✗ ${nombre}: --${t} ${v[t]} sobre --${f} ${v[f]} = ${r.toFixed(2)}:1`); fallos++; }
  }
}
console.log(fallos ? `${fallos} pares sin contraste suficiente` : 'todo bien'); process.exit(fallos ? 1 : 0);
