"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/infrastructure/supabase/server";

import { createWorkshopSchema } from "./schema";

export type WorkshopFormValues = Record<string, string>;

export type CreateWorkshopResult =
  | { success: true; slug: string }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      values: WorkshopFormValues;
    };

const FORM_FIELDS = [
  "title",
  "programType",
  "description",
  "tags",
  "status",
  "startDate",
  "endDate",
  "venueName",
  "city",
  "country",
  "capacity",
  "clientName",
  "clientContactName",
  "clientContactEmail",
  "facilitatorName",
  "facilitatorEmail",
  "facilitatorNotes",
  "materialsNotes",
  "logisticsNotes",
] as const;

function readRawValues(formData: FormData): WorkshopFormValues {
  const values: WorkshopFormValues = {};

  for (const field of FORM_FIELDS) {
    values[field] = formData.get(field)?.toString() ?? "";
  }

  return values;
}

export async function createWorkshop(
  _prevState: CreateWorkshopResult | null,
  formData: FormData
): Promise<CreateWorkshopResult> {
  const values = readRawValues(formData);

  const parsed = createWorkshopSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const data = parsed.data;

  // No separate city/country columns existed before this sprint's `venue`
  // field alone — city and country now have their own columns (see
  // migrations/0005), but `venue` stays a combined display string too so
  // existing venue-only readers (dashboard panels, emails) keep working.
  const venue = [data.venueName, data.city, data.country].filter(Boolean).join(", ");

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("workshops")
    .insert({
      title: data.title,
      description: data.description || null,
      program_type: data.programType ?? null,
      tags: data.tags,
      status: data.status,
      start_date: data.startDate,
      end_date: data.endDate,
      venue,
      city: data.city || null,
      country: data.country ?? null,
      capacity: data.capacity,
      client_name: data.clientName || null,
      client_contact_name: data.clientContactName || null,
      client_contact_email: data.clientContactEmail ?? null,
      facilitator_name: data.facilitatorName || null,
      facilitator_email: data.facilitatorEmail ?? null,
      facilitator_notes: data.facilitatorNotes || null,
      materials_notes: data.materialsNotes || null,
      logistics_notes: data.logisticsNotes || null,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A workshop with this title already exists. Try a slightly different title.",
        values,
      };
    }

    console.error("Failed to create workshop", error);

    return {
      success: false,
      error: "Unable to create the workshop. Please try again.",
      values,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workshops");
  redirect(`/dashboard/workshops/${inserted.slug}`);
}
