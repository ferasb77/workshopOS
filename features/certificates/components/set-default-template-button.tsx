"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { setDefaultTemplate } from "../actions";

type Props = {
  templateId: string;
  workspaceId: string;
};

export function SetDefaultTemplateButton({ templateId, workspaceId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await setDefaultTemplate(templateId, workspaceId);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Setting..." : "Set as Default"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
