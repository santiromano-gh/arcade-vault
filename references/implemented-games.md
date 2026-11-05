# Juegos implementados

Catálogo de juegos jugables de Arcade Vault, obtenido de la tabla `games` de Supabase (ordenado por `sort_order`). Cada juego tiene su motor en canvas en `lib/engines/<id>/`.

> Datos consultados el 2026-11-05.

## Resumen

| #   | ID           | Título     | Categoría | Color | Motor                     | Spec                         |
| --- | ------------ | ---------- | --------- | ----- | ------------------------- | ---------------------------- |
| 1   | `asteroides` | ASTEROIDES | SHOOTER   | cyan  | `lib/engines/asteroides/` | SPEC 05 — Juego ASTEROIDES   |
| 2   | `tetris`     | TETRIS     | PUZZLE    | cyan  | `lib/engines/tetris/`     | SPEC 07 — Juego TETRIS       |

## 1. ASTEROIDES

- **ID:** `asteroides`
- **Categoría:** SHOOTER
- **Portada:** `cover-asteroides`
- **Color:** cyan
- **Alta en el catálogo:** 2026-10-30
- **Descripción corta:** Rota, propulsa y parte asteroides en el vacío.

Pilota una nave vectorial en un campo de asteroides donde cada borde conecta con el opuesto. Rota con las flechas, propulsa con inercia y dispara con Espacio: los asteroides grandes se parten en medianos y los medianos en pequeños. Atrapa el power-up 3x para disparar en abanico durante 5 segundos. Tienes 3 vidas; vacía el campo para pasar de nivel.

## 2. TETRIS

- **ID:** `tetris`
- **Categoría:** PUZZLE
- **Portada:** `cover-tetris`
- **Color:** cyan
- **Alta en el catálogo:** 2026-11-02
- **Descripción corta:** Encaja ocho piezas y limpia líneas sin parar.

Siete piezas clásicas y una tuerca hueca caen en un tablero de 10×20. Muévelas y rótalas con las flechas y suéltalas con Espacio: la sombra marca dónde aterrizan. Cada línea completa suma puntos multiplicados por el nivel, y cada 10 líneas la caída se acelera.
