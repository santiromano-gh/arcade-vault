---
name: contraste-conocido
description: Avisos y trampas de contraste/implementación ya detectados en skins (asteroides sin avisos; tetris CLÁSICO con avisos)
metadata:
  type: project
---

- asteroides CLÁSICO cumple todo (peor: propulsor `rgba(255,130,0,0.85)` sobre negro = 6.22:1).
- tetris CLÁSICO (no se corrige, es el original): tablero `#1a1a25` más claro que `--bg-3`; etiquetas `#555570` 2.65:1; borde del tablero `#2a2a3a` 1.22:1; GAME OVER `#e57373` sobre pieza amarilla bajo el velo 3.59:1 y puntuación 4.26:1.
- Textos de overlay: mide siempre sobre la pieza más clara bajo el velo, no solo sobre el fondo; el magenta `#ff006e` necesita velo ≥ 0.93 sobre amarillo.
- NEÓN: cian vs magenta entre sí solo dan 2.83:1; se distinguen por tono, no por luminancia (aceptado).
- Trampa: el hook PostToolUse ejecuta `eslint --fix`, que convierte `let palette` en `const` si se edita antes de añadir la asignación de `setSkin`. Escribe `setSkin` en la misma edición (o con `Write` del archivo completo).

**Why:** evitar recalcular o repetir errores ya vistos.
**How to apply:** revisa esta lista antes de auditar un juego. Ver [[paletas-por-juego]].
