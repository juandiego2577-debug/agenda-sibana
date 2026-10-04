# Respaldo: volver a la agenda de antes de las sedes

`index-version-anterior.html.txt` es la agenda **exactamente como estaba
publicada antes** del cambio a varias sedes (Santiago + Buenos Aires), con un
único cambio: `APP_VERSION = 5`.

## Por qué el 5

La agenda nueva guarda `appVersion: 4` en la base de datos. Si se volviera a
publicar la versión vieja tal cual (que tiene `APP_VERSION = 3`), vería que la
base dice 4 y se negaría a guardar ("Hay una versión nueva… Recargar") para
siempre. Con 5, la versión de respaldo puede guardar normalmente, y cualquier
teléfono que todavía tenga la versión nueva abierta verá el aviso de recargar
y pasará solo a la de respaldo.

Está guardada con extensión `.txt` a propósito: así GitHub Pages NO la
publica como página que funcione (si alguien la abriera y guardara algo,
dejaría a la agenda nueva sin poder guardar).

## Cómo volver atrás (solo si algo sale mal)

1. Copiar el contenido de `index-version-anterior.html.txt` sobre
   `index.html` (en la raíz del repo) y publicar ese cambio.
2. Los datos no se pierden: la agenda vieja ignora los campos nuevos
   (`micropigmentacion`, `tratamientosMicro`, `conDescuentoMicro`, etc.).
3. Las reglas de Firestore nuevas son compatibles con la versión vieja
   (probado con el emulador): no hace falta tocarlas.

Además, los datos tienen sus propios respaldos: el respaldo automático diario
(Más → Respaldos) y la Hoja de Google.
