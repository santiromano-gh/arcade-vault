---
name: project-catalogo-y-mocks
description: Los ids mock del seed eliminados el 2026-11-05 no son descartes; ARCADE quedó sin cubrir aunque el prompt la dé por cubierta
metadata:
  type: project
---

La migración `remove_mock_games` (2026-11-05) borró los 8 juegos mock del seed (bloque-buster, caida, serpentina, gloton, invasores, rocas, ranaria, duelo-pixel). Desde entonces el catálogo real solo cubre SHOOTER (asteroides) y PUZZLE (tetris); ARCADE y VERSUS existen en el enum pero sin juegos.

**Why:** el prompt del agente dice "hoy ARCADE, PUZZLE y SHOOTER", pero eso describe el seed antiguo. Los mocks se quitaron por no tener motor, no por rechazo del usuario.

**How to apply:** recalcula siempre las categorías desde las migraciones. Un candidato parecido a un mock (p. ej. rompebloques vs bloque-buster) no cuenta como "ya descartado"; basta con mencionarlo.
