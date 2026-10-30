-- SPEC 06: catálogo de juegos y puntuaciones.
-- `games` es la única fuente de verdad del catálogo; `scores` guarda cada partida.
-- Las vistas `game_stats` y `leaderboard` calculan estadísticas y rankings sin columnas fijas.

create type public.game_category as enum ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS');
create type public.game_color as enum ('cyan', 'magenta', 'yellow', 'green');

create table public.games (
  id          text primary key,              -- slug usado en la URL: 'bloque-buster', 'asteroides', …
  title       text not null,
  short       text not null,
  long        text not null,
  cat         public.game_category not null,
  cover       text not null,                 -- clase CSS de portada: 'cover-bricks', …
  color       public.game_color not null,
  sort_order  integer not null unique,
  created_at  timestamptz not null default now()
);

create table public.scores (
  id           bigint generated always as identity primary key,
  game_id      text not null references public.games (id),
  player_name  text not null
               check (char_length(player_name) between 1 and 10 and player_name = upper(player_name)),
  score        integer not null check (score between 0 and 10000000),
  created_at   timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);

-- Estadísticas por juego: mejor puntuación (0 sin partidas) y número de partidas.
create view public.game_stats
with (security_invoker = true) as
select
  g.id                            as game_id,
  coalesce(max(s.score), 0)::int  as best,
  count(s.id)::int                as plays
from public.games g
left join public.scores s on s.game_id = g.id
group by g.id;

-- Ranking por mejor marca de cada jugador. Ante empate de puntuación,
-- tanto al elegir la marca de un jugador como al ordenar, gana la fecha más antigua.
create view public.leaderboard
with (security_invoker = true) as
select
  best.game_id,
  best.player_name,
  best.score,
  best.created_at,
  row_number() over (
    partition by best.game_id
    order by best.score desc, best.created_at asc
  )::int as rank
from (
  select distinct on (s.game_id, s.player_name)
    s.game_id,
    s.player_name,
    s.score,
    s.created_at
  from public.scores s
  order by s.game_id, s.player_name, s.score desc, s.created_at asc
) best;

-- Permisos de la Data API: solo lectura del catálogo, lectura e inserción de puntuaciones.
-- Se revocan los privilegios por defecto para que nadie pueda hacer update ni delete.
revoke all on public.games, public.scores, public.game_stats, public.leaderboard
  from anon, authenticated;
grant select on public.games, public.game_stats, public.leaderboard to anon;
grant select, insert on public.scores to anon;

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "Catálogo visible para todos"
  on public.games for select
  to anon
  using (true);

create policy "Puntuaciones visibles para todos"
  on public.scores for select
  to anon
  using (true);

-- Repite las reglas de los CHECKs para que la política no sea incondicional.
create policy "Cualquiera puede registrar una puntuación válida"
  on public.scores for insert
  to anon
  with check (
    char_length(player_name) between 1 and 10
    and player_name = upper(player_name)
    and score between 0 and 10000000
  );
