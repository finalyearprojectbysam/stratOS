-- ============================================================================
-- MARCA STRATOS — Supabase schema, RLS, storage & realtime
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run (drops policies first).
-- ============================================================================

create extension if not exists pgcrypto;

-- updated_at helper --------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- PROFILES -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  agency_name text,
  role text default 'Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CLIENTS ------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  business_name text not null,
  industry text,
  website_url text,
  instagram_url text,
  facebook_url text,
  google_business_url text,
  target_location text,
  target_audience text,
  business_description text,
  business_goals jsonb not null default '[]',
  current_channels jsonb not null default '[]',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PROJECTS -----------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planning',
  progress int not null default 0,
  team jsonb not null default '[]',
  start_date timestamptz,
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ANALYSES -----------------------------------------------------------------
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  client_name text,
  status text not null default 'pending',
  agents_used int default 0,
  duration_seconds int,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- AGENT RUNS ---------------------------------------------------------------
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete cascade,
  agent_name text not null,
  status text not null default 'waiting',
  message text,
  progress int not null default 0,
  metadata jsonb not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- AGENT MESSAGES -----------------------------------------------------------
create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete cascade,
  agent_name text not null,
  message_type text not null default 'status',
  content text,
  status text not null default 'working',
  created_at timestamptz not null default now()
);

-- REPORTS ------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  client_name text,
  title text not null,
  report_type text not null default 'final',
  content jsonb not null default '{}',
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- KNOWLEDGE DOCUMENTS ------------------------------------------------------
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  storage_path text,
  mime_type text,
  category text default 'Templates',
  created_at timestamptz not null default now()
);

-- TEAM MEMBERS -------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'Analyst',
  status text not null default 'invited',
  assigned_projects int default 0,
  created_at timestamptz not null default now()
);

-- updated_at triggers ------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['profiles','clients','projects','reports'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Auto-create a profile row on signup --------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, agency_name)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'agency_name')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY -------------------------------------------------------
alter table public.profiles enable row level security;
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$ declare t text; begin
  foreach t in array array['clients','projects','analyses','agent_runs','agent_messages','reports','knowledge_documents','team_members'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_owner', t);
    execute format('create policy %I on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t||'_owner', t);
  end loop;
end $$;

-- STORAGE (knowledge base uploads) -----------------------------------------
insert into storage.buckets (id, name, public) values ('knowledge-documents','knowledge-documents', true)
  on conflict (id) do nothing;
alter table storage.objects enable row level security;
drop policy if exists knowledge_rw on storage.objects;
create policy knowledge_rw on storage.objects for all to authenticated
  using (bucket_id = 'knowledge-documents' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'knowledge-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- REALTIME (agent workflow events) -----------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.agent_runs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.agent_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.analyses; exception when duplicate_object then null; end;
end $$;
