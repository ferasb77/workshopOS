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
import { ExperienceStatusBadge } from "@/features/dashboard/components/experience-status-badge";
import type { ExperienceSummary } from "@/infrastructure/repositories/dashboard";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  experiences: ExperienceSummary[];
  title?: string;
  description?: string;
};

export function RecentExperiencesPanel({
  experiences,
  title = "Recent Experiences",
  description = "Ordered by start date, most recent first.",
}: Props) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {experiences.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No experiences yet.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Experience</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Checked In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiences.map((experience) => (
                    <TableRow key={experience.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/experiences/${experience.slug}`} className="hover:text-gold">
                          {experience.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {experience.clientName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {experience.engagementTitle ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {experience.venue ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(experience.startDate)} – {formatDate(experience.endDate)}
                      </TableCell>
                      <TableCell>
                        <ExperienceStatusBadge status={experience.status} />
                      </TableCell>
                      <TableCell className="text-right">{experience.participantCount}</TableCell>
                      <TableCell className="text-right">{experience.checkedInCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {experiences.map((experience) => (
                <li key={experience.id}>
                  <Link
                    href={`/dashboard/experiences/${experience.slug}`}
                    className="block rounded-lg border border-border-subtle bg-night/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ivory">{experience.title}</p>
                      <ExperienceStatusBadge status={experience.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(experience.startDate)} – {formatDate(experience.endDate)}
                    </p>
                    {(experience.clientName || experience.engagementTitle) && (
                      <p className="text-sm text-muted-foreground">
                        {[experience.clientName, experience.engagementTitle].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {experience.venue ? (
                      <p className="text-sm text-muted-foreground">{experience.venue}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {experience.participantCount} participants · {experience.checkedInCount} checked in
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
