import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Enter a hex color like #C9A96E");

export const certificateTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  organizationName: z.string().trim().min(1, "Organization name is required"),
  organizationLogoUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url("Enter a valid URL").optional()
  ),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  backgroundColor: hexColor,
  fontFamily: z.enum(["serif", "sans"]),
  titleText: z.string().trim().min(1, "Title is required"),
  bodyText: z.string().trim().min(1, "Body text is required"),
  footerText: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().optional()
  ),
  signatoryName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().optional()
  ),
  signatoryTitle: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().optional()
  ),
});

export type CertificateTemplateFormValues = z.infer<typeof certificateTemplateSchema>;

// Panel A is a mix of custom (Checkbox/Select) and native controls, saved
// together as one unit — rather than relying on FormData serialization for
// the Checkbox components (see features/certificates/components/
// completion-criteria-form.tsx), the client keeps controlled state and
// calls saveCompletionCriteria directly with a plain object, which this
// schema re-validates server-side.
export const completionCriteriaSchema = z.object({
  requireAttendance: z.boolean(),
  requireSurveyCompletion: z.boolean(),
  minimumAttendancePercentage: z.coerce.number().int().min(1).max(100),
  certificateTemplateId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().uuid().optional()
  ),
  autoIssue: z.boolean(),
});

export type CompletionCriteriaFormValues = z.infer<typeof completionCriteriaSchema>;

// ---------------------------------------------------------------------------
// Certificate template upload (Sprint 18)
// ---------------------------------------------------------------------------

export const CERTIFICATE_TEMPLATE_TYPES = ["generated", "uploaded"] as const;
export type CertificateTemplateType = (typeof CERTIFICATE_TEMPLATE_TYPES)[number];

export const CERTIFICATE_FIELD_KEYS = [
  "participant_name",
  "experience_title",
  "completion_date",
  "organization_name",
  "verification_code",
] as const;
export type CertificateFieldKey = (typeof CERTIFICATE_FIELD_KEYS)[number];

export const CERTIFICATE_FIELD_LABELS: Record<CertificateFieldKey, string> = {
  participant_name: "Participant Name",
  experience_title: "Experience Title",
  completion_date: "Completion Date",
  organization_name: "Organization Name",
  verification_code: "Verification Code",
};

// Kept in the same snake_case shape the DB column stores (both the five
// field keys and each placement's own properties) rather than this
// codebase's usual snake_case-DB / camelCase-TS boundary — it's opaque
// JSON, not individual Postgrest columns, so there's nothing to convert.
export const fieldPlacementSchema = z.object({
  x: z.number(),
  y: z.number(),
  font_size: z.number().min(6).max(96),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a hex color like #C9A96E"),
  align: z.enum(["left", "center", "right"]),
});

export type FieldPlacement = z.infer<typeof fieldPlacementSchema>;

export const fieldPlacementsSchema = z.object({
  participant_name: fieldPlacementSchema,
  experience_title: fieldPlacementSchema,
  completion_date: fieldPlacementSchema,
  organization_name: fieldPlacementSchema,
  verification_code: fieldPlacementSchema,
});

export type FieldPlacements = z.infer<typeof fieldPlacementsSchema>;

export const uploadedTemplateBasicsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  organizationName: z.string().trim().min(1, "Organization name is required"),
});

export type UploadedTemplateBasicsFormValues = z.infer<typeof uploadedTemplateBasicsSchema>;
