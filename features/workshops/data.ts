import { createClient } from "@/infrastructure/supabase/server";
import type { WorkshopStatus } from "@/infrastructure/repositories/dashboard";

// ---------------------------------------------------------------------------
// Workshop
// ---------------------------------------------------------------------------

export type WorkshopDetailRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  programType: string | null;
  tags: string[];
  status: WorkshopStatus;
  startDate: string;
  endDate: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  capacity: number;
  clientName: string | null;
  clientContactName: string | null;
  clientContactEmail: string | null;
  facilitatorName: string | null;
  facilitatorEmail: string | null;
  facilitatorNotes: string | null;
  materialsNotes: string | null;
  logisticsNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

type WorkshopRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  program_type: string | null;
  tags: string[] | null;
  status: WorkshopStatus;
  start_date: string;
  end_date: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  capacity: number;
  client_name: string | null;
  client_contact_name: string | null;
  client_contact_email: string | null;
  facilitator_name: string | null;
  facilitator_email: string | null;
  facilitator_notes: string | null;
  materials_notes: string | null;
  logistics_notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapWorkshop(row: WorkshopRow): WorkshopDetailRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    programType: row.program_type,
    tags: row.tags ?? [],
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    venue: row.venue,
    city: row.city,
    country: row.country,
    capacity: row.capacity,
    clientName: row.client_name,
    clientContactName: row.client_contact_name,
    clientContactEmail: row.client_contact_email,
    facilitatorName: row.facilitator_name,
    facilitatorEmail: row.facilitator_email,
    facilitatorNotes: row.facilitator_notes,
    materialsNotes: row.materials_notes,
    logisticsNotes: row.logistics_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkshopBySlug(slug: string): Promise<WorkshopDetailRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workshops")
    .select(
      "id, slug, title, description, program_type, tags, status, start_date, end_date, venue, city, country, capacity, client_name, client_contact_name, client_contact_email, facilitator_name, facilitator_email, facilitator_notes, materials_notes, logistics_notes, created_at, updated_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapWorkshop(data as WorkshopRow);
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

export type SurveyStatus = "not_sent" | "sent" | "opened" | "completed";

export type WorkshopParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  jobTitle: string | null;
  checkedIn: boolean;
  checkedInAt: string;
  registeredAt: string;
  surveyStatus: SurveyStatus;
};

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  checked_in: boolean;
  checked_in_at: string;
  created_at: string;
};

type SurveyTokenStatusRow = {
  participant_id: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
};

/**
 * `participants` only carries `workshop_slug` (text), not a `workshop_id`
 * foreign key, so resolving the slug is a required extra step here.
 */
export async function getWorkshopParticipants(workshopId: string): Promise<WorkshopParticipant[]> {
  const supabase = await createClient();

  const { data: workshopRow, error: workshopError } = await supabase
    .from("workshops")
    .select("slug")
    .eq("id", workshopId)
    .maybeSingle();

  if (workshopError) {
    throw new Error(workshopError.message);
  }

  if (!workshopRow) {
    return [];
  }

  const [participantsResult, tokensResult] = await Promise.all([
    supabase
      .from("participants")
      .select("id, first_name, last_name, email, company, job_title, checked_in, checked_in_at, created_at")
      .eq("workshop_slug", workshopRow.slug)
      .order("created_at", { ascending: true }),
    supabase
      .from("survey_tokens")
      .select("participant_id, sent_at, opened_at, completed_at")
      .eq("workshop_id", workshopId),
  ]);

  if (participantsResult.error) {
    throw new Error(participantsResult.error.message);
  }

  if (tokensResult.error) {
    throw new Error(tokensResult.error.message);
  }

  const participantRows: ParticipantRow[] = participantsResult.data ?? [];
  const tokenRows: SurveyTokenStatusRow[] = tokensResult.data ?? [];
  const tokenByParticipantId = new Map(tokenRows.map((token) => [token.participant_id, token]));

  return participantRows.map((participant) => {
    const token = tokenByParticipantId.get(participant.id) ?? null;

    let surveyStatus: SurveyStatus = "not_sent";
    if (token?.completed_at) {
      surveyStatus = "completed";
    } else if (token?.opened_at) {
      surveyStatus = "opened";
    } else if (token?.sent_at) {
      surveyStatus = "sent";
    }

    return {
      id: participant.id,
      firstName: participant.first_name,
      lastName: participant.last_name,
      email: participant.email,
      company: participant.company,
      jobTitle: participant.job_title,
      checkedIn: participant.checked_in,
      checkedInAt: participant.checked_in_at,
      registeredAt: participant.created_at,
      surveyStatus,
    };
  });
}

// ---------------------------------------------------------------------------
// Survey results
// ---------------------------------------------------------------------------

export type SurveyDimensionAverages = {
  content: number | null;
  facilitator: number | null;
  logistics: number | null;
  overall: number | null;
};

export type SurveyResponseSummary = {
  id: string;
  participantFirstName: string;
  contentRating: number;
  facilitatorRating: number;
  logisticsRating: number;
  overallRating: number;
  highlights: string | null;
  improvements: string | null;
  additionalComments: string | null;
  submittedAt: string;
};

export type WorkshopSurveyResults = {
  averages: SurveyDimensionAverages;
  responses: SurveyResponseSummary[];
};

type SurveyResponseRow = {
  id: string;
  participant_id: string;
  content_rating: number;
  facilitator_rating: number;
  logistics_rating: number;
  overall_rating: number;
  highlights: string | null;
  improvements: string | null;
  additional_comments: string | null;
  submitted_at: string;
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export async function getWorkshopSurveyResults(workshopId: string): Promise<WorkshopSurveyResults> {
  const supabase = await createClient();

  const [{ data: responseRows, error: responsesError }, { data: participantRows, error: participantsError }] =
    await Promise.all([
      supabase
        .from("survey_responses")
        .select(
          "id, participant_id, content_rating, facilitator_rating, logistics_rating, overall_rating, highlights, improvements, additional_comments, submitted_at"
        )
        .eq("workshop_id", workshopId)
        .order("submitted_at", { ascending: false }),
      supabase.from("participants").select("id, first_name"),
    ]);

  if (responsesError) {
    throw new Error(responsesError.message);
  }

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const rows: SurveyResponseRow[] = responseRows ?? [];
  const firstNameByParticipantId = new Map(
    (participantRows ?? []).map((p) => [p.id as string, p.first_name as string])
  );

  const responses: SurveyResponseSummary[] = rows.map((row) => ({
    id: row.id,
    participantFirstName: firstNameByParticipantId.get(row.participant_id) ?? "Participant",
    contentRating: row.content_rating,
    facilitatorRating: row.facilitator_rating,
    logisticsRating: row.logistics_rating,
    overallRating: row.overall_rating,
    highlights: row.highlights,
    improvements: row.improvements,
    additionalComments: row.additional_comments,
    submittedAt: row.submitted_at,
  }));

  const averages: SurveyDimensionAverages = {
    content: average(rows.map((row) => row.content_rating)),
    facilitator: average(rows.map((row) => row.facilitator_rating)),
    logistics: average(rows.map((row) => row.logistics_rating)),
    overall: average(rows.map((row) => row.overall_rating)),
  };

  return { averages, responses };
}

// ---------------------------------------------------------------------------
// Logistics
// ---------------------------------------------------------------------------

export const LOGISTICS_CATEGORIES = [
  "venue",
  "catering",
  "printing",
  "shipping",
  "travel",
  "accommodation",
  "av_equipment",
  "materials",
  "communication",
  "other",
] as const;

export type LogisticsCategory = (typeof LOGISTICS_CATEGORIES)[number];

export type LogisticsStatus = "pending" | "in_progress" | "completed" | "blocked" | "not_applicable";

export type LogisticsTask = {
  id: string;
  category: LogisticsCategory;
  title: string;
  description: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  status: LogisticsStatus;
  notes: string | null;
  completedAt: string | null;
};

export type LogisticsCategoryGroup = {
  category: LogisticsCategory;
  tasks: LogisticsTask[];
};

type LogisticsTaskRow = {
  id: string;
  category: LogisticsCategory;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: LogisticsStatus;
  notes: string | null;
  completed_at: string | null;
};

export async function getWorkshopLogisticsTasks(workshopId: string): Promise<LogisticsCategoryGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("logistics_tasks")
    .select("id, category, title, description, assigned_to, due_date, status, notes, completed_at")
    .eq("workshop_id", workshopId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows: LogisticsTaskRow[] = data ?? [];

  const tasksByCategory = new Map<LogisticsCategory, LogisticsTask[]>();
  for (const row of rows) {
    const bucket = tasksByCategory.get(row.category) ?? [];
    bucket.push({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      status: row.status,
      notes: row.notes,
      completedAt: row.completed_at,
    });
    tasksByCategory.set(row.category, bucket);
  }

  return LOGISTICS_CATEGORIES.filter((category) => tasksByCategory.has(category)).map((category) => ({
    category,
    tasks: tasksByCategory.get(category)!,
  }));
}
