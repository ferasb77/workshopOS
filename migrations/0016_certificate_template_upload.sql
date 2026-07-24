-- 0016_certificate_template_upload.sql
--
-- Sprint 18: certificate template upload. Operators upload a PDF as the
-- certificate background design; the platform overlays participant name,
-- experience title, completion date, organization name, and verification
-- code at configurable positions on top of it.
--
-- Note: the brief called this migration "0015" — that number was already
-- used by Sprint 17's fix-forward migration
-- (0015_fix_survey_context_table_name.sql), so this is 0016 instead.
--
-- No new tables — extends certificate_templates in place:
--   - `template_type` ('generated' | 'uploaded') tells issueCertificate and
--     previewCertificateTemplate which PDF generation path to use.
--     Existing rows default to 'generated', so the current pdf-lib-drawn
--     certificate flow is completely unchanged for every template that
--     existed before this migration.
--   - `uploaded_pdf_path` is the object path within the new private
--     `certificate-templates` storage bucket (created programmatically by
--     features/certificates/storage.ts on first upload, same lazy-create
--     pattern as the `certificates` bucket from Sprint 16) — null until an
--     operator uploads a PDF.
--   - `field_placements` is intentionally left as-is (snake_case keys,
--     both the five field names and each placement's own properties)
--     rather than following this codebase's usual snake_case-DB /
--     camelCase-TS boundary — it's opaque JSON, not individual Postgrest
--     columns, so there's no automatic case conversion to mirror, and
--     features/certificates/pdf.ts reads it directly in this shape.
--   - `page_width_pts` / `page_height_pts` default to the same A4-landscape
--     dimensions the generated layout already uses, but get overwritten
--     with the uploaded PDF's actual page size on upload (see
--     uploadCertificateTemplatePdf in actions.ts) — operators aren't
--     required to use A4 landscape for their own design.
--
-- Run manually via the Supabase SQL editor. Safe to re-run.

alter table certificate_templates
  add column if not exists template_type text not null default 'generated'
    check (template_type in ('generated', 'uploaded'));

alter table certificate_templates
  add column if not exists uploaded_pdf_path text;

alter table certificate_templates
  add column if not exists field_placements jsonb not null default '{
    "participant_name": {"x": 421, "y": 320, "font_size": 28, "color": "#26215C", "align": "center"},
    "experience_title": {"x": 421, "y": 260, "font_size": 18, "color": "#C9A96E", "align": "center"},
    "completion_date":  {"x": 421, "y": 210, "font_size": 14, "color": "#444441", "align": "center"},
    "organization_name":{"x": 421, "y": 160, "font_size": 12, "color": "#888780", "align": "center"},
    "verification_code":{"x": 760, "y": 40,  "font_size": 9,  "color": "#888780", "align": "right"}
  }';

alter table certificate_templates
  add column if not exists page_width_pts integer not null default 842;

alter table certificate_templates
  add column if not exists page_height_pts integer not null default 595;
