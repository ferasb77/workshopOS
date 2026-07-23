import Link from "next/link";
import { Building2, Globe, Mail, Phone, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EngagementCard } from "@/features/engagements/components/engagement-card";
import type { EngagementSummary } from "@/features/engagements/data";
import type { ClientDetailRecord, ClientRelationshipHistory } from "@/features/clients/data";

import { CLIENT_TYPE_LABELS } from "../schema";

type Props = {
  client: ClientDetailRecord;
  engagements: EngagementSummary[];
  history: ClientRelationshipHistory;
};

export function ClientDetail({ client, engagements, history }: Props) {
  return (
    <div className="space-y-6">
      <Card className="bg-surface-elevated">
        <CardContent className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <Badge variant="secondary">{CLIENT_TYPE_LABELS[client.type]}</Badge>
                {!client.isActive && (
                  <Badge variant="outline" className="border-destructive/30 text-destructive">
                    Inactive
                  </Badge>
                )}
              </div>
              {client.industry && <p className="mt-1 text-muted-foreground">{client.industry}</p>}
              <p className="text-sm text-muted-foreground">
                {[client.city, client.country].filter(Boolean).join(", ") || "—"}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {client.primaryContactName && <span>{client.primaryContactName}</span>}
                {client.primaryContactEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {client.primaryContactEmail}
                  </span>
                )}
                {client.primaryContactPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {client.primaryContactPhone}
                  </span>
                )}
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gold"
                  >
                    <Globe className="size-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href={`/dashboard/clients/${client.id}/edit`} />}
          >
            Edit
          </Button>
        </CardContent>
      </Card>

      {client.notes && (
        <Card className="bg-surface-elevated">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ivory">{client.notes}</CardContent>
        </Card>
      )}

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Relationship History</CardTitle>
          <CardDescription>Delivery record across all engagements with this client.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
            <p className="text-sm text-muted-foreground">Experiences Delivered</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-gold">{history.totalExperiences}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
            <p className="text-sm text-muted-foreground">Total Participants</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-gold">{history.totalParticipants}</p>
          </div>
          <div className="col-span-2 rounded-lg border border-border-subtle bg-night/40 p-4 lg:col-span-1">
            <p className="text-sm text-muted-foreground">Average Satisfaction</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-gold">
              {history.averageSatisfaction !== null ? `${history.averageSatisfaction.toFixed(1)}/5` : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Engagements</CardTitle>
            <CardDescription>
              {engagements.length} engagement{engagements.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/dashboard/clients/${client.id}/engagements/new`} />}
          >
            <Plus className="size-4" />
            New Engagement
          </Button>
        </CardHeader>
        <CardContent>
          {engagements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No engagements yet for this client.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {engagements.map((engagement) => (
                <EngagementCard key={engagement.id} engagement={engagement} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
