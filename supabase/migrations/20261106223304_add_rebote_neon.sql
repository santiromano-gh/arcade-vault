-- SPEC 08: juego REBOTE NEÓN, rompebloques portado desde references/04-arkanoid.
-- Entrada nueva del catálogo, sin puntuaciones iniciales. `sort_order` 3 sigue a tetris (2).

insert into public.games (id, title, short, long, cat, cover, color, sort_order) values (
  'rebote-neon',
  'REBOTE NEÓN',
  'Rompe muros de bloques y encadena voltaje.',
  'Mueve la paleta con el ratón o las flechas y lanza la pelota con Espacio o clic: el ángulo del rebote depende de dónde golpea en la paleta. Cada bloque que rompes sin volver a tocarla sube el voltaje hasta ×5 y multiplica sus puntos junto al nivel. Cinco muros se repiten cada vez más rápido y tienes 3 vidas.',
  'ARCADE', 'cover-rebote-neon', 'green', 3
);
