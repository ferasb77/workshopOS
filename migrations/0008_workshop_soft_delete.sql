-- 0008_workshop_soft_delete.sql
--
-- The Sprint 8 brief said no migration was needed for workshop editing
-- ("all required columns were added in migration 0005"), but delete needs
-- `deleted_at` and that column was never added — checked the live schema
-- directly (PostgREST 42703 on workshops.deleted_at) to confirm before
-- writing this. CLAUDE.md's own convention is soft deletes via
-- `deleted_at`, so this adds it rather than repurposing `status` (a
-- cancelled workshop and a deleted draft are not the same thing).
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

alter table workshops add column if not exists deleted_at timestamptz;

create index if not exists workshops_deleted_at_idx on workshops (deleted_at);
