import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EngagementDetailRecord, EngagementExperience } from "@/features/engagements/data";

import { ENGAGEMENT_TYPE_LABELS } from "../schema";

function formatCurrency(value: number | null, currency: string): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    value
  );
}

// Engagements carry plain `date` columns (no time component) — appending a
// local midnight time avoids `new Date()` reinterpreting the bare date in
// UTC and shifting it a day in negative-offset timezones.
function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Experiences carry `timestamptz` columns — already a full ISO datetime, so
// parsing it directly (no appended time) is correct here; doing the same
// "T00:00:00" trick as formatDate() above would double up the time portion
// and produce an Invalid Date.
function formatExperienceDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLE: Record<string, string> = {
  draft: "border-transparent bg-muted text-muted-foreground",
  active: "border-transparent bg-emerald-500/15 text-emerald-400",
  completed: "border-transparent bg-muted text-muted-foreground",
  cancelled: "border-destructive/30 text-destructive",
};

type Props = {
  engagement: EngagementDetailRecord;
  experiences: EngagementExperience[];
};

export function EngagementDetail({ engagement, experiences }: Props) {
  const completedCount = experiences.filter((e) => e.status === "completed").length;
  const totalParticipants = experiences.reduce((sum, e) => sum + e.participantCount, 0);

  return (
    <div className="space-y-6">
      <Card className="bg-surface-elevated">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{engagement.title}</CardTitle>
            <Badge variant="outline" className={STATUS_STYLE[engagement.status]}>
              {engagement.status[0].toUpperCase() + engagement.status.slice(1)}
            </Badge>
          </div>
          <CardDescription>{ENGAGEMENT_TYPE_LABELS[engagement.type]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {engagement.description && <p className="text-sm text-ivory">{engagement.description}</p>}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
              <p className="text-sm text-muted-foreground">Contract Value</p>
              <p className="mt-1 font-heading text-xl font-semibold text-gold">
                {formatCurrency(engagement.contractValue, engagement.currency)}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
              <p className="text-sm text-muted-foreground">Timeline</p>
              <p className="mt-1 text-sm text-ivory">
                {formatDate(engagement.startDate)} – {formatDate(engagement.endDate)}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="mt-1 font-heading text-xl font-semibold text-gold">
                {completedCount} of {experiences.length} delivered
              </p>
            </div>
          </div>

          {engagement.notes && (
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Notes</p>
              <p className="text-sm text-ivory">{engagement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Experiences</CardTitle>
            <CardDescription>
              {experiences.length} experience{experiences.length === 1 ? "" : "s"} ·{" "}
              {totalParticipants} total participants
            </CardDescription>
          </div>
          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/dashboard/experiences/new?engagementId=${engagement.id}&clientId=${engagement.clientId}`}
              />
            }
          >
            <Plus className="size-4" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent>
          {experiences.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No experiences linked to this engagement yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {experiences.map((experience) => (
                <li key={experience.id}>
                  <Link
                    href={`/dashboard/experiences/${experience.slug}`}
                    className="block rounded-lg border border-border-subtle bg-night/40 p-3 transition-colors hover:border-gold/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-ivory">{experience.title}</p>
                      <Badge variant="outline" className={STATUS_STYLE[experience.status]}>
                        {experience.status[0].toUpperCase() + experience.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatExperienceDate(experience.startDate)} – {formatExperienceDate(experience.endDate)} ·{" "}
                      {experience.participantCount} participants
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
