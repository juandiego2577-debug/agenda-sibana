# Pruebas del rediseño visual

Prueban la agenda (`index.html`) contra los emuladores de Firebase con datos
**inventados**. No tocan el Firebase real.

- `paridad.mjs`: compara la versión publicada (`ANTES`, por defecto `b5082a2`)
  con la del directorio (`AHORA=trabajo`), pantalla por pantalla: mismos
  botones, mismo orden, mismos datos y textos (sin contar emojis/íconos).
  Si cambió alguna función o se movió un botón, falla.
- `medidas.mjs`: nada fuera de la pantalla, ningún texto cortado, letra ≥ 11 px,
  botones ≥ 36 px en teléfono; en 7 anchos, oscuro/claro, Santiago/BA, dueños y
  especialista. Solo falla por problemas que no estaban en `medidas-antes.txt`
  (la versión publicada). `LARGOS=1` usa nombres muy largos.
- `capturas.mjs`: guarda capturas de cada pantalla en `$OUT`.
- `comun.mjs`: datos de prueba, entrar como dueño o especialista, pantallas.

## Cómo correrlas

Necesita Node 22, Java (para el emulador de Firestore) y, en esta carpeta,
`npm install firebase@10.14.1 firebase-tools@13 @firebase/rules-unit-testing@3 playwright`.

```
npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node paridad.mjs"
npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node medidas.mjs"
OUT=/tmp/capturas npx firebase emulators:exec --only firestore,auth --project sibana-santiago "node capturas.mjs"
```

Variables útiles: `ANCHOS=390,1517`, `SEDES=santiago`, `ROLES=duenos`,
`TEMAS=oscuro`, `DEPURAR=1` (muestra la consola de la página).
