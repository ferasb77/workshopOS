import { createClient } from "@/infrastructure/supabase/server";
import { createServiceRoleClient } from "@/infrastructure/supabase/service-role";
import { getExperienceParticipants } from "@/features/experiences/data";

import { getCertificatePublicUrl } from "./storage";

// ---------------------------------------------------------------------------
// Certificate templates
// ---------------------------------------------------------------------------

export type CertificateTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  titleText: string;
  bodyText: string;
  footerText: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type CertificateTemplateRow = {
  id: string;
  workspace_id: string;
  name: string;
  organization_name: string;
  organization_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  font_family: string;
  title_text: string;
  body_text: string;
  footer_text: string | null;
  signatory_name: string | null;
  signatory_title: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const TEMPLATE_SELECT =
  "id, workspace_id, name, organization_name, organization_logo_url, primary_color, secondary_color, background_color, font_family, title_text, body_text, footer_text, signatory_name, signatory_title, is_default, created_at, updated_at";

function mapTemplate(row: CertificateTemplateRow): CertificateTemplate {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    organizationName: row.organization_name,
    organizationLogoUrl: row.organization_logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    backgroundColor: row.background_color,
    fontFamily: row.font_family,
    titleText: row.title_text,
    bodyText: row.body_text,
    footerText: row.footer_text,
    signatoryName: row.signatory_name,
    signatoryTitle: row.signatory_title,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCertificateTemplates(workspaceId: string): Promise<CertificateTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certificate_templates")
    .select(TEMPLATE_SELECT)
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTemplate);
}

export async function getCertificateTemplateById(templateId: string): Promise<CertificateTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certificate_templates")
    .select(TEMPLATE_SELECT)
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTemplate(data) : null;
}

// ---------------------------------------------------------------------------
// Completion criteria
// ---------------------------------------------------------------------------

export type CompletionCriteria = {
  id: string | null;
  experienceId: string;
  requireAttendance: boolean;
  requireSurveyCompletion: boolean;
  minimumAttendancePercentage: number;
  certificateTemplateId: string | null;
  autoIssue: boolean;
};

function defaultCompletionCriteria(experienceId: string): CompletionCriteria {
  return {
    id: null,
    experienceId,
    requireAttendance: true,
    requireSurveyCompletion: false,
    minimumAttendancePercentage: 100,
    certificateTemplateId: null,
    autoIssue: false,
  };
}

/**
 * Every experience implicitly has criteria — the DB row is only created
 * once an operator hits Save, but until then the column defaults (require
 * attendance, 100%, no auto-issue) are what both the criteria form and the
 * eligibility table in Panel B use.
 */
export async function getExperienceCompletionCriteria(experienceId: string): Promise<CompletionCriteria> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("experience_completion_criteria")
    .select(
      "id, experience_id, require_attendance, require_survey_completion, minimum_attendance_percentage, certificate_template_id, auto_issue"
    )
    .eq("experience_id", experienceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return defaultCompletionCriteria(experienceId);
  }

  return {
    id: data.id,
    experienceId: data.experience_id,
    requireAttendance: data.require_attendance,
    requireSurveyCompletion: data.require_survey_completion,
    minimumAttendancePercentage: data.minimum_attendance_percentage,
    certificateTemplateId: data.certificate_template_id,
    autoIssue: data.auto_issue,
  };
}

// ---------------------------------------------------------------------------
// Eligibility + issued certificates
// ---------------------------------------------------------------------------

export type CertificateStatus = "issued" | "revoked";

export type ExperienceCertificateRow = {
  participantId: string;
  fullName: string;
  email: string;
  company: string | null;
  checkedIn: boolean;
  surveyStatus: "not_sent" | "sent" | "opened" | "completed";
  eligible: boolean;
  certificate: {
    id: string;
    status: CertificateStatus;
    verificationCode: string;
    downloadUrl: string;
    issuedAt: string;
    emailedAt: string | null;
    revokedAt: string | null;
  } | null;
};

type CertificateRow = {
  id: string;
  participant_id: string;
  verification_code: string;
  issued_at: string;
  emailed_at: string | null;
  revoked_at: string | null;
};

/**
 * Attendance in this platform is only ever tracked as a boolean check-in —
 * there's no per-session partial-attendance record. A checked-in
 * participant is treated as 100% attended, everyone else as 0%, and that's
 * compared against `minimumAttendancePercentage`. A threshold below 100
 * still behaves sensibly (checked-in passes, not-checked-in fails); it just
 * can't distinguish "attended half the sessions" from "attended none".
 */
function isEligible(
  criteria: CompletionCriteria,
  participant: { checkedIn: boolean; surveyStatus: string }
): boolean {
  if (criteria.requireAttendance) {
    const attendancePercentage = participant.checkedIn ? 100 : 0;
    if (attendancePercentage < criteria.minimumAttendancePercentage) {
      return false;
    }
  }

  if (criteria.requireSurveyCompletion && participant.surveyStatus !== "completed") {
    return false;
  }

  return true;
}

export async function getExperienceCertificates(experienceId: string): Promise<ExperienceCertificateRow[]> {
  const [participants, criteria] = await Promise.all([
    getExperienceParticipants(experienceId),
    getExperienceCompletionCriteria(experienceId),
  ]);

  const supabase = await createClient();
  const { data: certificateRows, error } = await supabase
    .from("certificates")
    .select("id, participant_id, verification_code, issued_at, emailed_at, revoked_at")
    .eq("experience_id", experienceId)
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // A revoked cert can be superseded by a fresh one for the same
  // participant (the partial unique index only forbids two *live* certs),
  // so take the most recent row per participant — rows are already
  // ordered newest-first.
  const certificateByParticipantId = new Map<string, CertificateRow>();
  for (const row of (certificateRows ?? []) as CertificateRow[]) {
    if (!certificateByParticipantId.has(row.participant_id)) {
      certificateByParticipantId.set(row.participant_id, row);
    }
  }

  return participants.map((participant) => {
    const certificateRow = certificateByParticipantId.get(participant.id) ?? null;

    return {
      participantId: participant.id,
      fullName: `${participant.firstName} ${participant.lastName}`.trim(),
      email: participant.email,
      company: participant.company,
      checkedIn: participant.checkedIn,
      surveyStatus: participant.surveyStatus,
      eligible: isEligible(criteria, participant),
      certificate: certificateRow
        ? {
            id: certificateRow.id,
            status: certificateRow.revoked_at ? "revoked" : "issued",
            verificationCode: certificateRow.verification_code,
            downloadUrl: getCertificatePublicUrl(certificateRow.verification_code),
            issuedAt: certificateRow.issued_at,
            emailedAt: certificateRow.emailed_at,
            revokedAt: certificateRow.revoked_at,
          }
        : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Public verification
// ---------------------------------------------------------------------------

export type CertificateVerification = {
  status: CertificateStatus;
  participantName: string;
  experienceTitle: string;
  organizationName: string;
  completionDate: string;
  issuedAt: string;
  revokedAt: string | null;
  downloadUrl: string;
};

/**
 * Public path — reads via the service-role client rather than the
 * cookie-bound one and decides "issued" vs "revoked" in application code
 * from `revoked_at`, rather than leaning on RLS to filter revoked rows out.
 * The anon RLS policy alone isn't enough here: a visitor who happens to
 * also be signed in to the dashboard in the same browser (a facilitator
 * checking a link, for instance) would authenticate as `authenticated`,
 * whose "manage certificates" policy has no revocation filter — so relying
 * on RLS would show a revoked certificate as valid for that visitor while
 * correctly hiding it for a truly anonymous one. Deciding status here
 * instead makes the outcome the same for every visitor.
 */
export async function getCertificateByVerificationCode(code: string): Promise<CertificateVerification | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("certificates")
    .select("participant_name, experience_title, organization_name, completion_date, issued_at, revoked_at, verification_code")
    .eq("verification_code", code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    status: data.revoked_at ? "revoked" : "issued",
    participantName: data.participant_name,
    experienceTitle: data.experience_title,
    organizationName: data.organization_name,
    completionDate: data.completion_date,
    issuedAt: data.issued_at,
    revokedAt: data.revoked_at,
    downloadUrl: getCertificatePublicUrl(data.verification_code),
  };
}
