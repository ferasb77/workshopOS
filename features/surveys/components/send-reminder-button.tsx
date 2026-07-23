"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { sendSurveyReminder } from "../actions";

type Props = {
  tokenId: string;
};

export function SendReminderButton({ tokenId }: Props) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await sendSurveyReminder(tokenId);

      if (result.success) {
        setStatus("sent");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Sending..." : status === "sent" ? "Reminder sent" : "Send Reminder"}
      </Button>
      {status === "error" && error && (
        <p className="max-w-40 text-right text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
