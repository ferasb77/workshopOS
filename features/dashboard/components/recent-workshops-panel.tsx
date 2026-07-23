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
        )}
      </CardContent>
    </Card>
  );
}
