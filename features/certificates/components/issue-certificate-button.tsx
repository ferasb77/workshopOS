"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { issueCertificate } from "../actions";

type Props = {
  participantId: string;
  experienceId: string;
  eligible: boolean;
};

export function IssueCertificateButton({ participantId, experienceId, eligible }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await issueCertificate(participantId, experienceId);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="secondary" size="sm" disabled={!eligible || isPending} onClick={handleClick}>
        {isPending ? "Issuing..." : "Issue Certificate"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
