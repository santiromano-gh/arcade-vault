-- Limpieza del catálogo: solo quedan los juegos con motor jugable (asteroides y tetris).
-- Se eliminan los 8 juegos mock heredados del seed de SPEC 06 junto con sus puntuaciones mock.
-- `scores.game_id` referencia a `games.id` sin cascada, por eso las puntuaciones se borran primero.

delete from public.scores
where game_id in (
  'bloque-buster', 'caida', 'serpentina', 'gloton',
  'invasores', 'rocas', 'ranaria', 'duelo-pixel'
);

delete from public.games
where id in (
  'bloque-buster', 'caida', 'serpentina', 'gloton',
  'invasores', 'rocas', 'ranaria', 'duelo-pixel'
);

-- El catálogo vuelve a numerarse desde 1 respetando el orden previo.
update public.games set sort_order = 1 where id = 'asteroides';
update public.games set sort_order = 2 where id = 'tetris';
