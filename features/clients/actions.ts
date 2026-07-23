"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient as createSupabaseClient } from "@/infrastructure/supabase/server";

import { clientSchema } from "./schema";

export type ClientFormValues = Record<string, string>;

export type CreateClientResult =
  | { success: true; id: string }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      values: ClientFormValues;
    };

const FORM_FIELDS = [
  "name",
  "type",
  "industry",
  "country",
  "city",
  "website",
  "primaryContactName",
  "primaryContactEmail",
  "primaryContactPhone",
  "notes",
] as const;

function readRawValues(formData: FormData): ClientFormValues {
  const values: ClientFormValues = {};

  for (const field of FORM_FIELDS) {
    values[field] = formData.get(field)?.toString() ?? "";
  }

  return values;
}

export async function createClient(
  _prevState: CreateClientResult | null,
  formData: FormData
): Promise<CreateClientResult> {
  const values = readRawValues(formData);

  const parsed = clientSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const data = parsed.data;
  const supabase = await createSupabaseClient();

  const { data: inserted, error } = await supabase
    .from("clients")
    .insert({
      name: data.name,
      type: data.type,
      industry: data.industry || null,
      country: data.country ?? null,
      city: data.city || null,
      website: data.website ?? null,
      primary_contact_name: data.primaryContactName || null,
      primary_contact_email: data.primaryContactEmail ?? null,
      primary_contact_phone: data.primaryContactPhone || null,
      notes: data.notes || null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("Failed to create client", error);

    return {
      success: false,
      error: "Unable to create the client. Please try again.",
      values,
    };
  }

  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${inserted.id}`);
}

export type UpdateClientResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      values: ClientFormValues;
    };

export async function updateClient(
  clientId: string,
  _prevState: UpdateClientResult | null,
  formData: FormData
): Promise<UpdateClientResult> {
  const values = readRawValues(formData);

  const parsed = clientSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const data = parsed.data;
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("clients")
    .update({
      name: data.name,
      type: data.type,
      industry: data.industry || null,
      country: data.country ?? null,
      city: data.city || null,
      website: data.website ?? null,
      primary_contact_name: data.primaryContactName || null,
      primary_contact_email: data.primaryContactEmail ?? null,
      primary_contact_phone: data.primaryContactPhone || null,
      notes: data.notes || null,
    })
    .eq("id", clientId);

  if (error) {
    console.error("Failed to update client", error);

    return {
      success: false,
      error: "Unable to save changes. Please try again.",
      values,
    };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  return { success: true };
}
