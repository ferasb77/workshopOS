"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { emailCertificate } from "../actions";

type Props = {
  certificateId: string;
  alreadyEmailed: boolean;
};

export function EmailCertificateButton({ certificateId, alreadyEmailed }: Props) {
  const [sent, setSent] = useState(alreadyEmailed);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await emailCertificate(certificateId);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Sending..." : sent ? "Resend Email" : "Email Certificate"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
