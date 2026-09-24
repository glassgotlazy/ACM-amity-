-- ACM BuildHub · website content (CMS)
-- Run once in the Supabase SQL editor, after schema.sql.
--
-- Additive only: creates new tables and one storage bucket, and never touches
-- `submissions`. Safe to run again — every statement is "if not exists" or
-- "on conflict do nothing".
--
-- The tables start empty. Open /admin → Dashboard → "Load current website
-- content" once to copy what the site shows today into them. Until then the
-- public site keeps rendering its built-in defaults, so nothing changes for
-- visitors at any point.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Site settings: exactly one row (id = 1). Its presence is also the signal
-- that the CMS has been initialised.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                 smallint primary key default 1 check (id = 1),
  site_name          text not null,
  short_name         text not null,
  organization       text not null,
  tagline            text not null default '',
  description        text not null default '',
  logo_url           text,
  favicon_url        text,
  contact_email      text,
  contact_phone      text,
  location           text,
  registration_url   text,
  registration_qr_url text,
  footer_text        text not null default '',
  pillars            text[] not null default '{}',
  copyright_text     text not null default '',
  disclaimer_text    text not null default '',
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Navigation: one list feeds both the header and the footer columns, so a
-- link is never kept in two places.
-- ---------------------------------------------------------------------------
create table if not exists public.nav_items (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  href          text not null,
  in_header     boolean not null default false,
  footer_group  text check (footer_group in ('platform','community','take-part')),
  enabled       boolean not null default true,
  sort          integer not null default 0,
  updated_at    timestamptz not null default now()
);

create table if not exists public.social_links (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null check (platform in ('instagram','linkedin','github','x','youtube','discord','whatsapp','email','website')),
  url         text not null,
  enabled     boolean not null default true,
  sort        integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Homepage sections. The set of keys is fixed by the site's components; the
-- admin edits their text, order and visibility. `extra` holds only short,
-- per-section string lists (hero focus areas, for example) and is validated
-- by the server before it is written.
-- ---------------------------------------------------------------------------
create table if not exists public.page_sections (
  key              text primary key,
  enabled          boolean not null default true,
  sort             integer not null default 0,
  eyebrow          text not null default '',
  title            text not null default '',
  subtitle         text not null default '',
  body             text not null default '',
  note             text not null default '',
  primary_label    text not null default '',
  primary_href     text not null default '',
  secondary_label  text not null default '',
  secondary_href   text not null default '',
  image_url        text,
  extra            jsonb not null default '{}'::jsonb,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Team. Roles are rows, not strings, so they can be renamed in one place.
-- A role that members still hold cannot be deleted (RESTRICT); the admin API
-- asks for a replacement role first.
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort        integer not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role_id       uuid not null references public.roles(id) on delete restrict,
  bio           text not null default '',
  photo_url     text,
  linkedin_url  text,
  github_url    text,
  website_url   text,
  email         text,
  published     boolean not null default true,
  sort          integer not null default 0,
  updated_at    timestamptz not null default now()
);
create index if not exists team_members_role_idx on public.team_members (role_id);

-- ---------------------------------------------------------------------------
-- Events.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  description       text not null default '',
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  location          text not null default '',
  registration_url  text,
  image_url         text,
  status            text not null default 'upcoming' check (status in ('upcoming','ongoing','completed','cancelled')),
  published         boolean not null default false,
  sort              integer not null default 0,
  updated_at        timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- Published projects. Separate from `submissions`: proposals and applications
-- stay in the queue; this table is what the public project pages show.
-- Simple lists are Postgres text arrays. `timeline` and `open_roles` are
-- small ordered lists of fixed-shape objects, validated by the server.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  category      text not null default '',
  status        text not null check (status in ('current','development','ongoing','exploring','proposed','soon')),
  summary       text not null default '',
  problem       text not null default '',
  problem_slug  text,
  image_url     text,
  repo_url      text,
  live_url      text,
  progress      integer not null default 0 check (progress between 0 and 100),
  featured      boolean not null default false,
  published     boolean not null default false,
  sort          integer not null default 0,
  domains       text[] not null default '{}',
  technologies  text[] not null default '{}',
  building      text[] not null default '{}',
  exists_now    text[] not null default '{}',
  not_yet       text[] not null default '{}',
  contribute    text[] not null default '{}',
  timeline      jsonb not null default '[]'::jsonb,
  open_roles    jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- Who works on a project. `member_id` links a listed team member when there
-- is one; otherwise `name` stands alone (a contributor, or "Open").
create table if not exists public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  member_id   uuid references public.team_members(id) on delete set null,
  name        text not null,
  role        text not null default '',
  sort        integer not null default 0
);
create index if not exists project_members_project_idx on public.project_members (project_id, sort);

-- ---------------------------------------------------------------------------
-- Announcements: a slim strip on the homepage, hidden when none are live.
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  link_url    text,
  date        date not null default current_date,
  published   boolean not null default false,
  sort        integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lock everything down, same as submissions: the site talks to these tables
-- with the service-role key on the server; the public anon key gets nothing.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_settings','nav_items','social_links','page_sections','roles',
                           'team_members','events','projects','project_members','announcements']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Media bucket. Public read so images load straight from the CDN; uploads go
-- only through the site's admin API, which validates type, size and
-- dimensions and holds the service key.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', true, 2097152, array['image/png','image/jpeg','image/webp','image/x-icon','image/vnd.microsoft.icon'])
on conflict (id) do nothing;
