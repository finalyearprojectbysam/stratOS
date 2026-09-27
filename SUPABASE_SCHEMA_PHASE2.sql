-- ============================================================================
-- STRATOS — Phase 2 schema addendum (agencies, roles, staff, tasks, activity)
-- Run AFTER the base SUPABASE_SCHEMA.sql. Safe to re-run.
-- Adds agency multi-tenancy + strict RLS. Owner ops that create employee auth
-- users must be done server-side with the service_role key (never in browser).
-- ============================================================================

create extension if not exists pgcrypto;

-- AGENCIES -----------------------------------------------------------------
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[0-9]{6}$'),  -- unique 6-digit code
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_agencies_code on public.agencies(code);

-- Add agency_id to every agency-owned table (idempotent)
do $$ declare t text; begin
  foreach t in array array['clients','projects','analyses','reports','knowledge_documents'] loop
    execute format('alter table public.%I add column if not exists agency_id uuid references public.agencies(id) on delete cascade', t);
  end loop;
end $$;

-- profiles: mark role + agency
alter table public.profiles add column if not exists role text default 'owner';
alter table public.profiles add column if not exists agency_id uuid references public.agencies(id) on delete set null;

-- STAFF (employees; identity owner-controlled) -----------------------------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null, -- created server-side
  full_name text not null,
  gender text, dob date, email text, phone text, avatar_url text,
  employee_id text not null,
  role text not null default 'Analyst',
  status text not null default 'active',
  online boolean not null default false,
  login_time timestamptz, logout_time timestamptz, last_active timestamptz,
  total_online_seconds int not null default 0,
  created_at timestamptz not null default now(),
  unique(agency_id, employee_id)
);

-- TASKS --------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  project_name text,
  title text not null, description text,
  assigned_to uuid references public.staff(id) on delete set null,
  assigned_to_name text,
  priority text default 'Medium',
  status text not null default 'pending',
  progress int not null default 0,
  deadline timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_tasks_assignee on public.tasks(assigned_to);

-- ACTIVITY LOGS (OWNER ONLY) ----------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_name text, role text, action text not null, resource text, detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_agency on public.activity_logs(agency_id, created_at desc);

-- Helper: current user's agency id ----------------------------------------
create or replace function public.current_agency_id() returns uuid language sql stable as $$
  select id from public.agencies where owner_id = auth.uid()
  union
  select agency_id from public.staff where auth_user_id = auth.uid()
  limit 1
$$;
create or replace function public.is_owner() returns boolean language sql stable as $$
  select exists(select 1 from public.agencies where owner_id = auth.uid())
$$;

-- RLS ----------------------------------------------------------------------
alter table public.agencies enable row level security;
drop policy if exists agencies_access on public.agencies;
create policy agencies_access on public.agencies for all to authenticated
  using (owner_id = auth.uid() or id = public.current_agency_id())
  with check (owner_id = auth.uid());

-- Agency-scoped tables: any member of the agency can read; writes below.
do $$ declare t text; begin
  foreach t in array array['clients','projects','analyses','reports','knowledge_documents','staff','tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_agency_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (agency_id = public.current_agency_id())', t||'_agency_read', t);
    -- Owner has full write; employees restricted per-table below.
    execute format('drop policy if exists %I on public.%I', t||'_owner_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (agency_id = public.current_agency_id() and public.is_owner()) with check (agency_id = public.current_agency_id() and public.is_owner())', t||'_owner_write', t);
  end loop;
end $$;

-- Employees may UPDATE only their own assigned tasks (progress/status).
drop policy if exists tasks_employee_update on public.tasks;
create policy tasks_employee_update on public.tasks for update to authenticated
  using (agency_id = public.current_agency_id() and assigned_to in (select id from public.staff where auth_user_id = auth.uid()))
  with check (agency_id = public.current_agency_id());

-- ACTIVITY LOGS: owner-only read; anyone in agency may insert their own action.
alter table public.activity_logs enable row level security;
drop policy if exists activity_owner_read on public.activity_logs;
create policy activity_owner_read on public.activity_logs for select to authenticated
  using (agency_id = public.current_agency_id() and public.is_owner());
drop policy if exists activity_insert on public.activity_logs;
create policy activity_insert on public.activity_logs for insert to authenticated
  with check (agency_id = public.current_agency_id());

-- Realtime for live task/activity updates
do $$ begin
  begin alter publication supabase_realtime add table public.tasks; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.activity_logs; exception when duplicate_object then null; end;
end $$;
