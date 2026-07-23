"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SurveyParticipantRow } from "@/features/surveys/data";

import { flagSurveyResponse } from "../actions";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DimensionScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-night/40 p-4 text-center">
      <p className="font-heading text-3xl font-semibold text-gold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

type Props = {
  row: SurveyParticipantRow;
};

export function SurveyResponseModal({ row }: Props) {
  const [open, setOpen] = useState(false);
  const [flagged, setFlagged] = useState(row.response?.flagged ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const response = row.response;
  if (!response) {
    return null;
  }

  function handleToggleFlag() {
    const next = !flagged;
    setFlagged(next);
    setError(null);

    startTransition(async () => {
      const result = await flagSurveyResponse(response!.id, next);
      if (!result.success) {
        setFlagged(!next);
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        View Response
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {row.fullName}
              {flagged && <Flag className="size-4 fill-destructive text-destructive" />}
            </DialogTitle>
            <DialogDescription>
              {row.company ?? "—"} · Submitted {formatDateTime(response.submittedAt)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DimensionScore label="Content" value={response.contentRating} />
            <DimensionScore label="Facilitator" value={response.facilitatorRating} />
            <DimensionScore label="Logistics" value={response.logisticsRating} />
            <DimensionScore label="Overall" value={response.overallRating} />
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1 font-medium text-ivory">Most valuable</p>
              <p className="text-muted-foreground">{response.highlights || "—"}</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-ivory">Could improve</p>
              <p className="text-muted-foreground">{response.improvements || "—"}</p>
            </div>
            {response.additionalComments && (
              <div>
                <p className="mb-1 font-medium text-ivory">Other comments</p>
                <p className="text-muted-foreground">{response.additionalComments}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flag className="size-3.5" />
              Flag this response for follow-up
            </div>
            <Button
              type="button"
              variant={flagged ? "destructive" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={handleToggleFlag}
            >
              <Flag className="size-4" />
              {flagged ? "Flagged" : "Flag for follow-up"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
