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
