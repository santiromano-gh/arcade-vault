---
name: nuevo-juego
description: Especifica un juego nuevo para Arcade Vault, con motor en canvas, catálogo y leaderboard en Supabase, partiendo de un prototipo de references/ o desde cero. Entrevista al usuario y escribe la spec en estado Borrador para implementarla con /spec-impl. Úsalo cuando se quiera añadir un juego real a la plataforma.
disable-model-invocation: true
argument-hint: 'nombre del juego o carpeta de references'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(date:*)
---

# /nuevo-juego — Spec de un juego para Arcade Vault

## Contexto de la sesión

Fecha de hoy (úsala en la cabecera de la spec, nunca la deduzcas):
!`date +%F`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

Prototipos disponibles:
!`ls references/ 2>/dev/null || echo "La carpeta references/ no existe"`

---

Este skill convierte un juego en una spec lista para `/spec-impl`. **Aquí no se escribe código ni se toca Supabase.** El único archivo que se crea es `specs/NN-<slug>.md`.

El argumento recibido es: `$ARGUMENTS`

Sigue las fases en orden. Trabaja siempre en español.

## Fase 1 — Contexto

1. Lee `CLAUDE.md` y las dos specs más recientes de `specs/` para seguir sus convenciones.
2. Lee [integracion.md](integracion.md) y [template.md](template.md), junto a este archivo.
3. Lee el skill `/spec` como referencia del método de especificación: `~/.claude/skills/spec/SKILL.md` y su `template.md`, en la misma carpeta. Solo se leen; no lo ejecutes. Si no puedes leerlos, detente y avisa al usuario de que `/spec` no está disponible.
4. Lee el código vigente: `lib/engines/types.ts`, `lib/engines/index.ts` y `components/game-player.tsx`.

Si el código difiere de `integracion.md`, manda el código. Señala la diferencia al usuario al cerrar.

Aplica el método de `/spec` en todas las fases: cómo preguntar, cuándo dejar de hacerlo, cómo redactar y qué errores evitar. Si algo choca con este skill, manda este skill. En concreto, la estructura sale de [template.md](template.md), el nombre de archivo es `NN-juego-<id>.md`, y el flujo es el de estas fases.

No uses la SPEC 05 como receta: añade el juego a la constante `GAMES` y guarda con `saveScore`, y la SPEC 06 eliminó ambas cosas.

Si `$ARGUMENTS` llega vacío, pide en una frase qué juego se quiere añadir.

## Fase 2 — Origen del juego

Comprueba si el argumento coincide con una carpeta de `references/`, por nombre completo o aproximado (`tetris` → `03-tetris`).

**Con referencia.** Lee su README y todo el código del juego, e inventaría:

- Mecánicas, reglas y constantes.
- Controles, incluidos ratón y táctil.
- Resolución y número de canvas.
- Lo que vive en el DOM: HUD, overlays, menús.
- Assets, audio y dependencias.
- Estados: partida, pausa, fin, victoria.
- Cálculo de la puntuación.

Ignora `references/templates/` (mock de diseño, sin motores), cualquier `__MACOSX/` y lo ajeno al juego: workflows, comandos y specs propias del prototipo.

**Desde cero.** Define con el usuario las reglas, los controles, la puntuación, la condición de fin y la progresión. El juego debe poder describirse en una frase; si no, propón reducirlo o dividirlo.

## Fase 3 — Preguntas

Pregunta en bloques de 3 a 5 con `AskUserQuestion`, con la opción recomendada primero. No preguntes lo que ya se deduce del prototipo o del código.

1. **Catálogo.** ¿Entrada nueva en `games` o reemplazo de un juego mock? Lee las filas de la migración de seed y avisa si hay un mock parecido: reutilizarlo hereda sus 12 puntuaciones falsas. Por defecto, entrada nueva, como se hizo con `asteroides`.
2. **Ficha.** `id`, `title`, `short`, `long`, `cat`, `color` y portada. Propón los textos a partir de las mecánicas reales, sin mencionar lo que no existe. Usa una categoría nueva solo si es imprescindible.
3. **Fidelidad.** ¿Se conserva el juego tal cual o cambian su aspecto o sus mecánicas?
4. **Encaje.** Resolución y proporción, uso de `lives`, datos extra del HUD, entrada que no sea teclado, assets y audio.
5. **Puntuación.** Cómo se calcula, que sea entera y que quepa en el rango permitido. Si el juego se puede ganar, qué ocurre al ganar.

Deja de preguntar cuando puedas responder sin suponer nada: qué archivos cambian, cuáles son el primer y el último paso, y cómo se verifica que está terminado.

## Fase 4 — Encaje con la plataforma

Clasifica el juego usando los límites de `integracion.md`:

- **Encaja:** cabe en 800×600 con `score`, `lives` y `level`. La spec no toca la plataforma.
- **Requiere ampliación:** propón el cambio mínimo y compatible con `asteroides` y confírmalo con el usuario. Va como pasos de la propia spec, antes del motor. Por ejemplo, vidas ocultables en el HUD o una entrada del registro con tamaño propio.
- **Ampliación grande:** si afecta a varias áreas o a más de un juego, propón una spec previa separada y marca la dependencia.

Generaliza solo lo que este juego necesita.

## Fase 5 — Escribir la spec

1. Calcula el número: el mayor de `specs/` más uno, con dos dígitos.
2. Genera el slug: `juego-<id>`, en kebab-case.
3. Rellena `template.md`, usando la fecha del contexto de la sesión. Conserva los criterios fijos, elimina los pasos que no apliquen y sustituye todos los marcadores `<…>`.
4. Calcula `sort_order` como el mayor existente más uno, revisando todas las migraciones de `supabase/migrations/`.
5. Comprueba que cada dependencia del encabezado existe en `specs/`.
6. Antes de escribir, revisa la spec contra las fases "Write the spec" y "Save the spec" de `/spec` leídas en la Fase 1: criterios verificables, plan sin nada fuera del alcance y decisiones registradas.
7. Escribe `specs/NN-juego-<id>.md` con estado `Borrador`. Si el archivo ya existe, pregunta antes de sobrescribirlo.

La spec debe ser autosuficiente: `/spec-impl` no lee este skill, así que incluye las trampas de `integracion.md` que apliquen a este juego en sus pasos o en sus riesgos.

## Fase 6 — Cierre

Indica la ruta de la spec, recuerda cambiar el estado a `Aprobado` tras revisarla y que el siguiente paso es `/spec-impl NN-juego-<id>`. Detente aquí.

## Reglas

- No escribas código, no apliques migraciones y no modifiques ningún archivo salvo la spec.
- No marques la spec como `Aprobado`.
- No asumas decisiones que el usuario no haya confirmado. Registra las suyas en la sección Decisiones.
- No propongas implementar la spec al terminar.
