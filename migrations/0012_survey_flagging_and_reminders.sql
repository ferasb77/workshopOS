-- 0012_survey_flagging_and_reminders.sql
--
-- Sprint 15: survey workflow improvements.
--   - `flagged` on survey_responses backs the "flag for follow-up" toggle
--     in the new response-detail modal.
--   - `reminder_sent_at` on survey_tokens is a distinct audit trail from
--     `sent_at` — `sent_at` still gets bumped on every resend/reminder (it's
--     what the 48-hour reminder-eligibility window is measured against),
--     while `reminder_sent_at` specifically records the last time the
--     shorter reminder email (as opposed to the original invite) went out.
--   - The UPDATE policy on survey_responses is new: until now nothing ever
--     updated a response after it was submitted (0003 only granted
--     authenticated SELECT), so flagging needs its own explicit grant.
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

alter table survey_responses
  add column if not exists flagged boolean not null default false;

alter table survey_tokens
  add column if not exists reminder_sent_at timestamptz;

create index if not exists survey_responses_flagged_idx
  on survey_responses(flagged) where flagged = true;

drop policy if exists "Authenticated users can update survey responses" on survey_responses;
create policy "Authenticated users can update survey responses"
  on survey_responses for update to authenticated using (true);
