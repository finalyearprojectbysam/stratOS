-- ============================================================================
-- STRATOS — Owner Google OAuth (Supabase) schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.
-- This backs the Owner identity for real Google OAuth login. Employees keep the
-- existing Agency Code + Employee ID + Password model (staff table).
-- ============================================================================

-- One agency per authenticated Google owner ---------------------------------
create table if not exists public.agencies (
  id                uuid primary key default gen_random_uuid(),
  owner_user_id     uuid not null references auth.users(id) on delete cascade,
  name              text not null default 'Your Agency',
  code              text not null unique,               -- 6-digit agency code
  owner_email       text,
  owner_name        text,
  owner_avatar_url  text,                                -- Google profile picture
  setup_completed   boolean not null default false,      -- gates the onboarding wizard

  -- Onboarding wizard fields (Step 1–3)
  website           text,
  agency_email      text,
  agency_phone      text,
  location          text,
  founded_year      text,
  description       text,
  services          text,
  owner_phone       text,
  owner_dob         date,
  owner_position    text,
  industry          text,
  employee_count    text,
  target_clients    text,
  service_areas     text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- One Google account → exactly one agency (prevents duplicate agencies)
create unique index if not exists agencies_owner_user_id_key on public.agencies(owner_user_id);

-- Row Level Security: an owner can only see/manage their OWN agency ----------
alter table public.agencies enable row level security;

drop policy if exists "owner_select_own_agency" on public.agencies;
create policy "owner_select_own_agency"
  on public.agencies for select
  using (auth.uid() = owner_user_id);

drop policy if exists "owner_insert_own_agency" on public.agencies;
create policy "owner_insert_own_agency"
  on public.agencies for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "owner_update_own_agency" on public.agencies;
create policy "owner_update_own_agency"
  on public.agencies for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists agencies_set_updated_at on public.agencies;
create trigger agencies_set_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();

-- NOTE: The agency-scoped tables (clients, projects, tasks, staff, analyses,
-- reports, knowledge_documents, activity_logs, meetings, notifications) use
-- agency_id for isolation. Add matching RLS keyed to
--   agency_id in (select id from public.agencies where owner_user_id = auth.uid())
-- when you move those off Demo Mode. Employees are authenticated at the app
-- layer (staff table), not via Supabase Auth.
