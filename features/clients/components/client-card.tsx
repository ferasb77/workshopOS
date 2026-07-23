import Link from "next/link";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ClientSummary } from "@/features/clients/data";

import { CLIENT_TYPE_LABELS } from "../schema";

type Props = {
  client: ClientSummary;
};

export function ClientCard({ client }: Props) {
  return (
    <Link href={`/dashboard/clients/${client.id}`} className="block h-full">
      <Card className="h-full bg-surface-elevated transition-colors hover:border-gold/40 hover:ring-1 hover:ring-gold/20">
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ivory">{client.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {[client.city, client.country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {CLIENT_TYPE_LABELS[client.type]}
            </Badge>
            {client.industry && (
              <Badge variant="outline" className="text-xs">
                {client.industry}
              </Badge>
            )}
            {!client.isActive && (
              <Badge variant="outline" className="border-destructive/30 text-xs text-destructive">
                Inactive
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-3 text-sm">
            <span className="text-muted-foreground">
              {client.engagementCount} engagement{client.engagementCount === 1 ? "" : "s"}
            </span>
            <span className="text-gold">
              {client.activeEngagementCount} active
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
