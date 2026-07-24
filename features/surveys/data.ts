import { createClient } from "@/infrastructure/supabase/server";
import type { QuestionType } from "./schema";

export type SurveyRowStatus = "not_sent" | "sent" | "completed";

/**
 * The four hardcoded dimensions are nullable now (migration 0014) — a
 * template-driven response has no concept of them and leaves all four
 * null, storing its answers in survey_answers instead. `null` here means
 * "this response used a custom template — see the Survey Results tab or
 * getSurveyResultsByTemplate for its answers," not "unrated."
 */
export type SurveyResponseDetail = {
  id: string;
  contentRating: number | null;
  facilitatorRating: number | null;
  logisticsRating: number | null;
  overallRating: number | null;
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
  content_rating: number | null;
  facilitator_rating: number | null;
  logistics_rating: number | null;
  overall_rating: number | null;
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
      rows
        .map((row) => row.response?.overallRating)
        .filter((rating): rating is number => rating !== null && rating !== undefined)
    ),
    rows,
  };
}

// ---------------------------------------------------------------------------
// Custom survey builder — templates and questions
// ---------------------------------------------------------------------------

export type SurveyQuestion = {
  id: string;
  templateId: string;
  orderIndex: number;
  questionType: QuestionType;
  questionText: string;
  description: string | null;
  isRequired: boolean;
  options: string[] | null;
  lowLabel: string | null;
  highLabel: string | null;
};

export type SurveyTemplateSummary = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SurveyTemplateWithQuestions = SurveyTemplateSummary & { questions: SurveyQuestion[] };

type TemplateRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type QuestionRow = {
  id: string;
  template_id: string;
  order_index: number;
  question_type: QuestionType;
  question_text: string;
  description: string | null;
  is_required: boolean;
  options: string[] | null;
  low_label: string | null;
  high_label: string | null;
};

function mapQuestion(row: QuestionRow): SurveyQuestion {
  return {
    id: row.id,
    templateId: row.template_id,
    orderIndex: row.order_index,
    questionType: row.question_type,
    questionText: row.question_text,
    description: row.description,
    isRequired: row.is_required,
    options: row.options,
    lowLabel: row.low_label,
    highLabel: row.high_label,
  };
}

const QUESTION_SELECT =
  "id, template_id, order_index, question_type, question_text, description, is_required, options, low_label, high_label";

export async function getSurveyTemplates(workspaceId: string): Promise<SurveyTemplateSummary[]> {
  const supabase = await createClient();

  const [{ data: templateRows, error: templatesError }, { data: questionRows, error: questionsError }] =
    await Promise.all([
      supabase
        .from("survey_templates")
        .select("id, workspace_id, name, description, is_default, created_at, updated_at")
        .eq("workspace_id", workspaceId)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true }),
      supabase.from("survey_questions").select("template_id"),
    ]);

  if (templatesError) {
    throw new Error(templatesError.message);
  }
  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questionCountByTemplateId = new Map<string, number>();
  for (const row of (questionRows ?? []) as { template_id: string }[]) {
    questionCountByTemplateId.set(row.template_id, (questionCountByTemplateId.get(row.template_id) ?? 0) + 1);
  }

  return ((templateRows ?? []) as TemplateRow[]).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    questionCount: questionCountByTemplateId.get(row.id) ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getSurveyTemplate(templateId: string): Promise<SurveyTemplateWithQuestions | null> {
  const supabase = await createClient();

  const [{ data: templateRow, error: templateError }, { data: questionRows, error: questionsError }] =
    await Promise.all([
      supabase
        .from("survey_templates")
        .select("id, workspace_id, name, description, is_default, created_at, updated_at")
        .eq("id", templateId)
        .maybeSingle(),
      supabase
        .from("survey_questions")
        .select(QUESTION_SELECT)
        .eq("template_id", templateId)
        .order("order_index", { ascending: true }),
    ]);

  if (templateError) {
    throw new Error(templateError.message);
  }
  if (!templateRow) {
    return null;
  }
  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questions = ((questionRows ?? []) as QuestionRow[]).map(mapQuestion);

  return {
    id: templateRow.id,
    workspaceId: templateRow.workspace_id,
    name: templateRow.name,
    description: templateRow.description,
    isDefault: templateRow.is_default,
    questionCount: questions.length,
    createdAt: templateRow.created_at,
    updatedAt: templateRow.updated_at,
    questions,
  };
}

export type ExperienceSurveyTemplateResolution = {
  source: "override" | "default" | "none";
  template: SurveyTemplateWithQuestions | null;
};

/**
 * Mirrors the resolution order baked into the get_survey_context() Postgres
 * function that the public /survey/[token] page actually relies on for
 * submission — this dashboard-side copy exists so the Surveys tab can show
 * "which template is active" and let an operator override it, without
 * round-tripping through the public RPC.
 */
export async function getExperienceSurveyTemplate(experienceId: string): Promise<ExperienceSurveyTemplateResolution> {
  const supabase = await createClient();

  const { data: overrideRow, error: overrideError } = await supabase
    .from("experience_survey_templates")
    .select("template_id")
    .eq("experience_id", experienceId)
    .maybeSingle();

  if (overrideError) {
    throw new Error(overrideError.message);
  }

  if (overrideRow) {
    const template = await getSurveyTemplate(overrideRow.template_id);
    return { source: "override", template };
  }

  const { data: defaultRow, error: defaultError } = await supabase
    .from("survey_templates")
    .select("id")
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (defaultError) {
    throw new Error(defaultError.message);
  }

  if (defaultRow) {
    const template = await getSurveyTemplate(defaultRow.id);
    return { source: "default", template };
  }

  return { source: "none", template: null };
}

// ---------------------------------------------------------------------------
// Custom survey results — aggregated per question from survey_answers
// ---------------------------------------------------------------------------

export type QuestionResultRating = {
  kind: "rating";
  questionId: string;
  questionType: "rating_5" | "rating_10" | "nps" | "yes_no";
  questionText: string;
  isRequired: boolean;
  responseCount: number;
  average: number | null;
  distribution: { value: number; count: number }[];
  npsScore: number | null;
};

export type QuestionResultChoice = {
  kind: "choice";
  questionId: string;
  questionType: "single_choice" | "multiple_choice";
  questionText: string;
  isRequired: boolean;
  responseCount: number;
  optionCounts: { option: string; count: number }[];
};

export type QuestionResultText = {
  kind: "text";
  questionId: string;
  questionType: "open_text";
  questionText: string;
  isRequired: boolean;
  responses: string[];
};

export type QuestionResult = QuestionResultRating | QuestionResultChoice | QuestionResultText;

export type CustomSurveyResults = {
  templateId: string;
  templateName: string;
  totalResponses: number;
  questionResults: QuestionResult[];
};

type AnswerRow = {
  response_id: string;
  question_id: string;
  answer_numeric: number | null;
  answer_text: string | null;
  answer_array: string[] | null;
};

function computeNpsScore(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }
  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export async function getSurveyResultsByTemplate(
  experienceId: string,
  templateId: string
): Promise<CustomSurveyResults | null> {
  const template = await getSurveyTemplate(templateId);

  if (!template) {
    return null;
  }

  const supabase = await createClient();

  const { data: answerRows, error } = await supabase
    .from("survey_answers")
    .select("response_id, question_id, answer_numeric, answer_text, answer_array, survey_responses!inner(workshop_id)")
    .eq("survey_responses.workshop_id", experienceId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (answerRows ?? []) as unknown as AnswerRow[];
  const answersByQuestionId = new Map<string, AnswerRow[]>();
  for (const row of rows) {
    const bucket = answersByQuestionId.get(row.question_id) ?? [];
    bucket.push(row);
    answersByQuestionId.set(row.question_id, bucket);
  }

  const totalResponses = new Set(rows.map((row) => row.response_id)).size;

  const questionResults: QuestionResult[] = template.questions.map((question) => {
    const answers = answersByQuestionId.get(question.id) ?? [];

    if (question.questionType === "single_choice" || question.questionType === "multiple_choice") {
      const optionCountMap = new Map<string, number>();
      for (const option of question.options ?? []) {
        optionCountMap.set(option, 0);
      }
      for (const answer of answers) {
        if (question.questionType === "single_choice" && answer.answer_text) {
          optionCountMap.set(answer.answer_text, (optionCountMap.get(answer.answer_text) ?? 0) + 1);
        } else if (question.questionType === "multiple_choice" && answer.answer_array) {
          for (const selected of answer.answer_array) {
            optionCountMap.set(selected, (optionCountMap.get(selected) ?? 0) + 1);
          }
        }
      }
      return {
        kind: "choice",
        questionId: question.id,
        questionType: question.questionType,
        questionText: question.questionText,
        isRequired: question.isRequired,
        responseCount: answers.length,
        optionCounts: Array.from(optionCountMap.entries()).map(([option, count]) => ({ option, count })),
      };
    }

    if (question.questionType === "open_text") {
      return {
        kind: "text",
        questionId: question.id,
        questionType: question.questionType,
        questionText: question.questionText,
        isRequired: question.isRequired,
        responses: answers.map((answer) => answer.answer_text).filter((text): text is string => Boolean(text)),
      };
    }

    // rating_5, rating_10, nps, yes_no — all numeric
    const numericAnswers = answers
      .map((answer) => answer.answer_numeric)
      .filter((value): value is number => value !== null);

    const distributionMap = new Map<number, number>();
    for (const value of numericAnswers) {
      distributionMap.set(value, (distributionMap.get(value) ?? 0) + 1);
    }

    return {
      kind: "rating",
      questionId: question.id,
      questionType: question.questionType,
      questionText: question.questionText,
      isRequired: question.isRequired,
      responseCount: numericAnswers.length,
      average: average(numericAnswers),
      distribution: Array.from(distributionMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value - b.value),
      npsScore: question.questionType === "nps" ? computeNpsScore(numericAnswers) : null,
    };
  });

  return {
    templateId: template.id,
    templateName: template.name,
    totalResponses,
    questionResults,
  };
}
