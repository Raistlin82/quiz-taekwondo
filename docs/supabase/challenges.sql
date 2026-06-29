-- ============================================================
-- Sfide (Ruzzle-style best-of-3 duels) — Supabase schema.
-- Run this once in the Supabase SQL editor of the project.
--
-- Model: a match is fully described by { seed, difficulty, rounds,
-- round_size }. Challenges are NOT tied to a belt — questions are drawn
-- from the WHOLE bank (round-robin by category) so it is a fair, equal
-- duel. Both players replay the SAME seed and so get identical
-- questions. The CREATOR always plays first and stores their
-- per-round points; the OPPONENT (a friend via link, or a random player)
-- plays the same seed and submits via submit_challenge_result(), which
-- decides the winner (most rounds won; ties broken by total score, then
-- by total seconds). Clients never UPDATE rows directly.
--
-- Mirrors the existing pattern: public SELECT + guarded INSERT, and a
-- SECURITY DEFINER RPC for the privileged write (like increment_profile_run).
-- The anon key stays public-safe — RLS + the RPC are the guard rails.
-- ============================================================

create table if not exists public.challenges (
  id                    text primary key,            -- short shareable code
  seed                  bigint   not null,           -- match seed (0..2^32-1)
  difficulty            text     not null,           -- 'Facile' | 'Medio' | 'Tosto'
  rounds                int      not null default 3,
  round_size            int      not null default 5, -- questions per round
  is_random             boolean  not null default false,
  status                text     not null default 'awaiting_opponent',
                                  -- 'awaiting_opponent' | 'claimed' | 'completed'
  creator_name          text     not null,
  creator_user_id       uuid,
  creator_round_points  int[]    not null,           -- points scored per round
  creator_secs          int      not null,           -- total seconds used
  creator_score         int      not null,           -- total points
  opponent_name         text,
  opponent_user_id      uuid,
  opponent_round_points int[],
  opponent_secs         int,
  opponent_score        int,
  claimed_by            uuid,                         -- random-match reservation
  claimed_at            timestamptz,
  winner                text,                         -- 'creator' | 'opponent' | 'draw'
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

-- Fast lookup of joinable random matches.
create index if not exists challenges_open_random_idx
  on public.challenges (created_at)
  where status = 'awaiting_opponent' and is_random = true;

-- ---- Row Level Security ----
alter table public.challenges enable row level security;

-- Anyone can READ a challenge (friend link + head-to-head result screen).
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select using (true);

-- Anyone can CREATE a challenge, but only in the initial, un-resolved shape.
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges
  for insert with check (
    status = 'awaiting_opponent'
    and opponent_user_id is null
    and opponent_score is null
    and winner is null
  );

-- No direct UPDATE/DELETE for clients: opponent writes go through the RPC.
grant select, insert on public.challenges to anon, authenticated;

-- ---- RPC: claim one open random challenge (same difficulty, not your own) ----
create or replace function public.claim_random_challenge(
  p_user_id    uuid,
  p_difficulty text
)
returns public.challenges
language plpgsql
security definer
set search_path = public
as $$
declare c public.challenges;
begin
  update public.challenges
     set status = 'claimed', claimed_by = p_user_id, claimed_at = now()
   where id = (
     select id from public.challenges
      where is_random = true
        and status = 'awaiting_opponent'
        and difficulty = p_difficulty
        and (p_user_id is null or creator_user_id is distinct from p_user_id)
      order by created_at asc
      limit 1
      for update skip locked
   )
  returning * into c;
  return c; -- NULL row when no match is available
end;
$$;

-- ---- RPC: submit the opponent's result and resolve the winner ----
create or replace function public.submit_challenge_result(
  p_code        text,
  p_name        text,
  p_user_id     uuid,
  p_round_points int[],
  p_secs        int,
  p_score       int
) returns public.challenges
language plpgsql
security definer
set search_path = public
as $$
declare
  c  public.challenges;
  w  text;
  cw int := 0;
  ow int := 0;
  i  int;
begin
  select * into c from public.challenges where id = p_code for update;
  if c.id is null then
    raise exception 'challenge % not found', p_code;
  end if;
  if c.opponent_user_id is not null or c.status = 'completed' then
    raise exception 'challenge % already played', p_code;
  end if;

  -- Round-by-round wins (Ruzzle best-of-3).
  for i in 1 .. coalesce(array_length(c.creator_round_points, 1), 0) loop
    if c.creator_round_points[i] > coalesce(p_round_points[i], 0) then
      cw := cw + 1;
    elsif c.creator_round_points[i] < coalesce(p_round_points[i], 0) then
      ow := ow + 1;
    end if;
  end loop;

  if cw > ow then
    w := 'creator';
  elsif ow > cw then
    w := 'opponent';
  elsif c.creator_score > p_score then
    w := 'creator';
  elsif c.creator_score < p_score then
    w := 'opponent';
  elsif c.creator_secs < p_secs then
    w := 'creator';
  elsif c.creator_secs > p_secs then
    w := 'opponent';
  else
    w := 'draw';
  end if;

  update public.challenges set
    opponent_name         = p_name,
    opponent_user_id      = p_user_id,
    opponent_round_points = p_round_points,
    opponent_secs         = p_secs,
    opponent_score        = p_score,
    winner                = w,
    status                = 'completed',
    completed_at          = now()
  where id = p_code
  returning * into c;

  return c;
end;
$$;

grant execute on function public.claim_random_challenge(uuid, text) to anon, authenticated;
grant execute on function public.submit_challenge_result(text, text, uuid, int[], int, int)
  to anon, authenticated;
