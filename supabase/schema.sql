-- ACM BuildHub · submissions queue
-- Run once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('join','project-application','problem-submission','project-proposal')),
  payload     jsonb not null,
  anonymous   boolean not null default false,
  state       text not null default 'new' check (state in ('new','reviewing','accepted','declined','published')),
  note        text
);

create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_kind_state_idx on public.submissions (kind, state);

-- Lock the table down. No policies are defined on purpose: the site talks to
-- it with the service-role key, which bypasses RLS, and the anon/public key
-- must not be able to read applicants' details.
alter table public.submissions enable row level security;
revoke all on public.submissions from anon, authenticated;
