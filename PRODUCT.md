# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Especialistas** (Salomé, Lucy, Melissa, Helen…): la abren en su teléfono durante el día, entre
  clientas, a veces con guantes o apuradas. Ven su agenda, marcan citas como realizadas, anotan vales y
  compras, bloquean horas y revisan "Mi pago".
- **Dueños** (Juan Diego y su papá, Franklin): en computador (~1517 px de ancho) y en teléfono, por
  igual. Agendan, reprograman, cobran, revisan Pagos, Finanzas, Garantías, Stock, Certificados, Equipo.
- Sedes: Santiago (en marcha) y Buenos Aires (en construcción). Juan Diego a veces la usa desde otro país.

## Product Purpose
Agenda interna del centro de micropigmentación Sibana: citas, cursos, pagos a las especialistas,
finanzas, garantías, stock, consentimientos y certificados. Reemplazó a una agenda en papel/AgendaPro.
Éxito = el equipo agenda y cierra cada cita sin errores ni dudas, y el pago de cada semana sale solo.

## Positioning
Hecha a la medida de Sibana: sus reglas de comisión, su semana de pago lun–sáb, sus dos box, sus
especialistas y sus dos sedes. No es un SaaS genérico.

## Operating Context
- Un solo archivo HTML (sin build), en GitHub Pages; datos en Firebase. Se instala como app en el teléfono.
- Se usa todo el día en el estudio (luz interior), y por la noche desde casa para revisar pagos.
- El equipo está acostumbrado a dónde está cada botón: un botón nuevo va siempre al final.

## Capabilities and Constraints
- Rediseño pedido el 20/10/2026: cambiar SOLO cómo se ve, sin cambiar ninguna función. Juan Diego duda
  de que valga la pena a estas alturas ("funciona perfectamente, pero no me gusta cómo se ve; se ve
  anticuada, es casi el diseño de la primera versión").
- Intocable (confirmado): el lugar y el orden de los botones; los colores de Sibana en Santiago
  (negro y dorado); los colores de la bandera argentina en Buenos Aires (se generan reemplazando cada
  color de la hoja de Santiago: `TEMA_BANDERA_ARGENTINA`).
- Medidas que dependen del tamaño de letra (ej. `COMPACT_HEIGHT_PX` de la vista Día) hay que re-medirlas
  si cambia la tipografía.
- Solo scripts de cdnjs; letras de Google Fonts.

## Brand Commitments
- Sibana: negro y dorado, logo dorado con el rostro. Mismo mundo que los certificados y la página de
  verificación (que a Juan Diego le "impactó").
- Español neutro para el equipo (Juan Diego es venezolano); textos a clientas pueden sonar a Chile;
  "dinero", nunca "plata".

## Product Principles
1. Lo que hacen todos los días va primero: ver el día, agendar, cerrar una cita.
2. Nunca mover lo que el equipo ya aprendió.
3. Claridad antes que adorno: el color dice estado o especialista, no decora.
4. El teléfono es tan importante como el computador.
