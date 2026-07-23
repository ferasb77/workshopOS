import { z } from "zod";

export const PROGRAM_TYPES = [
  "Workshop",
  "Program",
  "Coaching Engagement",
  "Assessment",
  "Conference",
  "Community of Practice",
  "Consulting Engagement",
  "Other",
] as const;

export const COUNTRIES = [
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Egypt",
  "Jordan",
  "Lebanon",
  "Other",
] as const;

export const WORKSHOP_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Published" },
  { value: "completed", label: "Completed" },
] as const;

/** Empty-string form fields should behave as "not provided", not fail
 * format validation (e.g. an untouched email input, an unselected select). */
function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

export const createWorkshopSchema = z
  .object({
    // Section 1 — Program Details
    title: z.string().trim().min(1, "Title is required"),
    programType: z.preprocess(emptyToUndefined, z.enum(PROGRAM_TYPES).optional()),
    description: z.string().trim().optional(),
    tags: z
      .string()
      .optional()
      .transform((value) =>
        (value ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      ),
    status: z.enum(["draft", "active", "completed"]).default("active"),

    // Section 2 — Schedule and Location
    startDate: z.string().trim().min(1, "Start date is required"),
    endDate: z.string().trim().min(1, "End date is required"),
    venueName: z.string().trim().min(1, "Venue is required"),
    city: z.string().trim().optional(),
    country: z.preprocess(emptyToUndefined, z.enum(COUNTRIES).optional()),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),

    // Section 3 — Client Details
    clientName: z.string().trim().optional(),
    clientContactName: z.string().trim().optional(),
    clientContactEmail: z.preprocess(
      emptyToUndefined,
      z.string().trim().email("Enter a valid email address").optional()
    ),

    // Section 4 — Facilitator
    facilitatorName: z.string().trim().optional(),
    facilitatorEmail: z.preprocess(
      emptyToUndefined,
      z.string().trim().email("Enter a valid email address").optional()
    ),
    facilitatorNotes: z.string().trim().optional(),

    // Section 5 — Logistics and Materials
    materialsNotes: z.string().trim().optional(),
    logisticsNotes: z.string().trim().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
