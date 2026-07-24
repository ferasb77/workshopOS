"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { IndividualComparisonRow, PrePostComparisonData } from "@/features/surveys/data";
import { PrePostStatusBadge } from "./pre-post-status-badge";

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400">
        <TrendingUp className="size-4" />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <TrendingDown className="size-4" />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="size-4" />0
    </span>
  );
}

function AggregateComparisonPanel({ data }: { data: PrePostComparisonData }) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Aggregate Comparison</CardTitle>
        <CardDescription>
          Questions matched between {data.preTemplateName} and {data.postTemplateName} by question text.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.matchedQuestions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No matching rating questions found between the two templates yet.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Pre-Training</TableHead>
                    <TableHead>Post-Training</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.matchedQuestions.map((question) => (
                    <TableRow key={question.preQuestionId}>
                      <TableCell className="max-w-xs font-medium">{question.questionText}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {question.preAverage !== null ? question.preAverage.toFixed(1) : "—"}
                        <span className="ml-1 text-xs">({question.preResponseCount})</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {question.postAverage !== null ? question.postAverage.toFixed(1) : "—"}
                        <span className="ml-1 text-xs">({question.postResponseCount})</span>
                      </TableCell>
                      <TableCell>
                        <DeltaIndicator delta={question.delta} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {data.matchedQuestions.map((question) => (
                <li key={question.preQuestionId} className="rounded-lg border border-border-subtle bg-night/40 p-3">
                  <p className="text-sm font-medium text-ivory">{question.questionText}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {question.preAverage !== null ? question.preAverage.toFixed(1) : "—"} →{" "}
                      {question.postAverage !== null ? question.postAverage.toFixed(1) : "—"}
                    </span>
                    <DeltaIndicator delta={question.delta} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {data.nps && (
          <div className="mt-6 rounded-lg border border-border-subtle bg-night/40 p-4">
            <p className="text-sm font-medium text-ivory">Net Promoter Score</p>
            <div className="mt-2 flex items-center gap-4">
              <span className="font-heading text-2xl font-semibold text-gold">
                {data.nps.preScore ?? "—"} → {data.nps.postScore ?? "—"}
              </span>
              <DeltaIndicator delta={data.nps.delta} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnswerCell({ answer, questionType }: { answer: IndividualComparisonRow["answers"][number]["preAnswer"]; questionType: string }) {
  if (!answer) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (questionType === "open_text") {
    return <span className="text-ivory">{answer.text ?? "—"}</span>;
  }
  return <span className="text-ivory">{answer.numeric ?? "—"}</span>;
}

function IndividualRow({ row }: { row: IndividualComparisonRow }) {
  const [expanded, setExpanded] = useState(false);
  const hasAnswers = row.preStatus === "completed" || row.postStatus === "completed";

  return (
    <>
      <TableRow
        className={hasAnswers ? "cursor-pointer" : undefined}
        onClick={() => hasAnswers && setExpanded((prev) => !prev)}
      >
        <TableCell className="font-medium">
          <span className="inline-flex items-center gap-1.5">
            {hasAnswers &&
              (expanded ? (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              ))}
            {row.fullName}
          </span>
        </TableCell>
        <TableCell>
          <PrePostStatusBadge status={row.preStatus} />
        </TableCell>
        <TableCell>
          <PrePostStatusBadge status={row.postStatus} />
        </TableCell>
      </TableRow>
      {expanded && hasAnswers && (
        <TableRow>
          <TableCell colSpan={3} className="bg-night/30">
            <div className="space-y-3 py-2">
              {row.answers.map((answer) => (
                <div key={answer.questionText} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <p className="text-sm text-muted-foreground sm:col-span-3">{answer.questionText}</p>
                  <div className="text-sm">
                    <span className="mr-1 text-xs text-muted-foreground">Before:</span>
                    <AnswerCell answer={answer.preAnswer} questionType={answer.questionType} />
                  </div>
                  <div className="hidden items-center justify-center text-muted-foreground sm:flex">→</div>
                  <div className="text-sm">
                    <span className="mr-1 text-xs text-muted-foreground">After:</span>
                    <AnswerCell answer={answer.postAnswer} questionType={answer.questionType} />
                  </div>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function IndividualComparisonPanel({ rows }: { rows: IndividualComparisonRow[] }) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Individual Comparison</CardTitle>
        <CardDescription>Expand a participant to see their before/after answers side by side.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No participants yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pre-Survey</TableHead>
                <TableHead>Post-Survey</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <IndividualRow key={row.participantId} row={row} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ResponseRateSummary({ data }: { data: PrePostComparisonData }) {
  const prePercent =
    data.responseRates.pre.totalParticipants > 0
      ? Math.round((data.responseRates.pre.completed / data.responseRates.pre.totalParticipants) * 100)
      : 0;
  const postPercent =
    data.responseRates.post.totalParticipants > 0
      ? Math.round((data.responseRates.post.completed / data.responseRates.post.totalParticipants) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
        <p className="text-sm text-muted-foreground">Pre-Survey</p>
        <p className="mt-1 font-heading text-xl font-semibold text-ivory">
          {data.responseRates.pre.sent} of {data.responseRates.pre.totalParticipants} sent,{" "}
          {data.responseRates.pre.completed} completed
          <span className="ml-1 text-gold">({prePercent}%)</span>
        </p>
      </div>
      <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
        <p className="text-sm text-muted-foreground">Post-Survey</p>
        <p className="mt-1 font-heading text-xl font-semibold text-ivory">
          {data.responseRates.post.sent} of {data.responseRates.post.totalParticipants} sent,{" "}
          {data.responseRates.post.completed} completed
          <span className="ml-1 text-gold">({postPercent}%)</span>
        </p>
      </div>
    </div>
  );
}

type Props = {
  data: PrePostComparisonData;
  experienceSlug: string;
};

export function LearningImpactTab({ data, experienceSlug }: Props) {
  if (!data.configured) {
    return (
      <Card className="bg-surface-elevated">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-lg font-medium text-ivory">Pre/post surveys aren&apos;t set up yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Configure a pre-training and a post-training survey in the Surveys tab to see how participants&apos;
            knowledge and confidence changed.
          </p>
          <a
            href={`/dashboard/experiences/${experienceSlug}?tab=surveys`}
            className={cn("mt-2 text-sm text-gold hover:underline")}
          >
            Go to Surveys tab
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ResponseRateSummary data={data} />
      <AggregateComparisonPanel data={data} />
      <IndividualComparisonPanel rows={data.individualRows} />
    </div>
  );
}
