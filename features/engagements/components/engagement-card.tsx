import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EngagementSummary } from "@/features/engagements/data";

import { ENGAGEMENT_TYPE_LABELS } from "../schema";

function formatCurrency(value: number | null, currency: string): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    value
  );
}

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

const STATUS_STYLE: Record<EngagementSummary["status"], string> = {
  draft: "border-transparent bg-muted text-muted-foreground",
  active: "border-transparent bg-emerald-500/15 text-emerald-400",
  completed: "border-transparent bg-muted text-muted-foreground",
  cancelled: "border-destructive/30 text-destructive",
};

type Props = {
  engagement: EngagementSummary;
};

export function EngagementCard({ engagement }: Props) {
  return (
    <Link
      href={`/dashboard/clients/${engagement.clientId}/engagements/${engagement.id}`}
      className="block"
    >
      <Card className="bg-surface-elevated transition-colors hover:border-gold/40 hover:ring-1 hover:ring-gold/20">
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-medium text-ivory">{engagement.title}</p>
            <Badge variant="outline" className={STATUS_STYLE[engagement.status]}>
              {engagement.status[0].toUpperCase() + engagement.status.slice(1)}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{ENGAGEMENT_TYPE_LABELS[engagement.type]}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {formatDate(engagement.startDate)} – {formatDate(engagement.endDate)}
            </span>
            <span className="text-gold">{formatCurrency(engagement.contractValue, engagement.currency)}</span>
          </div>

          <p className="text-sm text-muted-foreground">
            {engagement.experienceCount} experience{engagement.experienceCount === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
