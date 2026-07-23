-- 0011_client_engagement_hierarchy.sql
--
-- Sprint 11: the domain hierarchy changes from Organization -> Workshop to
-- Organization -> Client -> Engagement -> Experience. This is the single
-- largest migration in the project — it renames the live `workshops` table
-- (19 experiences, 266 participants worth of dependent rows) to
-- `experiences` and introduces `clients` and `engagements` above it.
--
-- Written to be safe to re-run: every step is idempotent (if not exists /
-- or not, drop-then-create for policies/triggers/functions).
--
-- Run manually via the Supabase SQL editor, in order, top to bottom.
--
-- IMPORTANT: read this before running —
--   `ALTER TABLE workshops RENAME TO experiences` is only valid if a table
--   named `workshops` still exists. This migration is NOT safe to re-run
--   in full past that line (the second run would fail at
--   "relation workshops does not exist" and stop there, which is fine —
--   everything after it (clients/engagements/columns/policies/functions)
--   already uses "if not exists" / "or replace" and re-runs cleanly on its
--   own if you skip straight to it).

-- ---------------------------------------------------------------------------
-- 1. Clients
-- ---------------------------------------------------------------------------

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id),
  name text not null,
  type text not null default 'corporate'
    check (type in ('corporate', 'government', 'ngo', 'other')),
  industry text,
  country text,
  city text,
  website text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists clients_workspace_id_idx on clients(workspace_id);
create index if not exists clients_type_idx on clients(type);
create index if not exists clients_is_active_idx on clients(is_active);
create index if not exists clients_deleted_at_idx on clients(deleted_at);

alter table clients enable row level security;

drop policy if exists "Authenticated users can manage clients" on clients;
create policy "Authenticated users can manage clients"
  on clients for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 2. Engagements
-- ---------------------------------------------------------------------------

create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id),
  client_id uuid not null references clients(id),
  title text not null,
  description text,
  type text not null default 'training_contract'
    check (type in ('training_contract', 'assessment_project',
                    'coaching_program', 'consulting_engagement',
                    'blended_program', 'other')),
  status text not null default 'active'
    check (status in ('draft', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  contract_value numeric(12,2),
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists engagements_workspace_id_idx on engagements(workspace_id);
create index if not exists engagements_client_id_idx on engagements(client_id);
create index if not exists engagements_status_idx on engagements(status);
create index if not exists engagements_deleted_at_idx on engagements(deleted_at);

alter table engagements enable row level security;

drop policy if exists "Authenticated users can manage engagements" on engagements;
create policy "Authenticated users can manage engagements"
  on engagements for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 3. Rename workshops -> experiences, add new columns
-- ---------------------------------------------------------------------------
-- A plain RENAME preserves the table's OID, so all existing data, indexes,
-- RLS policies, and triggers stay attached automatically — nothing here
-- deletes or copies a single row. Only object *names* (below) and two
-- function bodies (section 8) that reference "workshops" as literal SQL
-- text need updating so they don't break after the rename.

alter table workshops rename to experiences;

alter table experiences
  add column if not exists engagement_id uuid references engagements(id),
  add column if not exists client_id uuid references clients(id),
  add column if not exists experience_type text not null default 'workshop'
    check (experience_type in ('workshop', 'assessment', 'coaching',
                               'community_of_practice', 'consulting',
                               'conference', 'other'));

create index if not exists experiences_engagement_id_idx on experiences(engagement_id);
create index if not exists experiences_client_id_idx on experiences(client_id);
create index if not exists experiences_experience_type_idx on experiences(experience_type);

-- Rename indexes inherited from `workshops` for readability. Renaming an
-- index does not rebuild it — this is a metadata-only, instant operation.
alter index if exists workshops_slug_idx rename to experiences_slug_idx;
alter index if exists workshops_status_idx rename to experiences_status_idx;
alter index if exists workshops_start_date_idx rename to experiences_start_date_idx;
alter index if exists workshops_deleted_at_idx rename to experiences_deleted_at_idx;

-- Rename the enum type backing `status` to match.
alter type workshop_status rename to experience_status;

-- ---------------------------------------------------------------------------
-- 4. Recreate RLS policies on `experiences` with new names
-- ---------------------------------------------------------------------------
-- Renaming the table does NOT rename the policies attached to it — they
-- keep functioning under their old ("...on workshops") names. Recreated
-- here per the sprint brief so the policy names match the new vocabulary.

drop policy if exists "Authenticated users can view workshops" on experiences;
drop policy if exists "Authenticated users can view experiences" on experiences;
create policy "Authenticated users can view experiences"
  on experiences for select to authenticated using (true);

drop policy if exists "Authenticated users can insert workshops" on experiences;
drop policy if exists "Authenticated users can insert experiences" on experiences;
create policy "Authenticated users can insert experiences"
  on experiences for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update workshops" on experiences;
drop policy if exists "Authenticated users can update experiences" on experiences;
create policy "Authenticated users can update experiences"
  on experiences for update to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 5. Rename triggers + their functions on `experiences`
-- ---------------------------------------------------------------------------

create or replace function generate_experience_slug()
returns trigger as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(new.title, '[^a-z0-9]+', '-', 'g'));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists workshop_slug_trigger on experiences;
drop trigger if exists experience_slug_trigger on experiences;
create trigger experience_slug_trigger
  before insert on experiences
  for each row execute function generate_experience_slug();

drop function if exists generate_workshop_slug();

drop trigger if exists workshops_updated_at on experiences;
drop trigger if exists experiences_updated_at on experiences;
create trigger experiences_updated_at
  before update on experiences
  for each row execute function update_updated_at();

-- create_default_logistics_checklist() has no literal "workshops" reference
-- in its body (only new.id / new.start_date), so it needs no change — only
-- the trigger name/attachment.
drop trigger if exists workshop_logistics_trigger on experiences;
drop trigger if exists experience_logistics_trigger on experiences;
create trigger experience_logistics_trigger
  after insert on experiences
  for each row execute function create_default_logistics_checklist();

-- ---------------------------------------------------------------------------
-- 6. clients / engagements updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists clients_updated_at on clients;
create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

drop trigger if exists engagements_updated_at on engagements;
create trigger engagements_updated_at
  before update on engagements
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Foreign key renames on logistics_tasks / survey_tokens / survey_responses
-- ---------------------------------------------------------------------------
-- Column names deliberately stay `workshop_id` (only the constraint name
-- and its target table change) — these columns are internal join keys, not
-- user-facing, and keeping them stable avoids rewriting every existing
-- `.eq("workshop_id", ...)` call site across the app for zero functional
-- benefit. Renaming the *table* they point to is what actually matters.

alter table logistics_tasks
  drop constraint if exists logistics_tasks_workshop_id_fkey,
  add constraint logistics_tasks_experience_id_fkey
    foreign key (workshop_id) references experiences(id) on delete cascade;

alter table survey_tokens
  drop constraint if exists survey_tokens_workshop_id_fkey,
  add constraint survey_tokens_experience_id_fkey
    foreign key (workshop_id) references experiences(id);

alter table survey_responses
  drop constraint if exists survey_responses_workshop_id_fkey,
  add constraint survey_responses_experience_id_fkey
    foreign key (workshop_id) references experiences(id);

-- ---------------------------------------------------------------------------
-- 8. Update the two survey RPC functions to reference `experiences`
-- ---------------------------------------------------------------------------
-- CRITICAL: unlike the trigger functions above, these two DO reference
-- "workshops" as literal SQL inside their body (a `join workshops ...`).
-- Postgres does not validate that text at CREATE-time — it would keep
-- working right up until the next real call after the rename, then fail
-- with "relation workshops does not exist". Both must be fixed here or the
-- public /survey/[token] page breaks immediately post-migration.
--
-- The returned column `workshop_title` is renamed to `experience_title` to
-- match the new vocabulary. `CREATE OR REPLACE FUNCTION` cannot change a
-- function's declared return columns, so get_survey_context is dropped and
-- recreated rather than replaced in place.

drop function if exists get_survey_context(text);

create function get_survey_context(p_token text)
returns table (
  token_id uuid,
  is_valid boolean,
  is_completed boolean,
  participant_first_name text,
  experience_title text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
begin
  select st.id, st.completed_at, p.first_name, e.title
    into v_token
    from survey_tokens st
    join participants p on p.id = st.participant_id
    join experiences e on e.id = st.workshop_id
    where st.token = p_token;

  if not found then
    return query select null::uuid, false, false, null::text, null::text;
    return;
  end if;

  update survey_tokens
  set opened_at = now()
  where id = v_token.id and opened_at is null;

  return query
    select v_token.id, true, (v_token.completed_at is not null), v_token.first_name, v_token.title;
end;
$$;

revoke all on function get_survey_context(text) from public;
grant execute on function get_survey_context(text) to anon, authenticated;

-- submit_survey_response's body references survey_tokens/survey_responses
-- only (both already have their workshop_id FK repointed at `experiences`
-- in section 7) — no literal "workshops" text inside it, so no change to
-- its body is needed. Recreated here anyway via CREATE OR REPLACE purely
-- to keep this migration's function block self-contained and re-runnable.

create or replace function submit_survey_response(
  p_token text,
  p_content_rating integer,
  p_facilitator_rating integer,
  p_logistics_rating integer,
  p_overall_rating integer,
  p_highlights text,
  p_improvements text,
  p_additional_comments text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
  v_response_id uuid;
begin
  select id, workshop_id, participant_id, completed_at
    into v_token
    from survey_tokens
    where token = p_token
    for update;

  if not found then
    raise exception 'invalid_token';
  end if;

  if v_token.completed_at is not null then
    raise exception 'already_completed';
  end if;

  insert into survey_responses (
    token_id, workshop_id, participant_id,
    content_rating, facilitator_rating, logistics_rating, overall_rating,
    highlights, improvements, additional_comments
  ) values (
    v_token.id, v_token.workshop_id, v_token.participant_id,
    p_content_rating, p_facilitator_rating, p_logistics_rating, p_overall_rating,
    p_highlights, p_improvements, p_additional_comments
  )
  returning id into v_response_id;

  update survey_tokens
  set completed_at = now()
  where id = v_token.id;

  return v_response_id;
end;
$$;

revoke all on function submit_survey_response(text, integer, integer, integer, integer, text, text, text) from public;
grant execute on function submit_survey_response(text, integer, integer, integer, integer, text, text, text) to anon;
