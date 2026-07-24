-- 0014_survey_builder.sql
--
-- Sprint 17: custom survey builder.
--   - `survey_templates` / `survey_questions` / `experience_survey_templates`
--     let operators build arbitrary surveys instead of the hardcoded
--     4-dimension form. `experience_survey_templates` is a one-row-per-
--     experience override (PK on experience_id) — no row means "use the
--     workspace default template", and no default template at all means
--     "fall back to the legacy hardcoded form" (existing behavior,
--     untouched).
--   - `survey_answers` is the flexible per-question answer store for
--     template-driven responses. Legacy responses never write here — they
--     keep using the original hardcoded columns on `survey_responses`.
--   - `content_rating` / `facilitator_rating` / `logistics_rating` /
--     `overall_rating` on `survey_responses` are relaxed from NOT NULL to
--     nullable. Nothing else about them changes: existing rows, the
--     existing CHECK constraints (a NULL trivially satisfies `between 1
--     and 5`), and the legacy `submit_survey_response` RPC are all
--     unaffected. This is required so a template-driven response (which
--     has no concept of those four fixed dimensions) can insert a
--     `survey_responses` row without supplying them.
--   - `get_survey_context` is replaced (dropped + recreated, since
--     CREATE OR REPLACE can't change a function's return shape) to also
--     resolve which template applies to a token's experience — an
--     experience-level override in `experience_survey_templates`, else the
--     workspace's default template, else null (meaning: render the legacy
--     form). It returns the resolved template's questions as a single
--     jsonb array so the public /survey/[token] page needs exactly one
--     RPC round trip, same as before.
--   - `submit_custom_survey_response` is new: the template-driven sibling
--     of `submit_survey_response`, written the same way (security definer,
--     validates the token itself, only ever reachable by knowing a valid
--     token string) for the same reason documented in 0003 — a plain
--     anon-writable policy on survey_answers can't validate token
--     ownership or "not already completed" on its own. The `security
--     definer` function is the actual write path from the public form;
--     the anon INSERT policy on survey_answers below is kept only because
--     it's part of the schema as specified.
--   - Workspace-default resolution here mirrors the certificate-template
--     default resolution from Sprint 16: `experiences` has no
--     `workspace_id` column (intentionally deferred since migration 0001),
--     so "the workspace default" is resolved as "the one template with
--     is_default = true" rather than scoped by workspace — accurate for
--     this app's current single-workspace reality.
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

create table if not exists survey_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id),
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists survey_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references survey_templates(id) on delete cascade,
  order_index integer not null,
  question_type text not null check (question_type in (
    'rating_5',
    'rating_10',
    'nps',
    'single_choice',
    'multiple_choice',
    'open_text',
    'yes_no'
  )),
  question_text text not null,
  description text,
  is_required boolean not null default true,
  options jsonb,
  low_label text,
  high_label text,
  created_at timestamptz not null default now()
);

create table if not exists experience_survey_templates (
  experience_id uuid not null references experiences(id) on delete cascade,
  template_id uuid not null references survey_templates(id),
  primary key (experience_id)
);

create table if not exists survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references survey_responses(id) on delete cascade,
  question_id uuid not null references survey_questions(id),
  answer_numeric numeric,
  answer_text text,
  answer_array jsonb,
  created_at timestamptz not null default now()
);

create index if not exists survey_templates_workspace_id_idx on survey_templates(workspace_id);
create index if not exists survey_questions_template_id_order_idx on survey_questions(template_id, order_index);
create index if not exists survey_answers_response_id_idx on survey_answers(response_id);
create index if not exists survey_answers_question_id_idx on survey_answers(question_id);

alter table survey_templates enable row level security;
alter table survey_questions enable row level security;
alter table experience_survey_templates enable row level security;
alter table survey_answers enable row level security;

drop policy if exists "Authenticated users can manage survey templates" on survey_templates;
create policy "Authenticated users can manage survey templates"
  on survey_templates for all to authenticated using (true);

drop policy if exists "Authenticated users can manage survey questions" on survey_questions;
create policy "Authenticated users can manage survey questions"
  on survey_questions for all to authenticated using (true);

drop policy if exists "Authenticated users can manage experience survey templates" on experience_survey_templates;
create policy "Authenticated users can manage experience survey templates"
  on experience_survey_templates for all to authenticated using (true);

drop policy if exists "Public can insert survey answers" on survey_answers;
create policy "Public can insert survey answers"
  on survey_answers for insert to anon with check (true);

drop policy if exists "Authenticated users can read survey answers" on survey_answers;
create policy "Authenticated users can read survey answers"
  on survey_answers for select to authenticated using (true);

-- Backward compatibility: allow a template-driven response to omit the
-- four legacy dimensions entirely. See header comment.
alter table survey_responses alter column content_rating drop not null;
alter table survey_responses alter column facilitator_rating drop not null;
alter table survey_responses alter column logistics_rating drop not null;
alter table survey_responses alter column overall_rating drop not null;

-- ---------------------------------------------------------------------------
-- Seed a default template that matches the existing hardcoded survey so
-- existing survey flows continue working unchanged
-- ---------------------------------------------------------------------------

insert into survey_templates (workspace_id, name, description, is_default)
select w.id, 'Standard Training Evaluation', 'Default 4-dimension training evaluation survey', true
from workspaces w
join organizations o on o.id = w.organization_id
where o.slug = 'enable-my-growth'
  and not exists (
    select 1 from survey_templates st where st.workspace_id = w.id and st.name = 'Standard Training Evaluation'
  )
limit 1;

insert into survey_questions (template_id, order_index, question_type, question_text, description, is_required, low_label, high_label)
select
  t.id,
  q.order_index,
  'rating_5',
  q.question_text,
  q.description,
  true,
  'Poor',
  'Excellent'
from survey_templates t
cross join (values
  (1, 'Content Quality', 'How would you rate the quality of the workshop content?'),
  (2, 'Facilitator Delivery', 'How would you rate the facilitator''s delivery and engagement?'),
  (3, 'Logistics and Organisation', 'How would you rate the logistics and organisation of the workshop?'),
  (4, 'Overall Experience', 'Overall, how would you rate this workshop?')
) as q(order_index, question_text, description)
where t.is_default = true and t.name = 'Standard Training Evaluation'
  and not exists (select 1 from survey_questions sq where sq.template_id = t.id);

insert into survey_questions (template_id, order_index, question_type, question_text, description, is_required, low_label, high_label)
select t.id, 5, 'nps', 'How likely are you to recommend this program to a colleague?', null, true, 'Not at all likely', 'Extremely likely'
from survey_templates t
where t.is_default = true and t.name = 'Standard Training Evaluation'
  and not exists (select 1 from survey_questions sq where sq.template_id = t.id and sq.order_index = 5);

insert into survey_questions (template_id, order_index, question_type, question_text, description, is_required)
select t.id, 6, 'open_text', 'What did you find most valuable about this program?', null, false
from survey_templates t
where t.is_default = true and t.name = 'Standard Training Evaluation'
  and not exists (select 1 from survey_questions sq where sq.template_id = t.id and sq.order_index = 6);

insert into survey_questions (template_id, order_index, question_type, question_text, description, is_required)
select t.id, 7, 'open_text', 'What could be improved?', null, false
from survey_templates t
where t.is_default = true and t.name = 'Standard Training Evaluation'
  and not exists (select 1 from survey_questions sq where sq.template_id = t.id and sq.order_index = 7);

insert into survey_questions (template_id, order_index, question_type, question_text, description, is_required)
select t.id, 8, 'open_text', 'Any other comments?', null, false
from survey_templates t
where t.is_default = true and t.name = 'Standard Training Evaluation'
  and not exists (select 1 from survey_questions sq where sq.template_id = t.id and sq.order_index = 8);

-- ---------------------------------------------------------------------------
-- get_survey_context: dropped + recreated (return shape changed — adds
-- template_id / template_questions). See header comment.
-- ---------------------------------------------------------------------------

drop function if exists get_survey_context(text);

create function get_survey_context(p_token text)
returns table (
  token_id uuid,
  is_valid boolean,
  is_completed boolean,
  participant_first_name text,
  workshop_title text,
  template_id uuid,
  template_questions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
  v_template_id uuid;
  v_questions jsonb;
begin
  select st.id, st.completed_at, p.first_name, w.title, st.workshop_id
    into v_token
    from survey_tokens st
    join participants p on p.id = st.participant_id
    join workshops w on w.id = st.workshop_id
    where st.token = p_token;

  if not found then
    return query select null::uuid, false, false, null::text, null::text, null::uuid, null::jsonb;
    return;
  end if;

  update survey_tokens
  set opened_at = now()
  where id = v_token.id and opened_at is null;

  select est.template_id into v_template_id
    from experience_survey_templates est
    where est.experience_id = v_token.workshop_id;

  if v_template_id is null then
    select t.id into v_template_id from survey_templates t where t.is_default = true limit 1;
  end if;

  if v_template_id is not null then
    select jsonb_agg(
      jsonb_build_object(
        'id', sq.id,
        'orderIndex', sq.order_index,
        'questionType', sq.question_type,
        'questionText', sq.question_text,
        'description', sq.description,
        'isRequired', sq.is_required,
        'options', sq.options,
        'lowLabel', sq.low_label,
        'highLabel', sq.high_label
      ) order by sq.order_index
    ) into v_questions
    from survey_questions sq
    where sq.template_id = v_template_id;
  end if;

  return query
    select v_token.id, true, (v_token.completed_at is not null), v_token.first_name, v_token.title, v_template_id, v_questions;
end;
$$;

revoke all on function get_survey_context(text) from public;
grant execute on function get_survey_context(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_custom_survey_response: template-driven sibling of
-- submit_survey_response. p_answers is a jsonb array of
-- {questionId, answerNumeric, answerText, answerArray}.
-- ---------------------------------------------------------------------------

create or replace function submit_custom_survey_response(
  p_token text,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
  v_response_id uuid;
  v_answer jsonb;
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

  insert into survey_responses (token_id, workshop_id, participant_id)
  values (v_token.id, v_token.workshop_id, v_token.participant_id)
  returning id into v_response_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    insert into survey_answers (response_id, question_id, answer_numeric, answer_text, answer_array)
    values (
      v_response_id,
      (v_answer->>'questionId')::uuid,
      nullif(v_answer->>'answerNumeric', '')::numeric,
      v_answer->>'answerText',
      v_answer->'answerArray'
    );
  end loop;

  update survey_tokens
  set completed_at = now()
  where id = v_token.id;

  return v_response_id;
end;
$$;

revoke all on function submit_custom_survey_response(text, jsonb) from public;
grant execute on function submit_custom_survey_response(text, jsonb) to anon;
