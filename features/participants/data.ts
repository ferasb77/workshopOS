import { createClient } from "@/infrastructure/supabase/server";

export type ParticipantListItem = {
  id: string;
  fullName: string;
  company: string | null;
  jobTitle: string | null;
  experienceTitle: string | null;
  clientName: string | null;
  checkedIn: boolean;
  registeredAt: string;
};

const RECENT_PARTICIPANTS_LIMIT = 50;

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  workshop_slug: string;
  checked_in: boolean;
  created_at: string;
};

type ExperienceLookupRow = {
  slug: string;
  title: string;
  clients: { name: string } | null;
};

/**
 * The 50 most recently registered participants across every experience —
 * `participants.workshop_slug` is the only link back to `experiences` (no
 * FK, unchanged since before the Sprint 11 client/engagement rename), so
 * the experience/client context is joined in memory the same way every
 * other participant-facing query in this codebase already does it.
 */
export async function getRecentParticipants(): Promise<ParticipantListItem[]> {
  const supabase = await createClient();

  const { data: participantRows, error: participantsError } = await supabase
    .from("participants")
    .select("id, first_name, last_name, company, job_title, workshop_slug, checked_in, created_at")
    .order("created_at", { ascending: false })
    .limit(RECENT_PARTICIPANTS_LIMIT);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const rows: ParticipantRow[] = participantRows ?? [];
  const slugs = [...new Set(rows.map((row) => row.workshop_slug))];

  const { data: experienceRows, error: experiencesError } =
    slugs.length > 0
      ? await supabase.from("experiences").select("slug, title, clients(name)").in("slug", slugs)
      : { data: [] as ExperienceLookupRow[], error: null };

  if (experiencesError) {
    throw new Error(experiencesError.message);
  }

  const experienceBySlug = new Map(
    ((experienceRows ?? []) as unknown as ExperienceLookupRow[]).map((row) => [row.slug, row])
  );

  return rows.map((row) => {
    const experience = experienceBySlug.get(row.workshop_slug);

    return {
      id: row.id,
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      company: row.company,
      jobTitle: row.job_title,
      experienceTitle: experience?.title ?? null,
      clientName: experience?.clients?.name ?? null,
      checkedIn: row.checked_in,
      registeredAt: row.created_at,
    };
  });
}
