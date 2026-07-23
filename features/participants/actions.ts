"use server";

import { participantSchema } from "./schema";
import type { CheckInResult } from "./types";
import { createClient } from "@/infrastructure/supabase/server";
import { fetchFilteredParticipants } from "./data";
import type { ParticipantFilters, ParticipantSurveyStatus } from "./data";

export async function checkInParticipant(
  _: CheckInResult | null,
  formData: FormData
): Promise<CheckInResult> {
  const values = {
    workshopSlug: formData.get("workshopSlug"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    mobile: formData.get("mobile"),
    company: formData.get("company"),
    jobTitle: formData.get("jobTitle"),
  };

  console.log(values);

  const parsed = participantSchema.safeParse(values);

  if (!parsed.success) {
    console.error(parsed.error.flatten());

    return {
      success: false,
      message: JSON.stringify(parsed.error.flatten().fieldErrors),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("workshop_slug", parsed.data.workshopSlug)
    .ilike("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: "This email has already checked in for this workshop.",
    };
  }

  const { error } = await supabase.from("participants").insert({
    workshop_slug: parsed.data.workshopSlug,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    email: parsed.data.email,
    mobile: parsed.data.mobile,
    company: parsed.data.company,
    job_title: parsed.data.jobTitle,
    checked_in: true,
    source: "QR",
  });

  if (error) {
    console.error(error);

    return {
      success: false,
      message: "Unable to complete check-in. Please try again.",
    };
  }

  return {
    success: true,
    message: "Check-in completed successfully.",
  };
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

const SURVEY_STATUS_LABEL: Record<ParticipantSurveyStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  completed: "Completed",
};

function formatCsvDateTime(value: string | null): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const CSV_HEADER = [
  "First Name",
  "Last Name",
  "Email",
  "Mobile",
  "Company",
  "Job Title",
  "Experience",
  "Client",
  "Checked In",
  "Check-in Time",
  "Survey Status",
  "Registration Date",
];

/**
 * Returns a CSV string; the caller (a Client Component) turns it into a
 * downloadable Blob — no client-side CSV library involved. Lives in this
 * "use server" module (not data.ts) because Next.js doesn't allow an inline
 * "use server" export in a file that a Client Component imports from
 * alongside other, non-action server-only functions.
 */
export async function exportParticipants(
  filters: ParticipantFilters & { search?: string }
): Promise<string> {
  const items = await fetchFilteredParticipants(filters);

  const rows = items.map((item) =>
    csvRow([
      item.firstName,
      item.lastName,
      item.email,
      item.mobile,
      item.company ?? "",
      item.jobTitle ?? "",
      item.experienceTitle ?? "",
      item.clientName ?? "",
      item.checkedIn ? "Yes" : "No",
      formatCsvDateTime(item.checkedInAt),
      SURVEY_STATUS_LABEL[item.surveyStatus],
      formatCsvDateTime(item.registeredAt),
    ])
  );

  return [csvRow(CSV_HEADER), ...rows].join("\r\n");
}