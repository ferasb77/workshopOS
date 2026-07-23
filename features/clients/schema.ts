import { z } from "zod";

export const CLIENT_TYPES = ["corporate", "government", "ngo", "other"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  corporate: "Corporate",
  government: "Government",
  ngo: "NGO",
  other: "Other",
};

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

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(CLIENT_TYPES).default("corporate"),
  industry: z.string().trim().optional(),
  country: z.preprocess(emptyToUndefined, z.enum(COUNTRIES).optional()),
  city: z.string().trim().optional(),
  website: z.preprocess(emptyToUndefined, z.string().trim().url("Enter a valid URL").optional()),
  primaryContactName: z.string().trim().optional(),
  primaryContactEmail: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Enter a valid email address").optional()
  ),
  primaryContactPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
