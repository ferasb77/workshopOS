import { z } from "zod";

export const ENGAGEMENT_TYPES = [
  "training_contract",
  "assessment_project",
  "coaching_program",
  "consulting_engagement",
  "blended_program",
  "other",
] as const;

export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];

export const ENGAGEMENT_TYPE_LABELS: Record<EngagementType, string> = {
  training_contract: "Training Contract",
  assessment_project: "Assessment Project",
  coaching_program: "Coaching Program",
  consulting_engagement: "Consulting Engagement",
  blended_program: "Blended Program",
  other: "Other",
};

export const ENGAGEMENT_STATUSES = ["draft", "active", "completed", "cancelled"] as const;

export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

export const ENGAGEMENT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies readonly { value: EngagementStatus; label: string }[];

export const CURRENCIES = ["USD", "SAR", "AED", "QAR", "EUR", "GBP"] as const;

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

export const engagementSchema = z.object({
  clientId: z.string().uuid("A client is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  type: z.enum(ENGAGEMENT_TYPES).default("training_contract"),
  status: z.enum(ENGAGEMENT_STATUSES).default("active"),
  startDate: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  endDate: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  contractValue: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative("Contract value must be positive").optional()
  ),
  currency: z.enum(CURRENCIES).default("USD"),
  notes: z.string().trim().optional(),
});

export type EngagementInput = z.infer<typeof engagementSchema>;
