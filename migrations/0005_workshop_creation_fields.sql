-- 0005_workshop_creation_fields.sql
--
-- Adds the fields the new workshop-creation form (Sprint 5) needs, plus the
-- slug-generation and updated_at triggers, and INSERT/UPDATE RLS policies
-- so authenticated operators can actually create a workshop.
--
-- Two fixes from the spec as given:
--   1. `status workshop.workshop_status` referenced a schema ("workshop")
--      that doesn't exist — the enum type is `workshop_status` in `public`
--      (created in 0002). Fixed below. `slug`/`status` also already exist
--      as of 0002, so those two ADD COLUMN lines are no-ops here.
--   2. The form (per the sprint brief) collects City, Country, and
--      "Notes for facilitator" as their own fields, but no columns for
--      them were listed here. Added `city`, `country`, and
--      `facilitator_notes` (nullable text) so those fields have somewhere
--      to live — `venue` alone can't hold three separate inputs.
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

alter table workshops add column if not exists slug text unique;
alter table workshops add column if not exists status workshop_status not null default 'draft';
alter table workshops add column if not exists client_name text;
alter table workshops add column if not exists client_contact_name text;
alter table workshops add column if not exists client_contact_email text;
alter table workshops add column if not exists program_type text;
alter table workshops add column if not exists tags text[];
alter table workshops add column if not exists facilitator_name text;
alter table workshops add column if not exists facilitator_email text;
alter table workshops add column if not exists facilitator_notes text;
alter table workshops add column if not exists materials_notes text;
alter table workshops add column if not exists logistics_notes text;
alter table workshops add column if not exists city text;
alter table workshops add column if not exists country text;
alter table workshops add column if not exists updated_at timestamptz not null default now();

-- Auto-generate slug from title if not provided.
create or replace function generate_workshop_slug()
returns trigger as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(new.title, '[^a-z0-9]+', '-', 'g'));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists workshop_slug_trigger on workshops;
create trigger workshop_slug_trigger
  before insert on workshops
  for each row execute function generate_workshop_slug();

-- updated_at trigger.
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists workshops_updated_at on workshops;
create trigger workshops_updated_at
  before update on workshops
  for each row execute function update_updated_at();

-- Backfill slugs for existing workshops that don't have one.
update workshops
set slug = lower(regexp_replace(title, '[^a-z0-9]+', '-', 'g'))
where slug is null;

drop policy if exists "Authenticated users can insert workshops" on workshops;
create policy "Authenticated users can insert workshops"
  on workshops for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update workshops" on workshops;
create policy "Authenticated users can update workshops"
  on workshops for update
  to authenticated
  using (true);
