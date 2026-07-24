"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SurveyTemplateSummary } from "@/features/surveys/data";

import { assignExperienceSurveyTemplate } from "../actions";

const ORG_DEFAULT_VALUE = "org-default";

type Props = {
  experienceId: string;
  experienceSlug: string;
  templates: SurveyTemplateSummary[];
  activeSource: "override" | "default" | "none";
  activeTemplateName: string | null;
  overrideTemplateId: string | null;
};

export function SurveyTemplateSelector({
  experienceId,
  experienceSlug,
  templates,
  activeSource,
  activeTemplateName,
  overrideTemplateId,
}: Props) {
  const orgDefault = templates.find((template) => template.isDefault) ?? null;
  const [selected, setSelected] = useState(
    activeSource === "override" && overrideTemplateId ? overrideTemplateId : ORG_DEFAULT_VALUE
  );

  const orgDefaultLabel = `Use organization default${orgDefault ? ` (${orgDefault.name})` : ""}`;
  const selectItems = [
    { value: ORG_DEFAULT_VALUE, label: orgDefaultLabel },
    ...templates.map((template) => ({ value: template.id, label: template.name })),
  ];
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setStatus("idle");
    setError(null);

    startTransition(async () => {
      const result = await assignExperienceSurveyTemplate(
        experienceId,
        experienceSlug,
        selected === ORG_DEFAULT_VALUE ? null : selected
      );

      if (result.success) {
        setStatus("saved");
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Survey Template</CardTitle>
        <CardDescription>Which survey participants of this experience receive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Select value={selected} onValueChange={(value) => value && setSelected(value)} items={selectItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ORG_DEFAULT_VALUE}>{orgDefaultLabel}</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          {status === "saved" && !isPending && <p className="text-sm text-emerald-400">Saved.</p>}
        </div>

        {status === "error" && error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-sm text-muted-foreground">
          Currently active:{" "}
          <span className="text-ivory">
            {activeTemplateName ?? "Legacy 4-dimension survey (no template configured)"}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
