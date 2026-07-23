import { Badge } from "@/components/ui/badge";
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
import type { ParticipantSummary } from "@/infrastructure/repositories/dashboard";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  participants: ParticipantSummary[];
};

export function RecentParticipantsPanel({ participants }: Props) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Recent Participants</CardTitle>
        <CardDescription>The 10 most recently registered.</CardDescription>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No participants yet.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Checked In</TableHead>
                    <TableHead className="text-right">Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{participant.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {participant.company ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {participant.jobTitle ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {participant.experienceTitle ?? "—"}
                      </TableCell>
                      <TableCell>
                        {participant.checkedIn ? (
                          <Badge>Checked In</Badge>
                        ) : (
                          <Badge variant="secondary">Not Checked In</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDateTime(participant.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className="rounded-lg border border-border-subtle bg-night/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ivory">{participant.fullName}</p>
                    {participant.checkedIn ? (
                      <Badge>Checked In</Badge>
                    ) : (
                      <Badge variant="secondary">Not Checked In</Badge>
                    )}
                  </div>
                  {participant.company ? (
                    <p className="mt-1 text-sm text-muted-foreground">{participant.company}</p>
                  ) : null}
                  {participant.experienceTitle ? (
                    <p className="text-sm text-muted-foreground">{participant.experienceTitle}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
