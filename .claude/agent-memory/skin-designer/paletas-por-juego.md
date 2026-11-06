---
name: paletas-por-juego
description: Tonos base de NEÓN y RETRO elegidos por juego, para mantener coherencia entre juegos (asteroides y tetris hechos)
metadata:
  type: project
---

Paletas decididas (fecha de implementación 2026-11-06):

- **asteroides**
  - NEÓN: fondo `#0a0a0f`, nave/HUD cian `#00f5ff`, asteroides y partículas magenta `#ff006e`, balas amarillo `#f5ff00`, power-up y contador 3x verde `#00ff88`, GAME OVER magenta, subtítulo `#8a8fb5` (`--ink-dim`). `glow: 10`.
  - RETRO: ámbar de 4 tonos sobre `#120c02`: `#3a2806` (relleno asteroides), `#c98a00` (asteroides, propulsor, subtítulo), `#ffb000` (nave rellena, HUD, partículas), `#ffe4a8` (balas, power-up, título). Sin glow, `lineScale: 2`.
- **tetris**
  - NEÓN: fondo `#0a0a0f`, tablero `#10101a`, borde magenta con glow 10, título/valores cian, etiquetas `--ink-dim`. 8 piezas: los 4 tokens + violeta `#b14dff`, azul `#3d8bff`, naranja `#ff8c1a`, plata `#c8cce8`. Bloques "tubo": relleno al 22 % + trazo 2 px con glow 8. GAME OVER amarillo (el magenta no llega a 4.5:1 sobre piezas claras bajo el velo 0.85).
  - RETRO: verde fósforo 4 tonos sobre `#050d04` / tablero `#0a1609`: `#2e8b3a`, `#3fa34d` (etiquetas, borde), `#6fdc5a`, `#e0ffd0`. Piezas = 3 tonos × patrones (macizo, punto, marco, franjas, hueco para la tuerca).

**Why:** coherencia visual entre juegos de la plataforma.
**How to apply:** NEÓN con los 4 tokens y glow ~8–12; RETRO alterna familias de fósforo (ámbar en asteroides, verde en tetris; para el siguiente, ámbar o un 4 colores distinto) y distingue por luminosidad/patrón. Si hay más tipos que tokens, añade tonos neón derivados (violeta, azul, naranja, plata). El LED del selector RETRO en `app/globals.css` es `#ffb000` y es genérico. Ver [[contraste-conocido]].
