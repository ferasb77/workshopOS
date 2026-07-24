"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { issueAllEligible } from "../actions";

type Props = {
  experienceId: string;
  eligibleUnissuedCount: number;
};

export function IssueAllEligibleButton({ experienceId, eligibleUnissuedCount }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setMessage(null);

    startTransition(async () => {
      const result = await issueAllEligible(experienceId);

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      const parts = [`Issued ${result.issued} certificate${result.issued === 1 ? "" : "s"}.`];
      if (result.failed > 0) {
        parts.push(`${result.failed} failed.`);
      }
      setMessage(parts.join(" "));
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" disabled={eligibleUnissuedCount === 0 || isPending} onClick={handleClick}>
        {isPending ? "Issuing..." : `Issue All Eligible (${eligibleUnissuedCount})`}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
