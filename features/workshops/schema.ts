import { z } from "zod";

import type { WorkshopStatus } from "@/infrastructure/repositories/dashboard";

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

// "Cancelled" is deliberately excluded from CREATE_STATUS_OPTIONS (below) —
// a brand-new workshop is never created pre-cancelled — but is a real,
// reachable status via editing, so it lives in the full option list here.
export const WORKSHOP_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Published" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies readonly { value: WorkshopStatus; label: string }[];

export const CREATE_STATUS_OPTIONS = WORKSHOP_STATUS_OPTIONS.filter(
  (option) => option.value !== "cancelled"
);

/**
 * Allowed next statuses per current status, keyed by the status a workshop
 * is currently in. `completed` and `cancelled` map to only themselves —
 * those workshops render read-only in the edit form, so the question never
 * reaches the dropdown, but `updateWorkshop` also checks this server-side
 * so the rule holds even if a request bypasses the UI.
 */
export const WORKSHOP_STATUS_TRANSITIONS: Record<WorkshopStatus, readonly WorkshopStatus[]> = {
  draft: ["draft", "active", "cancelled"],
  active: ["active", "completed", "cancelled", "draft"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

const workshopFieldsSchema = z.object({
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
  status: z.enum(["draft", "active", "completed", "cancelled"]).default("active"),

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
});

function withDateOrderRule<T extends typeof workshopFieldsSchema>(schema: T) {
  return schema.refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
}

// create and update share one field definition (workshopFieldsSchema) —
// every field is already optional except title/startDate/endDate/
// venueName/capacity, which is exactly what Sprint 8 asks for on update
// too, so there's nothing to loosen. The one real difference (status must
// accept "cancelled" on edit) lives in the shared base, not a duplicate.
export const createWorkshopSchema = withDateOrderRule(workshopFieldsSchema);
export const updateWorkshopSchema = withDateOrderRule(workshopFieldsSchema);

export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
