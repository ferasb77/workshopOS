import Link from "next/link";

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
import { WorkshopStatusBadge } from "@/features/dashboard/components/workshop-status-badge";
import type { WorkshopSummary } from "@/infrastructure/repositories/dashboard";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  workshops: WorkshopSummary[];
  title?: string;
  description?: string;
};

export function RecentWorkshopsPanel({
  workshops,
  title = "Recent Workshops",
  description = "Ordered by start date, most recent first.",
}: Props) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {workshops.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No workshops yet.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workshop</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Checked In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/workshops/${workshop.slug}`} className="hover:text-gold">
                          {workshop.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {workshop.venue ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(workshop.startDate)} – {formatDate(workshop.endDate)}
                      </TableCell>
                      <TableCell>
                        <WorkshopStatusBadge status={workshop.status} />
                      </TableCell>
                      <TableCell className="text-right">{workshop.participantCount}</TableCell>
                      <TableCell className="text-right">{workshop.checkedInCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {workshops.map((workshop) => (
                <li key={workshop.id}>
                  <Link
                    href={`/dashboard/workshops/${workshop.slug}`}
                    className="block rounded-lg border border-border-subtle bg-night/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ivory">{workshop.title}</p>
                      <WorkshopStatusBadge status={workshop.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(workshop.startDate)} – {formatDate(workshop.endDate)}
                    </p>
                    {workshop.venue ? (
                      <p className="text-sm text-muted-foreground">{workshop.venue}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {workshop.participantCount} participants · {workshop.checkedInCount} checked in
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
