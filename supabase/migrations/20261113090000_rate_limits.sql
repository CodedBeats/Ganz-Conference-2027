-- Phase 2: a small fixed-window rate limiter for public form submissions (the /register form first).
--
-- Keys are pseudonymous (e.g. 'register:' + a sha256 of the client IP, built in
-- src/lib/registration/rateLimit.server.ts) and rows only live for two windows, so nothing here
-- identifies a person for long. Only server code with the secret key can use it.

create table public.rate_limits (
  key           text not null check (length(key) <= 200),
  window_start  timestamptz not null,
  hits          integer not null default 1 check (hits >= 1),
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Records one hit for `p_key` in the current window and says whether it is still within the limit.
-- Old windows are cleared as it goes, so the table stays tiny without a scheduled job.
create function public.hit_rate_limit(p_key text, p_max_hits integer, p_window_seconds integer)
returns boolean
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_window_start  timestamptz;
  v_hits          integer;
begin
  if p_key is null or p_max_hits is null or p_max_hits < 1 or p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit' using errcode = '22023';
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  delete from public.rate_limits as hit
  where hit.window_start < now() - make_interval(secs => p_window_seconds * 2);

  insert into public.rate_limits as hit (key, window_start)
  values (p_key, v_window_start)
  on conflict (key, window_start) do update set hits = hit.hits + 1
  returning hit.hits into v_hits;

  return v_hits <= p_max_hits;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;