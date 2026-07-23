import { createClient } from "@/infrastructure/supabase/server";
import type { EngagementStatus, EngagementType } from "./schema";

// ---------------------------------------------------------------------------
// Summary (per client)
// ---------------------------------------------------------------------------

export type EngagementSummary = {
  id: string;
  clientId: string;
  title: string;
  type: EngagementType;
  status: EngagementStatus;
  startDate: string | null;
  endDate: string | null;
  contractValue: number | null;
  currency: string;
  experienceCount: number;
};

type EngagementRow = {
  id: string;
  client_id: string;
  title: string;
  type: EngagementType;
  status: EngagementStatus;
  start_date: string | null;
  end_date: string | null;
  contract_value: number | null;
  currency: string;
};

export async function getEngagementsByClient(clientId: string): Promise<EngagementSummary[]> {
  const supabase = await createClient();

  const [{ data: engagementRows, error: engagementsError }, { data: experienceRows, error: experiencesError }] =
    await Promise.all([
      supabase
        .from("engagements")
        .select("id, client_id, title, type, status, start_date, end_date, contract_value, currency")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("start_date", { ascending: false, nullsFirst: false }),
      supabase.from("experiences").select("engagement_id").eq("client_id", clientId).is("deleted_at", null),
    ]);

  if (engagementsError) {
    throw new Error(engagementsError.message);
  }

  if (experiencesError) {
    throw new Error(experiencesError.message);
  }

  const experienceCountByEngagement = new Map<string, number>();
  for (const row of experienceRows ?? []) {
    if (!row.engagement_id) {
      continue;
    }
    experienceCountByEngagement.set(
      row.engagement_id,
      (experienceCountByEngagement.get(row.engagement_id) ?? 0) + 1
    );
  }

  const rows: EngagementRow[] = engagementRows ?? [];

  return rows.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    type: row.type,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    contractValue: row.contract_value,
    currency: row.currency,
    experienceCount: experienceCountByEngagement.get(row.id) ?? 0,
  }));
}

export type EngagementOption = { id: string; title: string; clientId: string; clientName: string };

export async function getEngagementOptions(): Promise<EngagementOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("engagements")
    .select("id, title, client_id, clients(name)")
    .is("deleted_at", null)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as unknown as { id: string; title: string; client_id: string; clients: { name: string } | null };
    return {
      id: record.id,
      title: record.title,
      clientId: record.client_id,
      clientName: record.clients?.name ?? "Unknown client",
    };
  });
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export type EngagementDetailRecord = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string | null;
  type: EngagementType;
  status: EngagementStatus;
  startDate: string | null;
  endDate: string | null;
  contractValue: number | null;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type EngagementDetailRow = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  type: EngagementType;
  status: EngagementStatus;
  start_date: string | null;
  end_date: string | null;
  contract_value: number | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients: { name: string } | null;
};

export async function getEngagementById(id: string): Promise<EngagementDetailRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("engagements")
    .select(
      "id, client_id, title, description, type, status, start_date, end_date, contract_value, currency, notes, created_at, updated_at, clients(name)"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as EngagementDetailRow;

  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.clients?.name ?? "Unknown client",
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    contractValue: row.contract_value,
    currency: row.currency,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Experiences under an engagement
// ---------------------------------------------------------------------------

export type EngagementExperience = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  participantCount: number;
};

export async function getEngagementExperiences(engagementId: string): Promise<EngagementExperience[]> {
  const supabase = await createClient();

  const { data: experienceRows, error: experiencesError } = await supabase
    .from("experiences")
    .select("id, slug, title, status, start_date, end_date")
    .eq("engagement_id", engagementId)
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  if (experiencesError) {
    throw new Error(experiencesError.message);
  }

  const experiences = experienceRows ?? [];

  if (experiences.length === 0) {
    return [];
  }

  const slugs = experiences.map((row) => row.slug);

  const { data: participantRows, error: participantsError } = await supabase
    .from("participants")
    .select("workshop_slug")
    .in("workshop_slug", slugs);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const participantCountBySlug = new Map<string, number>();
  for (const row of participantRows ?? []) {
    participantCountBySlug.set(row.workshop_slug, (participantCountBySlug.get(row.workshop_slug) ?? 0) + 1);
  }

  return experiences.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    participantCount: participantCountBySlug.get(row.slug) ?? 0,
  }));
}
