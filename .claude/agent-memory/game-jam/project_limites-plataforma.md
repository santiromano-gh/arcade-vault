---
name: limites-plataforma
description: Límites y discrepancias de la plataforma descubiertos al escribir specs que no están en integracion.md (enum, sort_order, mocks, CRT)
metadata:
  type: project
---

- **Categoría nueva = dos migraciones.** `alter type public.game_category add value` no se puede usar en la misma transacción que el `insert` que lo usa; la categoría va en una migración propia con timestamp anterior. `CATS` usa `satisfies` contra los tipos generados: sin `npm run db:types` no compila.
- **sort_order real.** `20261105203829_remove_mock_games.sql` borró los 8 mocks y renumeró: `asteroides` 1, `tetris` 2. El siguiente es el máximo vigente + 1 (3 en 2026-11-05), no el máximo del seed (10). Verificar siempre aplicando las migraciones en orden.
- **Ya no hay juegos mock en el catálogo**, aunque `template.md` y `integracion.md` siguen citándolos en criterios ("los juegos mock siguen funcionando"). En las specs, sustituir por "`asteroides` y `tetris` siguen igual".
- **`integracion.md` no define** los criterios Encaja / Requiere ampliación / Ampliación grande que pide el agente: clasificar razonándolo con su tabla de límites.
- **`.crt-screen` ya aplica scanlines y viñeta en CSS**: los efectos CRT del canvas no deben duplicarlas.
- `GamePlayer` pinta tantos corazones como `lives` (sin máximo), así que vidas extra no exigen ampliar la plataforma.

**Why:** son trampas que harían fallar un `db push` o producirían criterios no verificables.
**How to apply:** revisar esta lista en el paso de modelo de datos y criterios de cada spec 01. Confirmar contra el código antes de darlo por vigente.
