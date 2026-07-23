-- 0006_logistics_tasks.sql
--
-- Logistics checklist per workshop, auto-seeded with a default 14-task
-- checklist on workshop creation, backfilled for existing workshops, and
-- pre-completed for workshops that are already completed/cancelled.
--
-- Run manually via the Supabase SQL editor. Safe to re-run (drops/recreates
-- the trigger, guards the index/policy creation, and the backfill/update
-- steps are naturally idempotent — they only touch rows that still need it).

create table if not exists logistics_tasks (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  category text not null check (category in ('venue', 'catering', 'printing', 'shipping', 'travel', 'accommodation', 'av_equipment', 'materials', 'communication', 'other')),
  title text not null,
  description text,
  assigned_to text,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'blocked', 'not_applicable')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists logistics_tasks_workshop_id_idx on logistics_tasks (workshop_id);
create index if not exists logistics_tasks_status_idx on logistics_tasks (status);
create index if not exists logistics_tasks_due_date_idx on logistics_tasks (due_date);

alter table logistics_tasks enable row level security;

drop policy if exists "Authenticated users can manage logistics tasks" on logistics_tasks;
create policy "Authenticated users can manage logistics tasks"
  on logistics_tasks for all
  to authenticated
  using (true)
  with check (true);

-- Auto-generate default logistics checklist when a workshop is created.
create or replace function create_default_logistics_checklist()
returns trigger as $$
begin
  insert into logistics_tasks (workshop_id, category, title, due_date) values
    (new.id, 'venue', 'Confirm venue booking', new.start_date::date - 30),
    (new.id, 'venue', 'Send venue setup brief', new.start_date::date - 7),
    (new.id, 'catering', 'Confirm catering requirements', new.start_date::date - 14),
    (new.id, 'catering', 'Confirm catering on day', new.start_date::date - 1),
    (new.id, 'printing', 'Send materials to printer', new.start_date::date - 21),
    (new.id, 'printing', 'Confirm printing complete', new.start_date::date - 7),
    (new.id, 'shipping', 'Arrange materials shipping', new.start_date::date - 14),
    (new.id, 'shipping', 'Confirm materials received at venue', new.start_date::date - 1),
    (new.id, 'travel', 'Book facilitator travel', new.start_date::date - 21),
    (new.id, 'accommodation', 'Book facilitator accommodation', new.start_date::date - 21),
    (new.id, 'av_equipment', 'Confirm AV equipment requirements', new.start_date::date - 7),
    (new.id, 'materials', 'Prepare participant materials', new.start_date::date - 14),
    (new.id, 'communication', 'Send participant confirmation emails', new.start_date::date - 7),
    (new.id, 'communication', 'Send participant reminder emails', new.start_date::date - 2);
  return new;
end;
$$ language plpgsql;

drop trigger if exists workshop_logistics_trigger on workshops;
create trigger workshop_logistics_trigger
  after insert on workshops
  for each row execute function create_default_logistics_checklist();

-- updated_at trigger, matching the pattern used elsewhere in this project.
drop trigger if exists logistics_tasks_updated_at on logistics_tasks;
create trigger logistics_tasks_updated_at
  before update on logistics_tasks
  for each row execute function update_updated_at();

-- Backfill logistics tasks for existing workshops that don't have any.
insert into logistics_tasks (workshop_id, category, title, due_date)
select
  w.id,
  t.category,
  t.title,
  w.start_date::date + t.offset_days
from workshops w
cross join (values
  ('venue', 'Confirm venue booking', -30),
  ('venue', 'Send venue setup brief', -7),
  ('catering', 'Confirm catering requirements', -14),
  ('catering', 'Confirm catering on day', -1),
  ('printing', 'Send materials to printer', -21),
  ('printing', 'Confirm printing complete', -7),
  ('shipping', 'Arrange materials shipping', -14),
  ('shipping', 'Confirm materials received at venue', -1),
  ('travel', 'Book facilitator travel', -21),
  ('accommodation', 'Book facilitator accommodation', -21),
  ('av_equipment', 'Confirm AV equipment requirements', -7),
  ('materials', 'Prepare participant materials', -14),
  ('communication', 'Send participant confirmation emails', -7),
  ('communication', 'Send participant reminder emails', -2)
) as t(category, title, offset_days)
where not exists (
  select 1 from logistics_tasks lt where lt.workshop_id = w.id
);

-- Mark all logistics tasks for completed/cancelled workshops as completed.
update logistics_tasks lt
set status = 'completed', completed_at = now()
from workshops w
where lt.workshop_id = w.id
and w.status in ('completed', 'cancelled')
and lt.status = 'pending';
