import { Sparkles, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomSurveyResults, QuestionResult } from "@/features/surveys/data";

function YesNoQuestionCard({ result }: { result: Extract<QuestionResult, { kind: "rating" }> }) {
  const yesCount = result.distribution.find((entry) => entry.value === 1)?.count ?? 0;
  const noCount = result.distribution.find((entry) => entry.value === 0)?.count ?? 0;
  const total = yesCount + noCount;
  const yesPercent = total > 0 ? Math.round((yesCount / total) * 100) : 0;

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle className="text-base">{result.questionText}</CardTitle>
        <CardDescription>{result.responseCount} response{result.responseCount === 1 ? "" : "s"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-xs text-muted-foreground">Yes</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-night/60">
            <div className="h-full rounded-full bg-gold" style={{ width: `${yesPercent}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
            {yesCount} ({yesPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-xs text-muted-foreground">No</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-night/60">
            <div className="h-full rounded-full bg-gold" style={{ width: `${100 - yesPercent}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
            {noCount} ({total > 0 ? 100 - yesPercent : 0}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingQuestionCard({ result }: { result: Extract<QuestionResult, { kind: "rating" }> }) {
  const maxCount = Math.max(...result.distribution.map((entry) => entry.count), 1);
  const scale = result.questionType === "rating_5" ? 5 : 10;

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle className="text-base">{result.questionText}</CardTitle>
        <CardDescription>{result.responseCount} response{result.responseCount === 1 ? "" : "s"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="font-heading text-3xl font-semibold text-gold">
              {result.average !== null ? result.average.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.questionType === "nps" ? "avg score" : `out of ${scale}`}
            </p>
          </div>
          {result.questionType === "nps" && result.npsScore !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-night/40 px-4 py-2">
              <TrendingUp className="size-4 text-gold" />
              <div>
                <p className="font-heading text-xl font-semibold text-ivory">{result.npsScore}</p>
                <p className="text-xs text-muted-foreground">NPS score</p>
              </div>
            </div>
          )}
        </div>

        {result.distribution.length > 0 && (
          <div className="space-y-1.5">
            {result.distribution.map((entry) => (
              <div key={entry.value} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{entry.value}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-night/60">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{entry.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChoiceQuestionCard({ result }: { result: Extract<QuestionResult, { kind: "choice" }> }) {
  const total = result.optionCounts.reduce((sum, entry) => sum + entry.count, 0);
  const maxCount = Math.max(...result.optionCounts.map((entry) => entry.count), 1);

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle className="text-base">{result.questionText}</CardTitle>
        <CardDescription>{result.responseCount} response{result.responseCount === 1 ? "" : "s"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {result.optionCounts.map((entry) => (
          <div key={entry.option} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm text-ivory" title={entry.option}>
              {entry.option}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-night/60">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(entry.count / maxCount) * 100}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
              {entry.count} ({total > 0 ? Math.round((entry.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TextQuestionCard({ result }: { result: Extract<QuestionResult, { kind: "text" }> }) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle className="text-base">{result.questionText}</CardTitle>
        <CardDescription>{result.responses.length} response{result.responses.length === 1 ? "" : "s"}</CardDescription>
      </CardHeader>
      <CardContent>
        {result.responses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No responses yet.</p>
        ) : (
          <ul className="space-y-3">
            {result.responses.map((text, index) => (
              <li key={index} className="rounded-lg border border-border-subtle bg-night/40 p-3 text-sm text-ivory">
                {text}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type Props = {
  results: CustomSurveyResults;
};

export function CustomSurveyResultsPanel({ results }: Props) {
  if (results.totalResponses === 0) {
    return (
      <Card className="bg-surface-elevated">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Sparkles className="size-8 text-muted-foreground" />
          <p className="text-ivory">No responses yet for &ldquo;{results.templateName}&rdquo;.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Results will appear here as participants complete this survey.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border-subtle bg-night/40 px-4 py-3 text-sm text-muted-foreground">
        {results.templateName} · {results.totalResponses} response{results.totalResponses === 1 ? "" : "s"}
      </div>

      {results.questionResults.map((result) => {
        if (result.kind === "rating" && result.questionType === "yes_no") {
          return <YesNoQuestionCard key={result.questionId} result={result} />;
        }
        if (result.kind === "rating") {
          return <RatingQuestionCard key={result.questionId} result={result} />;
        }
        if (result.kind === "choice") {
          return <ChoiceQuestionCard key={result.questionId} result={result} />;
        }
        return <TextQuestionCard key={result.questionId} result={result} />;
      })}
    </div>
  );
}
