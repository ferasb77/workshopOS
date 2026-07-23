import Link from "next/link";
import { Star } from "lucide-react";

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
import type { FacilitatorDeliveryHistory } from "@/features/facilitators/data";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  history: FacilitatorDeliveryHistory;
};

export function DeliveryHistoryPanel({ history }: Props) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Delivery History</CardTitle>
        <CardDescription>Workshops delivered, pulled live from workshop records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
            <p className="text-sm text-muted-foreground">Total Workshops Delivered</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-gold">
              {history.totalWorkshops}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
            <p className="text-sm text-muted-foreground">Average Satisfaction</p>
            <p className="mt-1 flex items-center gap-1.5 font-heading text-2xl font-semibold text-gold">
              {history.averageSatisfaction !== null ? (
                <>
                  <Star className="size-5 fill-gold" />
                  {history.averageSatisfaction.toFixed(1)}/5
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        {history.workshops.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No delivery history yet.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workshop</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.workshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/workshops/${workshop.slug}`}
                          className="hover:text-gold"
                        >
                          {workshop.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(workshop.startDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{workshop.venue ?? "—"}</TableCell>
                      <TableCell className="text-right">{workshop.participantCount}</TableCell>
                      <TableCell className="text-right">
                        {workshop.satisfactionScore !== null ? (
                          <span className="text-gold">{workshop.satisfactionScore.toFixed(1)}/5</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {history.workshops.map((workshop) => (
                <li key={workshop.id}>
                  <Link
                    href={`/dashboard/workshops/${workshop.slug}`}
                    className="block rounded-lg border border-border-subtle bg-night/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ivory">{workshop.title}</p>
                      {workshop.satisfactionScore !== null ? (
                        <span className="flex shrink-0 items-center gap-1 text-sm text-gold">
                          <Star className="size-3.5 fill-gold" />
                          {workshop.satisfactionScore.toFixed(1)}/5
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(workshop.startDate)}
                      {workshop.venue ? ` · ${workshop.venue}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {workshop.participantCount} participants
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
