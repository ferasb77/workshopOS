"use server";

import { revalidatePath } from "next/cache";

import { requireEnv } from "@/infrastructure/env";
import { getResendClient, getResendFromAddress } from "@/infrastructure/email/resend-client";
import { renderSurveyEmail, renderSurveyReminderEmail } from "@/infrastructure/email/survey-email";
import { createClient } from "@/infrastructure/supabase/server";
import { maybeAutoIssueCertificate } from "@/features/certificates/actions";

import { surveyResponseSchema } from "./schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SendSurveyResult =
  | { success: true; sent: number; skipped: number; failed: number; errors: string[] }
  | { success: false; error: string };

export type SubmitSurveyResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

type ExperienceContext = { id: string; title: string; slug: string };
type ParticipantContext = { id: string; first_name: string; email: string };

async function ensureTokenAndSend(
  supabase: SupabaseServerClient,
  participant: ParticipantContext,
  experience: ExperienceContext,
  appUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing, error: findError } = await supabase
    .from("survey_tokens")
    .select("id, token, completed_at")
    .eq("participant_id", participant.id)
    .eq("workshop_id", experience.id)
    .maybeSingle();

  if (findError) {
    return { ok: false, error: findError.message };
  }

  if (existing?.completed_at) {
    return { ok: false, error: `${participant.first_name} already completed the survey.` };
  }

  let token = existing?.token as string | undefined;

  if (existing) {
    const { error } = await supabase
      .from("survey_tokens")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { data: inserted, error } = await supabase
      .from("survey_tokens")
      .insert({
        participant_id: participant.id,
        workshop_id: experience.id,
        sent_at: new Date().toISOString(),
      })
      .select("token")
      .single();

    if (error || !inserted) {
      return { ok: false, error: error?.message ?? "Unable to create survey token." };
    }

    token = inserted.token;
  }

  if (!token) {
    return { ok: false, error: "Unable to resolve survey token." };
  }

  const surveyUrl = `${appUrl}/survey/${token}`;
  const { subject, html } = renderSurveyEmail({
    participantFirstName: participant.first_name,
    experienceTitle: experience.title,
    surveyUrl,
  });

  try {
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send({
      from: getResendFromAddress(),
      to: participant.email,
      subject,
      html,
    });

    if (sendError) {
      return { ok: false, error: sendError.message };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to send survey email.",
    };
  }

  return { ok: true };
}

function resolveAppUrl(): { ok: true; url: string } | { ok: false; error: string } {
  try {
    return { ok: true, url: requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "") };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Missing configuration." };
  }
}

export async function sendSurveyToParticipant(
  _prevState: SendSurveyResult | null,
  formData: FormData
): Promise<SendSurveyResult> {
  const experienceId = formData.get("experienceId")?.toString();
  const experienceSlug = formData.get("experienceSlug")?.toString();
  const experienceTitle = formData.get("experienceTitle")?.toString();
  const participantId = formData.get("participantId")?.toString();

  if (!experienceId || !experienceSlug || !experienceTitle || !participantId) {
    return { success: false, error: "Missing required fields." };
  }

  const appUrl = resolveAppUrl();
  if (!appUrl.ok) {
    return { success: false, error: appUrl.error };
  }

  const supabase = await createClient();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id, first_name, email")
    .eq("id", participantId)
    .single();

  if (participantError || !participant) {
    return { success: false, error: "Participant not found." };
  }

  const result = await ensureTokenAndSend(
    supabase,
    participant,
    { id: experienceId, title: experienceTitle, slug: experienceSlug },
    appUrl.url
  );

  revalidatePath(`/dashboard/experiences/${experienceSlug}`);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, sent: 1, skipped: 0, failed: 0, errors: [] };
}

export async function sendSurveyToAllParticipants(
  _prevState: SendSurveyResult | null,
  formData: FormData
): Promise<SendSurveyResult> {
  const experienceId = formData.get("experienceId")?.toString();
  const experienceSlug = formData.get("experienceSlug")?.toString();
  const experienceTitle = formData.get("experienceTitle")?.toString();

  if (!experienceId || !experienceSlug || !experienceTitle) {
    return { success: false, error: "Missing required fields." };
  }

  const appUrl = resolveAppUrl();
  if (!appUrl.ok) {
    return { success: false, error: appUrl.error };
  }

  const supabase = await createClient();

  const [{ data: participants, error: participantsError }, { data: tokens, error: tokensError }] =
    await Promise.all([
      supabase
        .from("participants")
        .select("id, first_name, email")
        .eq("workshop_slug", experienceSlug),
      supabase
        .from("survey_tokens")
        .select("participant_id")
        .eq("workshop_id", experienceId),
    ]);

  if (participantsError) {
    return { success: false, error: participantsError.message };
  }

  if (tokensError) {
    return { success: false, error: tokensError.message };
  }

  const participantIdsWithTokens = new Set((tokens ?? []).map((token) => token.participant_id));
  const targets = (participants ?? []).filter((participant) => !participantIdsWithTokens.has(participant.id));

  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const participant of targets) {
    const result = await ensureTokenAndSend(
      supabase,
      participant,
      { id: experienceId, title: experienceTitle, slug: experienceSlug },
      appUrl.url
    );

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      errors.push(`${participant.first_name}: ${result.error}`);
    }
  }

  revalidatePath(`/dashboard/experiences/${experienceSlug}`);

  return {
    success: true,
    sent,
    skipped: (participants?.length ?? 0) - targets.length,
    failed,
    errors,
  };
}

export async function submitSurveyResponse(
  _prevState: SubmitSurveyResult | null,
  formData: FormData
): Promise<SubmitSurveyResult> {
  const parsed = surveyResponseSchema.safeParse({
    token: formData.get("token"),
    contentRating: formData.get("contentRating"),
    facilitatorRating: formData.get("facilitatorRating"),
    logisticsRating: formData.get("logisticsRating"),
    overallRating: formData.get("overallRating"),
    highlights: formData.get("highlights"),
    improvements: formData.get("improvements"),
    additionalComments: formData.get("additionalComments"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please complete all required fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_survey_response", {
    p_token: parsed.data.token,
    p_content_rating: parsed.data.contentRating,
    p_facilitator_rating: parsed.data.facilitatorRating,
    p_logistics_rating: parsed.data.logisticsRating,
    p_overall_rating: parsed.data.overallRating,
    p_highlights: parsed.data.highlights,
    p_improvements: parsed.data.improvements,
    p_additional_comments: parsed.data.additionalComments || null,
  });

  if (error) {
    if (error.message.includes("already_completed")) {
      return { success: false, error: "This survey has already been completed." };
    }

    if (error.message.includes("invalid_token")) {
      return { success: false, error: "This survey link is invalid." };
    }

    return { success: false, error: "Unable to submit your response. Please try again." };
  }

  // Fire-and-forget, same reasoning as the check-in flow: a certificate
  // hiccup must never surface as a survey-submission failure.
  const { data: tokenRow } = await supabase
    .from("survey_tokens")
    .select("participant_id, workshop_id")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (tokenRow) {
    void maybeAutoIssueCertificate(tokenRow.participant_id, tokenRow.workshop_id);
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Non-responder resend (bulk) — reuses the original invite email/template,
// unlike sendSurveyReminder below, which is the shorter, per-participant
// nudge described in the Sprint 15 brief.
// ---------------------------------------------------------------------------

export async function sendToNonResponders(
  experienceSlug: string,
  workshopId: string
): Promise<SendSurveyResult> {
  const appUrl = resolveAppUrl();
  if (!appUrl.ok) {
    return { success: false, error: appUrl.error };
  }

  const supabase = await createClient();

  const { data: experience, error: experienceError } = await supabase
    .from("experiences")
    .select("id, title, slug")
    .eq("id", workshopId)
    .maybeSingle();

  if (experienceError) {
    return { success: false, error: experienceError.message };
  }

  if (!experience) {
    return { success: false, error: "Experience not found." };
  }

  const [{ data: participants, error: participantsError }, { data: tokens, error: tokensError }] =
    await Promise.all([
      supabase
        .from("participants")
        .select("id, first_name, email")
        .eq("workshop_slug", experienceSlug),
      supabase
        .from("survey_tokens")
        .select("participant_id, completed_at")
        .eq("workshop_id", workshopId),
    ]);

  if (participantsError) {
    return { success: false, error: participantsError.message };
  }

  if (tokensError) {
    return { success: false, error: tokensError.message };
  }

  const tokenByParticipantId = new Map((tokens ?? []).map((token) => [token.participant_id, token]));

  // Non-responders: a token exists (they were sent one) but it's not
  // completed. Participants with no token at all belong to "Send to all
  // unsent" (sendSurveyToAllParticipants above), not this action.
  const targets = (participants ?? []).filter((participant) => {
    const token = tokenByParticipantId.get(participant.id);
    return Boolean(token) && !token?.completed_at;
  });

  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const participant of targets) {
    const result = await ensureTokenAndSend(
      supabase,
      participant,
      { id: experience.id, title: experience.title, slug: experience.slug },
      appUrl.url
    );

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      errors.push(`${participant.first_name}: ${result.error}`);
    }
  }

  revalidatePath(`/dashboard/experiences/${experienceSlug}`);

  return {
    success: true,
    sent,
    skipped: (participants?.length ?? 0) - targets.length,
    failed,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Individual reminder — shorter email, gated to tokens sent >48h ago that
// still haven't completed (the UI only shows this action once that's true,
// but it's re-checked here too since a Server Action can be invoked
// directly regardless of what the client currently renders).
// ---------------------------------------------------------------------------

export type SendReminderResult = { success: true } | { success: false; error: string };

const REMINDER_ELIGIBLE_HOURS = 48;

export async function sendSurveyReminder(tokenId: string): Promise<SendReminderResult> {
  const appUrl = resolveAppUrl();
  if (!appUrl.ok) {
    return { success: false, error: appUrl.error };
  }

  const supabase = await createClient();

  const { data: token, error: tokenError } = await supabase
    .from("survey_tokens")
    .select("id, token, participant_id, workshop_id, sent_at, completed_at")
    .eq("id", tokenId)
    .maybeSingle();

  if (tokenError) {
    return { success: false, error: tokenError.message };
  }

  if (!token) {
    return { success: false, error: "Survey token not found." };
  }

  if (token.completed_at) {
    return { success: false, error: "This participant already completed the survey." };
  }

  if (token.sent_at) {
    const hoursSinceSent = (Date.now() - new Date(token.sent_at).getTime()) / 3_600_000;
    if (hoursSinceSent < REMINDER_ELIGIBLE_HOURS) {
      return {
        success: false,
        error: `Reminders can only be sent ${REMINDER_ELIGIBLE_HOURS} hours after the original invite.`,
      };
    }
  }

  const [{ data: participant, error: participantError }, { data: experience, error: experienceError }] =
    await Promise.all([
      supabase.from("participants").select("first_name, email").eq("id", token.participant_id).maybeSingle(),
      supabase.from("experiences").select("title, slug").eq("id", token.workshop_id).maybeSingle(),
    ]);

  if (participantError || !participant) {
    return { success: false, error: "Participant not found." };
  }

  if (experienceError || !experience) {
    return { success: false, error: "Experience not found." };
  }

  const surveyUrl = `${appUrl.url}/survey/${token.token}`;
  const { subject, html } = renderSurveyReminderEmail({
    participantFirstName: participant.first_name,
    experienceTitle: experience.title,
    surveyUrl,
  });

  try {
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send({
      from: getResendFromAddress(),
      to: participant.email,
      subject,
      html,
    });

    if (sendError) {
      return { success: false, error: sendError.message };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to send reminder email.",
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("survey_tokens")
    .update({ sent_at: now, reminder_sent_at: now })
    .eq("id", tokenId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/dashboard/experiences/${experience.slug}`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Flag for follow-up
// ---------------------------------------------------------------------------

export type FlagSurveyResponseResult = { success: true; flagged: boolean } | { success: false; error: string };

export async function flagSurveyResponse(
  responseId: string,
  flagged: boolean
): Promise<FlagSurveyResponseResult> {
  const supabase = await createClient();

  const { data: response, error: fetchError } = await supabase
    .from("survey_responses")
    .select("workshop_id")
    .eq("id", responseId)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!response) {
    return { success: false, error: "Survey response not found." };
  }

  const { error } = await supabase.from("survey_responses").update({ flagged }).eq("id", responseId);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: experience } = await supabase
    .from("experiences")
    .select("slug")
    .eq("id", response.workshop_id)
    .maybeSingle();

  if (experience) {
    revalidatePath(`/dashboard/experiences/${experience.slug}`);
  }

  return { success: true, flagged };
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(values: string[]): string {
  return values.map(csvEscape).join(",");
}

function formatCsvDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const SURVEY_CSV_HEADER = [
  "Participant Name",
  "Company",
  "Content Rating",
  "Facilitator Rating",
  "Logistics Rating",
  "Overall Rating",
  "Highlights",
  "Improvements",
  "Additional Comments",
  "Submitted At",
];

export async function downloadSurveyResults(experienceId: string): Promise<string> {
  const supabase = await createClient();

  const { data: responseRows, error } = await supabase
    .from("survey_responses")
    .select(
      "participant_id, content_rating, facilitator_rating, logistics_rating, overall_rating, highlights, improvements, additional_comments, submitted_at"
    )
    .eq("workshop_id", experienceId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = responseRows ?? [];
  const participantIds = [...new Set(rows.map((row) => row.participant_id))];

  const { data: participantRows, error: participantsError } =
    participantIds.length > 0
      ? await supabase.from("participants").select("id, first_name, last_name, company").in("id", participantIds)
      : { data: [], error: null };

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const participantById = new Map((participantRows ?? []).map((row) => [row.id, row]));

  const csvRows = rows.map((row) => {
    const participant = participantById.get(row.participant_id);

    return csvRow([
      participant ? `${participant.first_name} ${participant.last_name}` : "",
      participant?.company ?? "",
      String(row.content_rating),
      String(row.facilitator_rating),
      String(row.logistics_rating),
      String(row.overall_rating),
      row.highlights ?? "",
      row.improvements ?? "",
      row.additional_comments ?? "",
      formatCsvDateTime(row.submitted_at),
    ]);
  });

  return [csvRow(SURVEY_CSV_HEADER), ...csvRows].join("\r\n");
}
