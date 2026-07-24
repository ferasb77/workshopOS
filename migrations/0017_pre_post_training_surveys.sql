-- 0017_pre_post_training_surveys.sql
--
-- Sprint 19: pre/post training surveys, built on the Sprint 17 custom
-- survey builder (survey_templates / survey_questions / survey_tokens /
-- survey_responses / survey_answers). This migration adds a `survey_type`
-- dimension ('satisfaction' | 'pre_training' | 'post_training') that flows
-- through every one of those tables, plus per-experience timing/auto-send
-- config on experience_survey_templates.
--
-- Deviations from the sprint brief, flagged here for the record:
--
--   1. `experience_survey_templates`'s existing unique constraint on
--      survey_tokens is named `survey_tokens_participant_workshop_idx` (it
--      was created via `create unique index`, not an inline column
--      constraint — see 0003). The brief's `drop constraint if exists
--      survey_tokens_participant_id_workshop_id_key` targets a name that
--      never existed, so on its own it would silently no-op and leave the
--      OLD single-column-pair unique index in place — which would then
--      reject inserting a second (pre_training) or third (post_training)
--      token for a participant who already has a satisfaction token. Fixed
--      by dropping the actual index name below.
--   2. The brief's new unique index has a `where completed_at is null or
--      completed_at is not null` filter, which is a tautology (always
--      true) — functionally identical to no filter at all, just harder to
--      read. Simplified to a plain unique index.
--   3. `get_survey_context`'s new body (as given in the brief) omits the
--      `update survey_tokens set opened_at = now() ...` step that every
--      prior version of this function has had since 0003. Dropping it
--      would silently break the existing "Opened" status shown elsewhere
--      in the dashboard (SurveyStatus / SurveyStatusBadge). Restored here.
--   4. `submit_custom_survey_response` isn't mentioned in the brief's SQL,
--      but the architecture rule "survey_type flows through the entire
--      stack: token → response → answer → results" requires it — without
--      this, every pre/post response would silently land back on
--      survey_responses/survey_answers with survey_type defaulted to
--      'satisfaction' (via the column default below), corrupting the
--      Learning Impact comparison. Updated (create or replace — no
--      signature/return-type change) to stamp the token's own survey_type
--      onto both inserts.
--   5. `get_survey_context`'s template-resolution query, as given in the
--      brief, references `template_id` and `experience_id` unqualified.
--      Both names are ALSO this function's own OUT parameters (from
--      `returns table (...)`), which PL/pgSQL exposes as implicit
--      variables for the whole function body — so an unqualified
--      `template_id`/`experience_id` is genuinely ambiguous between "the
--      OUT parameter" and "the column on experience_survey_templates /
--      survey_questions", and Postgres rejects it at runtime with "column
--      reference ... is ambiguous". Caught live (the public survey page
--      returned "Survey link not found" for every valid pre/post token).
--      Fixed by qualifying every such reference with its table name.
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- survey_templates: which kind of survey this template is for
-- ---------------------------------------------------------------------------

alter table survey_templates
  add column if not exists survey_type text not null default 'satisfaction'
    check (survey_type in ('satisfaction', 'pre_training', 'post_training'));

-- ---------------------------------------------------------------------------
-- experience_survey_templates: one row per (experience, survey_type) now,
-- not one row per experience. Existing rows (all satisfaction-survey
-- overrides, since that's the only type that existed before this sprint)
-- pick up survey_type = 'satisfaction' via the column default and become
-- valid rows under the new composite key automatically — no backfill
-- needed.
-- ---------------------------------------------------------------------------

alter table experience_survey_templates
  drop constraint if exists experience_survey_templates_pkey;

alter table experience_survey_templates
  add column if not exists survey_type text not null default 'satisfaction'
    check (survey_type in ('satisfaction', 'pre_training', 'post_training'));

alter table experience_survey_templates
  add column if not exists auto_send boolean not null default true;

alter table experience_survey_templates
  add column if not exists send_offset_hours integer not null default 0;
  -- pre_training: 0 = send immediately on registration
  -- post_training: 0 = send immediately on completion
  -- negative values = send N hours before start (future use)

alter table experience_survey_templates
  add primary key (experience_id, survey_type);

-- ---------------------------------------------------------------------------
-- survey_tokens: survey_type + a token per (participant, experience, type)
-- instead of per (participant, experience). See deviation #1/#2 above.
-- ---------------------------------------------------------------------------

alter table survey_tokens
  add column if not exists survey_type text not null default 'satisfaction'
    check (survey_type in ('satisfaction', 'pre_training', 'post_training'));

drop index if exists survey_tokens_participant_workshop_idx;

create unique index if not exists survey_tokens_participant_experience_type_key
  on survey_tokens(participant_id, workshop_id, survey_type);

-- ---------------------------------------------------------------------------
-- survey_responses / survey_answers: survey_type for clean comparison
-- queries (Learning Impact tab) without joining back through survey_tokens
-- every time.
-- ---------------------------------------------------------------------------

alter table survey_responses
  add column if not exists survey_type text not null default 'satisfaction'
    check (survey_type in ('satisfaction', 'pre_training', 'post_training'));

alter table survey_answers
  add column if not exists survey_type text not null default 'satisfaction'
    check (survey_type in ('satisfaction', 'pre_training', 'post_training'));

create index if not exists survey_responses_type_idx
  on survey_responses(workshop_id, survey_type);

create index if not exists survey_tokens_type_idx
  on survey_tokens(workshop_id, survey_type);

-- ---------------------------------------------------------------------------
-- get_survey_context: dropped + recreated (return shape changes — see
-- deviation #3 above for the one restored behavior).
-- ---------------------------------------------------------------------------

drop function if exists get_survey_context(text);

create or replace function get_survey_context(
  p_token text,
  p_survey_type text default 'satisfaction'
)
returns table (
  token_id uuid,
  participant_id uuid,
  experience_id uuid,
  participant_first_name text,
  experience_title text,
  organization_name text,
  already_completed boolean,
  template_id uuid,
  questions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token survey_tokens%rowtype;
  v_participant participants%rowtype;
  v_experience experiences%rowtype;
  v_template_id uuid;
  v_questions jsonb;
begin
  -- Resolve token
  select * into v_token
  from survey_tokens
  where token = p_token and survey_type = p_survey_type;

  if not found then return; end if;

  update survey_tokens
  set opened_at = now()
  where id = v_token.id and opened_at is null;

  select * into v_participant from participants where id = v_token.participant_id;
  select * into v_experience from experiences where id = v_token.workshop_id;

  -- Resolve template: experience override → org default for this type
  --
  -- Every column referenced here is qualified with its table name even
  -- though only one table is in the FROM clause: `template_id` and
  -- `experience_id` are also names of this function's own OUT parameters
  -- (see the `returns table (...)` above), and PL/pgSQL exposes those as
  -- implicit variables in scope for the whole function body. An unqualified
  -- `template_id`/`experience_id` here is genuinely ambiguous between "the
  -- OUT parameter" and "the column" — Postgres errors on it at runtime
  -- ("column reference ... is ambiguous"), not merely a style nit.
  select experience_survey_templates.template_id into v_template_id
  from experience_survey_templates
  where experience_survey_templates.experience_id = v_token.workshop_id and survey_type = p_survey_type;

  if v_template_id is null then
    select id into v_template_id
    from survey_templates
    where workspace_id = (
      select workspace_id from workspaces
      join organizations o on o.id = workspaces.organization_id
      limit 1
    )
    and survey_type = p_survey_type
    and is_default = true
    limit 1;
  end if;

  -- Build questions JSON if template found
  if v_template_id is not null then
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'order_index', order_index,
        'question_type', question_type,
        'question_text', question_text,
        'description', description,
        'is_required', is_required,
        'options', options,
        'low_label', low_label,
        'high_label', high_label
      ) order by order_index
    ) into v_questions
    from survey_questions
    where survey_questions.template_id = v_template_id;
  end if;

  return query select
    v_token.id,
    v_token.participant_id,
    v_token.workshop_id,
    v_participant.first_name,
    v_experience.title,
    'Enable My Growth'::text,
    v_token.completed_at is not null,
    v_template_id,
    v_questions;
end;
$$;

revoke all on function get_survey_context(text, text) from public;
grant execute on function get_survey_context(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_custom_survey_response: stamp the token's own survey_type onto the
-- response and every answer. See deviation #4 above.
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
  select id, workshop_id, participant_id, completed_at, survey_type
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

  insert into survey_responses (token_id, workshop_id, participant_id, survey_type)
  values (v_token.id, v_token.workshop_id, v_token.participant_id, v_token.survey_type)
  returning id into v_response_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    insert into survey_answers (response_id, question_id, answer_numeric, answer_text, answer_array, survey_type)
    values (
      v_response_id,
      (v_answer->>'questionId')::uuid,
      nullif(v_answer->>'answerNumeric', '')::numeric,
      v_answer->>'answerText',
      v_answer->'answerArray',
      v_token.survey_type
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
