-- ACM BuildHub · admin accounts, history, emails, event galleries
-- Run once in the Supabase SQL editor, after schema.sql, cms.sql and admin.sql.
--
-- Additive and safe to run again: it creates tables, adds optional columns
-- and deletes nothing. Every feature that needs it stays switched off until
-- it has been run.

create extension if not exists pgcrypto;

-- 1. Individual admin accounts. The shared ADMIN_PASSWORD keeps working as
--    the owner's sign-in, so nobody can be locked out by this table.
--    Passwords are stored only as scrypt hashes.
create table if not exists public.admin_users (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text not null unique,
  role             text not null check (role in ('owner','editor','events','reviewer')),
  password_hash    text not null,
  active           boolean not null default true,
  -- Bumped to sign this person out of every device at once.
  session_version  integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_login_at    timestamptz
);

-- 2. Version history: the previous state of an item every time it is edited
--    or deleted, so any change can be undone and deleted items restored.
create table if not exists public.content_versions (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      text not null,
  resource   text not null,
  entity_id  text not null,
  action     text not null check (action in ('update','delete')),
  label      text,
  data       jsonb not null
);
create index if not exists content_versions_entity_idx on public.content_versions (resource, entity_id, at desc);
create index if not exists content_versions_deleted_idx on public.content_versions (resource, action, at desc);

-- 3. Editable emails sent to applicants when their status changes.
create table if not exists public.email_templates (
  key         text primary key check (key in ('accepted','declined','reviewing')),
  subject     text not null,
  body        text not null,
  updated_at  timestamptz not null default now()
);

-- 4. Photo galleries on events, and 5. activity entries imported from GitHub
--    remember which commit they came from, so an import never adds the same
--    one twice. (Skipped quietly if cms.sql / admin.sql have not been run.)
do $$
begin
  if to_regclass('public.events') is not null then
    alter table public.events add column if not exists gallery text[] not null default '{}';
  end if;
  if to_regclass('public.activity_items') is not null then
    alter table public.activity_items add column if not exists source_ref text;
    create unique index if not exists activity_items_source_ref_idx on public.activity_items (source_ref) where source_ref is not null;
  end if;
end $$;

-- 6. Lock the new tables down like the others: server-side service key only.
do $$
declare t text;
begin
  foreach t in array array['admin_users','content_versions','email_templates']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 7. Check: every row below should say rls_enabled = true and
--    public_policies = 0.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as public_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;
