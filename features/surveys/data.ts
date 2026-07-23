import { createClient } from "@/infrastructure/supabase/server";

export type SurveyRowStatus = "not_sent" | "sent" | "completed";

export type SurveyResponseDetail = {
  id: string;
  contentRating: number;
  facilitatorRating: number;
  logisticsRating: number;
  overallRating: number;
  highlights: string | null;
  improvements: string | null;
  additionalComments: string | null;
  submittedAt: string;
  flagged: boolean;
};

export type SurveyParticipantRow = {
  participantId: string;
  tokenId: string | null;
  fullName: string;
  company: string | null;
  status: SurveyRowStatus;
  sentAt: string | null;
  completedAt: string | null;
  /** Hours since sent_at — drives reminder eligibility (>48h, not completed). */
  hoursSinceSent: number | null;
  response: SurveyResponseDetail | null;
};

export type SurveyManagementData = {
  experienceId: string;
  experienceSlug: string;
  experienceTitle: string;
  totalParticipants: number;
  surveysSent: number;
  surveysCompleted: number;
  responseRate: number;
  averageOverallScore: number | null;
  rows: SurveyParticipantRow[];
};

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
};

type TokenRow = {
  id: string;
  participant_id: string;
  sent_at: string | null;
  completed_at: string | null;
};

type ResponseRow = {
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
  flagged: boolean;
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

const MS_PER_HOUR = 3_600_000;

/**
 * Everything the "Surveys" management tab needs in one call: every
 * participant for this experience, their token/response state, and the
 * summary-bar aggregates — the table and the summary bar must always agree
 * on the same numbers, so they're computed from the same rows here rather
 * than separately.
 */
export async function getSurveyManagementData(experienceId: string): Promise<SurveyManagementData | null> {
  const supabase = await createClient();

  const { data: experienceRow, error: experienceError } = await supabase
    .from("experiences")
    .select("id, slug, title")
    .eq("id", experienceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (experienceError) {
    throw new Error(experienceError.message);
  }

  if (!experienceRow) {
    return null;
  }

  const [participantsResult, tokensResult, responsesResult] = await Promise.all([
    supabase
      .from("participants")
      .select("id, first_name, last_name, company")
      .eq("workshop_slug", experienceRow.slug)
      .order("created_at", { ascending: true }),
    supabase
      .from("survey_tokens")
      .select("id, participant_id, sent_at, completed_at")
      .eq("workshop_id", experienceId),
    supabase
      .from("survey_responses")
      .select(
        "id, participant_id, content_rating, facilitator_rating, logistics_rating, overall_rating, highlights, improvements, additional_comments, submitted_at, flagged"
      )
      .eq("workshop_id", experienceId),
  ]);

  if (participantsResult.error) {
    throw new Error(participantsResult.error.message);
  }
  if (tokensResult.error) {
    throw new Error(tokensResult.error.message);
  }
  if (responsesResult.error) {
    throw new Error(responsesResult.error.message);
  }

  const participantRows: ParticipantRow[] = participantsResult.data ?? [];
  const tokenByParticipantId = new Map(
    ((tokensResult.data ?? []) as TokenRow[]).map((row) => [row.participant_id, row])
  );
  const responseByParticipantId = new Map(
    ((responsesResult.data ?? []) as ResponseRow[]).map((row) => [row.participant_id, row])
  );

  const now = Date.now();

  const rows: SurveyParticipantRow[] = participantRows.map((participant) => {
    const token = tokenByParticipantId.get(participant.id) ?? null;
    const response = responseByParticipantId.get(participant.id) ?? null;

    let status: SurveyRowStatus = "not_sent";
    if (token?.completed_at) {
      status = "completed";
    } else if (token?.sent_at) {
      status = "sent";
    }

    return {
      participantId: participant.id,
      tokenId: token?.id ?? null,
      fullName: `${participant.first_name} ${participant.last_name}`.trim(),
      company: participant.company,
      status,
      sentAt: token?.sent_at ?? null,
      completedAt: token?.completed_at ?? null,
      hoursSinceSent: token?.sent_at ? (now - new Date(token.sent_at).getTime()) / MS_PER_HOUR : null,
      response: response
        ? {
            id: response.id,
            contentRating: response.content_rating,
            facilitatorRating: response.facilitator_rating,
            logisticsRating: response.logistics_rating,
            overallRating: response.overall_rating,
            highlights: response.highlights,
            improvements: response.improvements,
            additionalComments: response.additional_comments,
            submittedAt: response.submitted_at,
            flagged: response.flagged,
          }
        : null,
    };
  });

  const surveysSent = rows.filter((row) => row.status === "sent" || row.status === "completed").length;
  const surveysCompleted = rows.filter((row) => row.status === "completed").length;

  return {
    experienceId: experienceRow.id,
    experienceSlug: experienceRow.slug,
    experienceTitle: experienceRow.title,
    totalParticipants: rows.length,
    surveysSent,
    surveysCompleted,
    responseRate: rows.length > 0 ? Math.round((surveysCompleted / rows.length) * 100) : 0,
    averageOverallScore: average(
      rows.filter((row) => row.response !== null).map((row) => row.response!.overallRating)
    ),
    rows,
  };
}
