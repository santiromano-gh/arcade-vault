---
name: temas-usados
description: Temas de game jam ya diseñados y el id generado para cada uno, para no repetir temas, ids ni mecánicas
metadata:
  type: project
---

| Fecha | Tema / encargo | id | Categoría | Giro de diseño |
| --- | --- | --- | --- | --- |
| 2026-11-05 | Sugerencia `cortocircuito` de game-planner (plataformas, eléctrico) | `cortocircuito` | PLATAFORMAS (nueva) | Pulso que se propaga por la pista hasta el aislante; tensión de las chispas sube al recuperarse; en GJ-03 relés, ARCO/DÍNAMO y DESCARGA con X |

**Why:** el agente no debe repetir temas ni ids, y algunas jams llegan como "diseña la sugerencia X del To Do" en lugar de un tema libre.
**How to apply:** antes de elegir id o giro, revisar esta tabla y `specs/game-jam/`. `torre-pulso` y `zanja-digital` (también PLATAFORMAS en el To Do) no deben reutilizar el pulso por pista ni los aislantes de `cortocircuito`.
