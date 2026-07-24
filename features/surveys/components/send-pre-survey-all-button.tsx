"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { sendPreTrainingSurveyToAll, type SendSurveyResult } from "../actions";

type Props = {
  experienceId: string;
  experienceSlug: string;
};

export function SendPreSurveyAllButton({ experienceId, experienceSlug }: Props) {
  const [result, setResult] = useState<SendSurveyResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const outcome = await sendPreTrainingSurveyToAll(experienceId, experienceSlug);
      setResult(outcome);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" disabled={isPending} onClick={handleClick}>
        {isPending ? "Sending..." : "Send Pre-Survey to all"}
      </Button>
      {result?.success && result.sent > 0 && (
        <p className="text-xs text-muted-foreground">
          Sent to {result.sent} participant{result.sent === 1 ? "" : "s"}.
        </p>
      )}
      {result?.success && result.failed > 0 && <p className="text-xs text-destructive">{result.failed} failed to send.</p>}
      {result && !result.success && <p className="text-xs text-destructive">{result.error}</p>}
    </div>
  );
}
