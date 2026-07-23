import Link from "next/link";
import { Mail, Phone, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SurveyStatusBadge } from "@/features/surveys/components/survey-status-badge";
import type {
  ParticipantDetail,
  ParticipantSurveyResponseItem,
} from "@/features/participants/data";

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CheckInBadge({ checkedIn }: { checkedIn: boolean }) {
  if (checkedIn) {
    return (
      <Badge variant="outline" className="border-transparent bg-emerald-500/15 text-emerald-400">
        Checked In
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
      Not Checked In
    </Badge>
  );
}

type Props = {
  detail: ParticipantDetail;
  surveyResponses: ParticipantSurveyResponseItem[];
};

export function ParticipantDetailView({ detail, surveyResponses }: Props) {
  const { participant, experienceHistory } = detail;

  return (
    <div className="space-y-6">
      <Card className="bg-surface-elevated">
        <CardContent>
          <h1 className="text-2xl font-bold">{participant.fullName}</h1>
          {(participant.company || participant.jobTitle) && (
            <p className="mt-1 text-muted-foreground">
              {[participant.jobTitle, participant.company].filter(Boolean).join(" at ")}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              {participant.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {participant.mobile}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Experience History</CardTitle>
          <CardDescription>
            {experienceHistory.length} experience{experienceHistory.length === 1 ? "" : "s"} attended
            across every engagement and client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {experienceHistory.map((item) => (
              <li
                key={item.participantRowId}
                className="rounded-lg border border-border-subtle bg-night/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {item.experienceId ? (
                      <Link
                        href={`/dashboard/experiences/${item.experienceSlug}`}
                        className="font-medium text-ivory hover:text-gold"
                      >
                        {item.experienceTitle}
                      </Link>
                    ) : (
                      <p className="font-medium text-ivory">{item.experienceTitle ?? "—"}</p>
                    )}
                    {(item.clientName || item.engagementTitle) && (
                      <p className="text-sm text-muted-foreground">
                        {[item.clientName, item.engagementTitle].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckInBadge checkedIn={item.checkedIn} />
                    <SurveyStatusBadge status={item.surveyStatus} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
                  <p>{formatDate(item.startDate)} – {formatDate(item.endDate)}</p>
                  <p>{item.venue ?? "—"}</p>
                  <p>Checked in: {formatDateTime(item.checkedInAt)}</p>
                  <p>
                    Satisfaction:{" "}
                    {item.satisfactionScore !== null ? (
                      <span className="text-gold">{item.satisfactionScore.toFixed(1)}/5</span>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {surveyResponses.length > 0 && (
        <Card className="bg-surface-elevated">
          <CardHeader>
            <CardTitle>Survey Responses</CardTitle>
            <CardDescription>
              {surveyResponses.length} response{surveyResponses.length === 1 ? "" : "s"} submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {surveyResponses.map((response) => (
                <li key={response.id} className="rounded-lg border border-border-subtle p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-ivory">{response.experienceTitle ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(response.submittedAt)}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
                    <p className="flex items-center gap-1">
                      Content: <span className="text-gold">{response.contentRating}/5</span>
                    </p>
                    <p className="flex items-center gap-1">
                      Facilitator: <span className="text-gold">{response.facilitatorRating}/5</span>
                    </p>
                    <p className="flex items-center gap-1">
                      Logistics: <span className="text-gold">{response.logisticsRating}/5</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Star className="size-3.5 fill-gold text-gold" />
                      Overall: <span className="text-gold">{response.overallRating}/5</span>
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {response.highlights && (
                      <p>
                        <span className="text-muted-foreground">Most valuable: </span>
                        {response.highlights}
                      </p>
                    )}
                    {response.improvements && (
                      <p>
                        <span className="text-muted-foreground">Could improve: </span>
                        {response.improvements}
                      </p>
                    )}
                    {response.additionalComments && (
                      <p>
                        <span className="text-muted-foreground">Other comments: </span>
                        {response.additionalComments}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
