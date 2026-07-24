"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CertificateTemplateType } from "@/features/certificates/schema";

import { setCertificateTemplateType } from "../actions";

type Props = {
  templateId: string;
  currentType: CertificateTemplateType;
};

const OPTIONS: { value: CertificateTemplateType; label: string }[] = [
  { value: "generated", label: "Generated" },
  { value: "uploaded", label: "Uploaded PDF" },
];

export function TemplateTypeToggle({ templateId, currentType }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(type: CertificateTemplateType) {
    if (type === currentType) {
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await setCertificateTemplateType(templateId, type);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-lg border border-border-subtle bg-night/40 p-1">
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "rounded-md",
              currentType === option.value ? "bg-gold text-night hover:bg-gold/90" : "text-muted-foreground"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
