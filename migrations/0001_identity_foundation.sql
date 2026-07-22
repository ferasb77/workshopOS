-- 0001_identity_foundation.sql
--
-- Organizations, workspaces, and profiles: the multi-tenancy foundation
-- that the authenticated dashboard shell resolves on every request.
--
-- No Supabase CLI or service-role key is configured in this environment,
-- so this file has not been applied. Run it manually via the Supabase
-- SQL editor (or `supabase db push` once the CLI is linked) before using
-- the /dashboard route.

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, slug)
);

create index if not exists workspaces_organization_id_idx
  on workspaces (organization_id);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  workspace_id uuid not null references workspaces(id),
  full_name text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists profiles_organization_id_idx
  on profiles (organization_id);

create index if not exists profiles_workspace_id_idx
  on profiles (workspace_id);

-- Keep updated_at current on every row change.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on organizations;
create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

drop trigger if exists workspaces_set_updated_at on workspaces;
create trigger workspaces_set_updated_at
  before update on workspaces
  for each row execute function set_updated_at();

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Row Level Security: isolation is enforced at the DB layer, not only in
-- application code.
alter table organizations enable row level security;
alter table workspaces enable row level security;
alter table profiles enable row level security;

drop policy if exists "Members can view their own organization" on organizations;
create policy "Members can view their own organization"
  on organizations for select
  using (
    deleted_at is null
    and id in (
      select organization_id from profiles
      where profiles.id = auth.uid() and profiles.deleted_at is null
    )
  );

drop policy if exists "Members can view workspaces in their organization" on workspaces;
create policy "Members can view workspaces in their organization"
  on workspaces for select
  using (
    deleted_at is null
    and organization_id in (
      select organization_id from profiles
      where profiles.id = auth.uid() and profiles.deleted_at is null
    )
  );

drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select
  using (id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Example seed for your first organization/workspace/profile — adjust and
-- run manually once you have a user in auth.users. Not executed by this
-- migration.
--
-- with new_org as (
--   insert into organizations (name, slug) values ('Enable My Growth', 'enable-my-growth')
--   returning id
-- ), new_workspace as (
--   insert into workspaces (organization_id, name, slug)
--   select id, 'Default Workspace', 'default' from new_org
--   returning id, organization_id
-- )
-- insert into profiles (id, organization_id, workspace_id, full_name, role)
-- select '00000000-0000-0000-0000-000000000000', organization_id, id, 'Your Name', 'owner'
-- from new_workspace;
