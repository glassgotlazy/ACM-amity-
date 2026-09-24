-- ACM BuildHub · admin portal additions
-- Run once in the Supabase SQL editor, after schema.sql and cms.sql.
--
-- Additive and safe to run again. It deletes nothing and keeps every
-- existing submission exactly as it is.

-- 1. Edit tracking on submissions, so two admins cannot silently overwrite
--    each other's status changes. Existing rows start with NULL, meaning
--    "never edited".
alter table public.submissions add column if not exists updated_at timestamptz;

-- 2. Audit log of admin actions. Holds who, what, which record and when —
--    never passwords, tokens or form contents. IPs are stored only as a
--    salted hash, used to rate-limit sign-in attempts.
create table if not exists public.admin_audit (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      text not null,
  action     text not null,
  entity     text,
  entity_id  text,
  summary    text,
  ip_hash    text
);
create index if not exists admin_audit_at_idx on public.admin_audit (at desc);
create index if not exists admin_audit_login_idx on public.admin_audit (action, ip_hash, at desc);

-- 3. The rest of the site's content, so everything is editable in the admin:
--    problem statements, project ideas, research, working teams and the
--    activity log. The tables start empty; the admin's Dashboard has a
--    "Load remaining content" button that copies what the site shows today
--    into them. Until then the site keeps showing its built-in content.
create table if not exists public.content_seeds (
  entity     text primary key,
  seeded_at  timestamptz not null default now()
);

create table if not exists public.problems (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  sort                integer not null default 0,
  published           boolean not null default true,
  featured            boolean not null default false,
  title               text not null,
  hook                text not null default '',
  question            text not null default '',
  origin              text not null check (origin in ('potential','example','exploration','challenge')),
  category            text not null default '',
  domains             text[] not null default '{}',
  level               text not null check (level in ('build','integrate','research','deploy')),
  context             text[] not null default '{}',
  why_it_matters      text[] not null default '{}',
  directions          jsonb not null default '[]'::jsonb,
  technologies        text[] not null default '{}',
  potential_project   jsonb not null default '{}'::jsonb,
  skills              text[] not null default '{}',
  open_roles          text[] not null default '{}',
  team                jsonb not null default '[]'::jsonb,
  research_questions  text[] not null default '{}',
  next_steps          text[] not null default '{}',
  updated_at          timestamptz not null default now()
);

create table if not exists public.ideas (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  sort          integer not null default 0,
  published     boolean not null default true,
  name          text not null,
  tagline       text not null default '',
  level         text not null check (level in ('build','integrate','research','deploy')),
  band          text not null check (band in ('Beginner','Intermediate','Advanced','Research')),
  domains       text[] not null default '{}',
  team_size     text not null default '',
  technologies  text[] not null default '{}',
  skills        text[] not null default '{}',
  learn         text[] not null default '{}',
  problem_slug  text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.research_projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  sort         integer not null default 0,
  published    boolean not null default true,
  title        text not null,
  status       text not null,
  field        text not null default '',
  question     text not null default '',
  background   text[] not null default '{}',
  literature   jsonb not null default '[]'::jsonb,
  exploration  text[] not null default '{}',
  experiments  jsonb not null default '[]'::jsonb,
  analysis     text,
  paper        text,
  stages       jsonb not null default '[]'::jsonb,
  open_to      text[] not null default '{}',
  updated_at   timestamptz not null default now()
);

create table if not exists public.working_teams (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  sort            integer not null default 0,
  published       boolean not null default true,
  name            text not null,
  focus           text not null default '',
  charter         text not null default '',
  domains         text[] not null default '{}',
  works           text[] not null default '{}',
  projects        jsonb not null default '[]'::jsonb,
  open_positions  jsonb not null default '[]'::jsonb,
  meets           text not null default '',
  size            integer not null default 0,
  updated_at      timestamptz not null default now()
);

create table if not exists public.activity_items (
  id            uuid primary key default gen_random_uuid(),
  sort          integer not null default 0,
  published     boolean not null default true,
  kind          text not null check (kind in ('build','research','team','problem','role','review')),
  text          text not null,
  actor         text not null default '',
  target_label  text,
  target_href   text,
  when_label    text not null default '',
  day_label     text not null default '',
  updated_at    timestamptz not null default now()
);

-- 4. Lock every table down (again — idempotent). The site uses the
--    service-role key on the server only; the public anon key must not be
--    able to read or write anything here.
do $$
declare t text;
begin
  foreach t in array array['submissions','admin_audit','site_settings','nav_items','social_links','page_sections',
                           'roles','team_members','events','projects','project_members','announcements',
                           'content_seeds','problems','ideas','research_projects','working_teams','activity_items']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- 5. Check: every row below should say rls_enabled = true and
--    public_policies = 0.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as public_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;
