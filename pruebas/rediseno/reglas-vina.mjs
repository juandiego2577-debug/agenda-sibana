// Reglas de Firebase para la sede Viña del Mar y las especialistas con dos
// sedes (otrasSedes). Contra el emulador, con datos inventados.
// Uso: npx firebase emulators:exec --only firestore --project sibana-santiago "node reglas-vina.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';
const AGENDA_DIR = path.resolve(new URL('../..', import.meta.url).pathname);
const env = await initializeTestEnvironment({ projectId: 'sibana-santiago',
  firestore: { rules: fs.readFileSync(path.join(AGENDA_DIR, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
const tok = email => ({ email, firebase: { sign_in_provider: 'password' } });
const usuarios = {
  vina: { nombre: 'Camila', email: 'camila@prueba.cl', sede: 'vina', rol: 'especialista', activo: true },
  dos: { nombre: 'Salomé', email: 'salome@prueba.cl', sede: 'santiago', rol: 'especialista', activo: true, otrasSedes: ['vina'] },
  stgo: { nombre: 'Lucy', email: 'lucy@prueba.cl', sede: 'santiago', rol: 'especialista', activo: true },
  dosInactiva: { nombre: 'Helen', email: 'helen@prueba.cl', sede: 'santiago', rol: 'especialista', activo: false, otrasSedes: ['vina'] },
};
const hoy = new Date().toISOString().slice(0, 10);
const png = 'data:image/png;base64,iVBORw0KGgo=';
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  for (const [uid, u] of Object.entries(usuarios)) await db.doc('sibana-usuarios/' + uid).set(u);
  for (const s of ['santiago', 'vina', 'buenosaires']) await db.doc('sibana-agenda/' + s).set({ appointments: [], settings: {} });
  await db.doc('sibana-consentimientos-vina/f1').set({ nombre: 'Ficha Viña', submittedAtClient: '2026-10-20T10:00:00Z' });
  await db.doc('sibana-consentimientos/f2').set({ nombre: 'Ficha Santiago', submittedAtClient: '2026-10-20T10:00:00Z' });
});
const as = uid => env.authenticatedContext(uid, tok(usuarios[uid] ? usuarios[uid].email : uid)).firestore();
const duenos = env.authenticatedContext('duenos', tok('juandiego2577+duenos@gmail.com')).firestore();
const anon = env.authenticatedContext('anon', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
let n = 0, fallas = 0;
async function caso(nombre, p) { n++; try { await p; console.log('  ✓', nombre); } catch (e) { fallas++; console.log('  ✗', nombre, '—', e.message.split('\n')[0]); } }
const ficha = { step: 4, nombre: 'Clienta Prueba', ciudad: 'Viña del Mar', rut: '11.111.111-1', firmaDataUrl: png, acepta_terminos: true, submittedAtClient: new Date().toISOString() };

console.log('Agenda de Viña');
await caso('especialista de Viña lee Viña', assertSucceeds(as('vina').doc('sibana-agenda/vina').get()));
await caso('especialista de Viña guarda en Viña', assertSucceeds(as('vina').doc('sibana-agenda/vina').update({ x: 1 })));
await caso('especialista de Viña NO lee Santiago', assertFails(as('vina').doc('sibana-agenda/santiago').get()));
await caso('especialista de Viña NO lee Buenos Aires', assertFails(as('vina').doc('sibana-agenda/buenosaires').get()));
await caso('especialista de Santiago NO lee Viña', assertFails(as('stgo').doc('sibana-agenda/vina').get()));
await caso('especialista de Santiago sigue leyendo Santiago', assertSucceeds(as('stgo').doc('sibana-agenda/santiago').get()));
await caso('dueños leen Viña', assertSucceeds(duenos.doc('sibana-agenda/vina').get()));
await caso('nadie borra la agenda de Viña', assertFails(duenos.doc('sibana-agenda/vina').delete()));
console.log('Especialista con dos sedes');
await caso('lee Santiago', assertSucceeds(as('dos').doc('sibana-agenda/santiago').get()));
await caso('lee y guarda Viña', assertSucceeds(as('dos').doc('sibana-agenda/vina').update({ y: 1 })));
await caso('NO lee Buenos Aires', assertFails(as('dos').doc('sibana-agenda/buenosaires').get()));
await caso('desactivada NO lee Viña', assertFails(as('dosInactiva').doc('sibana-agenda/vina').get()));
await caso('desactivada NO lee Santiago', assertFails(as('dosInactiva').doc('sibana-agenda/santiago').get()));
await caso('ella NO se puede agregar otra sede', assertFails(as('stgo').doc('sibana-usuarios/stgo').update({ otrasSedes: ['vina'] })));
await caso('respaldo de Viña de hoy (ella)', assertSucceeds(as('dos').doc('sibana-agenda-respaldos/vina_' + hoy).set({ a: 1 })));
console.log('Equipo (dueños)');
await caso('dueños agregan Viña a una especialista', assertSucceeds(duenos.doc('sibana-usuarios/stgo').update({ otrasSedes: ['vina'] })));
await caso('dueños aprueban a alguien de Viña', assertSucceeds(duenos.doc('sibana-usuarios/nueva').set({ nombre: 'Nueva', email: 'n@prueba.cl', sede: 'vina', rol: 'especialista', activo: true })));
await caso('sede inventada en otrasSedes: no', assertFails(duenos.doc('sibana-usuarios/stgo').update({ otrasSedes: ['copiapo'] })));
await caso('otrasSedes que no es lista: no', assertFails(duenos.doc('sibana-usuarios/stgo').update({ otrasSedes: 'vina' })));
await caso('sede principal inventada: no', assertFails(duenos.doc('sibana-usuarios/nueva2').set({ nombre: 'X', email: 'x@prueba.cl', sede: 'copiapo', rol: 'especialista', activo: true })));
console.log('Fichas de Viña');
await caso('la clienta (sesión anónima) firma en Viña', assertSucceeds(anon.collection('sibana-consentimientos-vina').add(ficha)));
await caso('firma con imagen falsa: no', assertFails(anon.collection('sibana-consentimientos-vina').add({ ...ficha, firmaDataUrl: 'javascript:alert(1)' })));
await caso('campo que no está en la ficha: no', assertFails(anon.collection('sibana-consentimientos-vina').add({ ...ficha, otro: 'x' })));
await caso('la clienta NO lee fichas de Viña', assertFails(anon.doc('sibana-consentimientos-vina/f1').get()));
await caso('especialista de Viña lee fichas de Viña', assertSucceeds(as('vina').collection('sibana-consentimientos-vina').get()));
await caso('especialista de Viña NO lee fichas de Santiago', assertFails(as('vina').collection('sibana-consentimientos').get()));
await caso('especialista de Santiago (sin Viña) NO lee fichas de Viña', assertFails(as('dosInactiva').collection('sibana-consentimientos-vina').get()));
await caso('especialista con dos sedes lee fichas de Viña', assertSucceeds(as('dos').collection('sibana-consentimientos-vina').get()));
await caso('dueños leen fichas de Viña', assertSucceeds(duenos.collection('sibana-consentimientos-vina').get()));
await caso('nadie modifica una ficha firmada', assertFails(duenos.doc('sibana-consentimientos-vina/f1').update({ nombre: 'Otra' })));
await caso('dueños borran una ficha de Viña', assertSucceeds(duenos.doc('sibana-consentimientos-vina/f1').delete()));
await caso('fichas de Santiago siguen igual (especialista de Santiago lee)', assertSucceeds(as('stgo').collection('sibana-consentimientos').get()));
await env.cleanup();
console.log(`${n - fallas}/${n} pruebas de reglas bien`);
process.exit(fallas ? 1 : 0);
