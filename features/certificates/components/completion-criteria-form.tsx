"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CertificateTemplate, CompletionCriteria } from "@/features/certificates/data";

import { saveCompletionCriteria } from "../actions";

type Props = {
  experienceId: string;
  criteria: CompletionCriteria;
  templates: CertificateTemplate[];
};

export function CompletionCriteriaForm({ experienceId, criteria, templates }: Props) {
  const [requireAttendance, setRequireAttendance] = useState(criteria.requireAttendance);
  const [requireSurveyCompletion, setRequireSurveyCompletion] = useState(criteria.requireSurveyCompletion);
  const [minimumAttendancePercentage, setMinimumAttendancePercentage] = useState(
    String(criteria.minimumAttendancePercentage)
  );
  const [certificateTemplateId, setCertificateTemplateId] = useState(criteria.certificateTemplateId ?? "");
  const [autoIssue, setAutoIssue] = useState(criteria.autoIssue);

  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setStatus("idle");
    setError(null);

    startTransition(async () => {
      const result = await saveCompletionCriteria(experienceId, {
        requireAttendance,
        requireSurveyCompletion,
        minimumAttendancePercentage: Number(minimumAttendancePercentage),
        certificateTemplateId: certificateTemplateId || undefined,
        autoIssue,
      });

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
        <CardTitle>Completion Criteria</CardTitle>
        <CardDescription>What a participant must do to earn a certificate for this experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="require-attendance">Require attendance</Label>
            <p className="text-sm text-muted-foreground">Participant must be checked in.</p>
          </div>
          <Switch id="require-attendance" checked={requireAttendance} onCheckedChange={setRequireAttendance} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="require-survey">Require survey completion</Label>
            <p className="text-sm text-muted-foreground">Participant must submit the post-experience survey.</p>
          </div>
          <Switch id="require-survey" checked={requireSurveyCompletion} onCheckedChange={setRequireSurveyCompletion} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minimum-attendance">Minimum attendance percentage</Label>
            <Input
              id="minimum-attendance"
              type="number"
              min={1}
              max={100}
              value={minimumAttendancePercentage}
              onChange={(event) => setMinimumAttendancePercentage(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate-template">Certificate template</Label>
            <Select
              value={certificateTemplateId || "default"}
              onValueChange={(value) => setCertificateTemplateId(!value || value === "default" ? "" : value)}
              items={[
                { value: "default", label: "Workspace default" },
                ...templates.map((template) => ({
                  value: template.id,
                  label: `${template.name}${template.isDefault ? " (default)" : ""}`,
                })),
              ]}
            >
              <SelectTrigger id="certificate-template" className="w-full">
                <SelectValue placeholder="Workspace default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Workspace default</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="auto-issue">Auto-issue when criteria met</Label>
            <p className="text-sm text-muted-foreground">
              Issues and emails a certificate automatically the moment a participant becomes eligible.
            </p>
          </div>
          <Switch id="auto-issue" checked={autoIssue} onCheckedChange={setAutoIssue} />
        </div>

        {status === "error" && error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Criteria"}
          </Button>
          {status === "saved" && !isPending && <p className="text-sm text-emerald-400">Saved.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
