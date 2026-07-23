import { AlertTriangle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SurveyDimensionAverages, SurveyResponseSummary } from "@/features/workshops/data";

import { SendAllSurveysButton } from "./send-all-surveys-button";

const LOW_SCORE_THRESHOLD = 3.5;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AverageBar({ label, value }: { label: string; value: number | null }) {
  const percent = value ? (value / 5) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-lg font-semibold text-gold">
          {value !== null ? value.toFixed(1) : "—"}
        </p>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-night/60">
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

type Props = {
  workshopId: string;
  workshopSlug: string;
  workshopTitle: string;
  participantsCount: number;
  unsentCount: number;
  averages: SurveyDimensionAverages;
  responses: SurveyResponseSummary[];
};

export function SurveyResultsPanel({
  workshopId,
  workshopSlug,
  workshopTitle,
  participantsCount,
  unsentCount,
  averages,
  responses,
}: Props) {
  if (responses.length === 0) {
    return (
      <Card className="bg-surface-elevated">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-ivory">No survey responses yet.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Send the survey to participants to start collecting feedback on this workshop.
          </p>
          <SendAllSurveysButton
            workshopId={workshopId}
            workshopSlug={workshopSlug}
            workshopTitle={workshopTitle}
            unsentCount={unsentCount}
          />
        </CardContent>
      </Card>
    );
  }

  const isLowScore = averages.overall !== null && averages.overall < LOW_SCORE_THRESHOLD;

  return (
    <div className="space-y-6">
      {isLowScore && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            This workshop scored below the quality threshold. Consider following up with the
            client.
          </p>
        </div>
      )}

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Survey Results</CardTitle>
          <CardDescription>
            {responses.length} of {participantsCount} participants responded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Overall Average</p>
            <p className="font-heading text-5xl font-semibold text-gold">
              {averages.overall !== null ? averages.overall.toFixed(1) : "—"}
              <span className="text-lg font-normal text-muted-foreground">/5</span>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AverageBar label="Content Quality" value={averages.content} />
            <AverageBar label="Facilitator Delivery" value={averages.facilitator} />
            <AverageBar label="Logistics & Organisation" value={averages.logistics} />
            <AverageBar label="Overall Experience" value={averages.overall} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Individual Responses</CardTitle>
          <CardDescription>
            {responses.length} response{responses.length === 1 ? "" : "s"} received.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6">
            {responses.map((response) => (
              <li key={response.id} className="rounded-lg border border-border-subtle p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ivory">{response.participantFirstName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(response.submittedAt)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
                  <p>
                    Content: <span className="text-gold">{response.contentRating}/5</span>
                  </p>
                  <p>
                    Facilitator: <span className="text-gold">{response.facilitatorRating}/5</span>
                  </p>
                  <p>
                    Logistics: <span className="text-gold">{response.logisticsRating}/5</span>
                  </p>
                  <p>
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
    </div>
  );
}
