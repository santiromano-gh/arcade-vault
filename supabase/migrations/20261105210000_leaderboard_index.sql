-- Rendimiento de la vista `leaderboard`.
-- Su subconsulta hace `distinct on (game_id, player_name)` ordenando por
-- `game_id, player_name, score desc, created_at asc`. Con solo `scores_game_score_idx`
-- (game_id, score desc), Postgres tiene que ordenar en memoria todas las partidas del juego
-- en cada consulta del ranking. Este índice ya entrega las filas en ese orden: el
-- `distinct on` se resuelve con un recorrido del índice, sin Sort, a medida que crece `scores`.
create index if not exists scores_game_player_best_idx
  on public.scores (game_id, player_name, score desc, created_at asc);
