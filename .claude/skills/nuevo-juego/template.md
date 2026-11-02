# SPEC <NN> — Juego <TÍTULO> en la plataforma

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06<, otras dependencias>
> **Fecha:** <AAAA-MM-DD>
> **Objetivo:** <Una frase: añadir el juego `<id>` al catálogo, jugable en `/juegos/<id>/jugar`, con su leaderboard en Supabase.>

## Por qué existe esta spec

<Qué juego es, de dónde viene (`references/<carpeta>` o creación propia) y qué aporta a la plataforma.>

## Alcance

**Entra:**

- Fila nueva en `games`, añadida por migración, sin puntuaciones iniciales:
  - `id: "<id>"`, `title: "<TÍTULO>"`, `cat: "<CATEGORÍA>"`, `color: "<color>"`, `cover: "cover-<id>"`, `sort_order: <N>`.
  - `short` y `long` que describen solo mecánicas reales.
- Portada `.cover-<id>` en `app/globals.css`, en CSS puro y sin imágenes.
- Motor en `lib/engines/<id>/`, registrado en `ENGINES`, que cumple `CreateEngine`:
  - Mecánicas: <reglas, constantes y puntuación>.
  - Controles: <teclas y otras entradas>.
  - Aspecto: <fiel al prototipo o cambios acordados>.
  - HUD y overlays: <qué se dibuja en el canvas y qué muestra React>.
- Notificaciones a React: `onStats` solo cuando cambian los valores y `onGameOver` al terminar la partida.
- Leaderboard real sin código propio: el guardado usa `submitScore`, y el detalle y el Salón leen la vista `leaderboard`.
- <Ampliación de la plataforma, si aplica: cambio mínimo y compatible con `asteroides`.>

**Fuera de alcance:**

- <Mecánicas, modos o funciones que quedan fuera.>
- Cambios en `asteroides` y en los juegos mock.
- Antitrampas, Realtime y Auth.
- Tests automatizados.

## Modelo de datos

Sin cambios de esquema<, salvo lo indicado abajo>. Fila nueva en `games`:

```sql
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values (
  '<id>',
  '<TÍTULO>',
  '<short>',
  '<long>',
  '<CATEGORÍA>', 'cover-<id>', '<color>', <N>
);
```

Puntuación: <fórmula>. Entero entre 0 y 10.000.000.

Valores de `GameStats`: `score` = <…>, `lives` = <…>, `level` = <…>.

Archivos nuevos:

```
supabase/migrations/<timestamp>_add_<id>.sql
lib/engines/<id>/game.ts      // create<Nombre>Game
lib/engines/<id>/<…>.ts       // entidades o lógica, si hacen falta
```

Archivos modificados:

```
lib/engines/index.ts   // registro del motor
app/globals.css        // .cover-<id>
<otros, si hay ampliación de la plataforma>
```

## Plan de implementación

1. Crear la migración con `npx supabase migration new add_<id>` y aplicarla con `npx supabase db push --linked`. Comprobar que `/juegos/<id>` carga; la fila puede requerir reconstruir o reiniciar porque el catálogo está cacheado con el tag `games`. Ejecutar `npm run db:types` solo si cambia el esquema.
2. Crear `.cover-<id>` en `app/globals.css` con `/frontend-design`, con valores en % y respetando el lenguaje visual CRT.
3. <Si aplica: ampliar la plataforma de forma compatible y comprobar que `asteroides` sigue igual.>
4. Portar o crear las entidades y la lógica en `lib/engines/<id>/`, con tipos estrictos y sin estado en variables de módulo.
5. Crear `create<Nombre>Game: CreateEngine` siguiendo `lib/engines/asteroides/game.ts`, y registrarlo en `lib/engines/index.ts`.
6. <Si aplica: ajustar textos o controles específicos en `components/game-player.tsx`.>
7. Ejecutar `npm run lint` y `npm run build`, y probar a mano el flujo completo en `/juegos/<id>/jugar`.

Antes de escribir código específico de Next o React, leer la guía correspondiente en `node_modules/next/dist/docs/`.

## Criterios de aceptación

Específicos del juego:

- [ ] <Una comprobación verificable por cada mecánica, control y regla de puntuación.>

Integración con la plataforma:

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `npx supabase db push --linked` no tiene cambios pendientes.
- [ ] `<TÍTULO>` aparece en `/biblioteca` con su portada, en su filtro de categoría y en las pestañas del Salón.
- [ ] `/juegos/<id>` muestra "Partidas" 0, "Mejor global" 0 y "SIN PUNTUACIONES TODAVÍA" antes de la primera partida guardada.
- [ ] `/juegos/<id>/jugar` muestra el canvas jugable dentro del CRT.
- [ ] El HUD de React muestra los mismos valores que el motor, y `onStats` no se llama en frames sin cambios.
- [ ] Al terminar la partida se abre "FIN DEL JUEGO" con la puntuación final.
- [ ] Guardar crea una fila en `scores` con `game_id = '<id>'`, y detalle y Salón la muestran sin reiniciar el servidor.
- [ ] PAUSA y tecla P congelan y reanudan el juego sin saltos, y cambiar de pestaña lo pausa.
- [ ] FIN abre el modal con la puntuación actual, y JUGAR DE NUEVO empieza una partida limpia.
- [ ] Con el modal abierto, las teclas no afectan al juego y se puede escribir en el input de iniciales.
- [ ] Las teclas del juego no hacen scroll mientras se juega; tras SALIR no queda ningún bucle ni listener.
- [ ] Dos montajes seguidos no comparten estado.
- [ ] El canvas mantiene la proporción y no se ve borroso con `devicePixelRatio` 2; a 375px no hay scroll horizontal.
- [ ] `asteroides` y los juegos mock siguen funcionando igual.
- [ ] No hay errores de hidratación ni de consola en `/juegos/<id>` ni en `/juegos/<id>/jugar`.

## Decisiones

- **Sí:** <decisión>. <Motivo; indicar si es decisión del usuario.>
- **No:** <alternativa descartada>. <Motivo.>

## Riesgos

| Riesgo   | Mitigación   |
| -------- | ------------ |
| <riesgo> | <mitigación> |

## Lo que **no** entra en esta spec

- <Elementos que quedan fuera.>

Cada uno, si llega, va en su propia spec.
