-- 0015_fix_survey_context_table_name.sql
--
-- Fixes a regression introduced by 0014's rewrite of get_survey_context().
--
-- 0014 based its version of the function on the ORIGINAL body from
-- migration 0003 (`join workshops w on w.id = st.workshop_id`, returning a
-- `workshop_title` column) without checking that migration 0011 had
-- already renamed the underlying table from `workshops` to `experiences`
-- and updated this exact function to match (joining `experiences e`,
-- returning `experience_title`). Dropping and recreating the function with
-- the stale 0003 body silently reintroduced the pre-0011 bug: every call
-- fails with "relation \"workshops\" does not exist", taking down the
-- entire public /survey/[token] page (both the legacy and new
-- template-driven paths, since both go through this one function).
--
-- This migration re-recreates get_survey_context with the correct
-- `experiences` join and `experience_title` column name, while keeping the
-- template_id/template_questions columns 0014 added.
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

drop function if exists get_survey_context(text);

create function get_survey_context(p_token text)
returns table (
  token_id uuid,
  is_valid boolean,
  is_completed boolean,
  participant_first_name text,
  experience_title text,
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
  select st.id, st.completed_at, p.first_name, e.title, st.workshop_id
    into v_token
    from survey_tokens st
    join participants p on p.id = st.participant_id
    join experiences e on e.id = st.workshop_id
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
