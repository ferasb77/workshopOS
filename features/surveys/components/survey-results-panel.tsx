import { AlertTriangle, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SurveyDimensionAverages, SurveyResponseSummary } from "@/features/experiences/data";

import { SendAllSurveysButton } from "./send-all-surveys-button";

const LOW_SCORE_THRESHOLD = 3.5;
const HIGH_SCORE_THRESHOLD = 4.5;
const DISTRIBUTION_SCORES = [5, 4, 3, 2, 1] as const;

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

function ResponseRateBar({ responded, total }: { responded: number; total: number }) {
  const percent = total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <Card className="bg-surface-elevated">
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">
            {responded} of {total} participants responded
          </p>
          <p className="font-heading text-sm font-semibold text-gold">{percent}%</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-night/60">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreDistribution({ responses }: { responses: SurveyResponseSummary[] }) {
  const counts = DISTRIBUTION_SCORES.map((score) => ({
    score,
    count: responses.filter((response) => response.overallRating === score).length,
  }));
  const maxCount = Math.max(...counts.map((row) => row.count), 1);

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Overall Score Distribution</CardTitle>
        <CardDescription>How many participants gave each overall rating.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {counts.map((row) => (
          <div key={row.score} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-sm text-muted-foreground">{row.score} ★</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-night/60">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${(row.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm text-muted-foreground">{row.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ThresholdBanner({ overall }: { overall: number | null }) {
  if (overall === null) {
    return null;
  }

  if (overall < LOW_SCORE_THRESHOLD) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>Below quality threshold — consider following up with the client and facilitator.</p>
      </div>
    );
  }

  if (overall >= HIGH_SCORE_THRESHOLD) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <p>Excellent rating — consider requesting a testimonial from the client.</p>
      </div>
    );
  }

  return null;
}

type Props = {
  experienceId: string;
  experienceSlug: string;
  experienceTitle: string;
  participantsCount: number;
  unsentCount: number;
  averages: SurveyDimensionAverages;
  responses: SurveyResponseSummary[];
};

export function SurveyResultsPanel({
  experienceId,
  experienceSlug,
  experienceTitle,
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
            Send the survey to participants to start collecting feedback on this experience.
          </p>
          <SendAllSurveysButton
            experienceId={experienceId}
            experienceSlug={experienceSlug}
            experienceTitle={experienceTitle}
            unsentCount={unsentCount}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ResponseRateBar responded={responses.length} total={participantsCount} />

      <ThresholdBanner overall={averages.overall} />

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

      <ScoreDistribution responses={responses} />

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
