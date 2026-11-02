-- SPEC 07: juego TETRIS, portado desde references/03-tetris.
-- Entrada nueva del catálogo, distinta del mock `caida`, y sin puntuaciones iniciales.

insert into public.games (id, title, short, long, cat, cover, color, sort_order) values (
  'tetris',
  'TETRIS',
  'Encaja ocho piezas y limpia líneas sin parar.',
  'Siete piezas clásicas y una tuerca hueca caen en un tablero de 10×20. Muévelas y rótalas con las flechas y suéltalas con Espacio: la sombra marca dónde aterrizan. Cada línea completa suma puntos multiplicados por el nivel, y cada 10 líneas la caída se acelera.',
  'PUZZLE', 'cover-tetris', 'cyan', 10
);
