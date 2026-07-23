"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParticipantListItem } from "@/features/participants/data";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CheckInBadge({ checkedIn }: { checkedIn: boolean }) {
  if (checkedIn) {
    return (
      <Badge variant="outline" className="border-transparent bg-emerald-500/15 text-emerald-400">
        Checked In
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
      Not Checked In
    </Badge>
  );
}

type Props = {
  participants: ParticipantListItem[];
};

export function ParticipantDirectory({ participants }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return participants;
    }

    return participants.filter((participant) => {
      const haystack = [
        participant.fullName,
        participant.company ?? "",
        participant.jobTitle ?? "",
        participant.experienceTitle ?? "",
        participant.clientName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [participants, search]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, company, job title, experience, or client..."
          className="h-11 pl-9 md:h-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {participants.length} participants
      </p>

      {filtered.length === 0 ? (
        <Card className="bg-surface-elevated">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No participants match your search.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface-elevated">
          <CardContent>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead className="text-right">Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((participant) => (
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
                      <TableCell className="text-muted-foreground">
                        {participant.clientName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <CheckInBadge checkedIn={participant.checkedIn} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDateTime(participant.registeredAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {filtered.map((participant) => (
                <li
                  key={participant.id}
                  className="rounded-lg border border-border-subtle bg-night/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ivory">{participant.fullName}</p>
                    <CheckInBadge checkedIn={participant.checkedIn} />
                  </div>
                  {(participant.company || participant.jobTitle) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[participant.company, participant.jobTitle].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {(participant.experienceTitle || participant.clientName) && (
                    <p className="text-sm text-muted-foreground">
                      {[participant.experienceTitle, participant.clientName].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Registered {formatDateTime(participant.registeredAt)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
