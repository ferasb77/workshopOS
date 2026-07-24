"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
import { Textarea } from "@/components/ui/textarea";
import type { SurveyTemplateSummary } from "@/features/surveys/data";
import { SURVEY_TYPES, SURVEY_TYPE_LABELS } from "@/features/surveys/schema";

import type { SaveSurveyTemplateResult } from "../actions";

const SURVEY_TYPE_ITEMS = SURVEY_TYPES.map((value) => ({ value, label: SURVEY_TYPE_LABELS[value] }));

const initialState: SaveSurveyTemplateResult = { success: false, error: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return <p className="mt-1 text-sm text-destructive">{messages[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

type Props = {
  action: (prevState: SaveSurveyTemplateResult | null, formData: FormData) => Promise<SaveSurveyTemplateResult>;
  submitLabel: string;
  template?: Pick<SurveyTemplateSummary, "name" | "description" | "surveyType">;
};

export function SurveyTemplateBasicForm({ action, submitLabel, template }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const formKey = fieldErrors ? JSON.stringify(fieldErrors) : "initial";

  return (
    <form key={formKey} action={formAction} className="space-y-6" noValidate>
      {!state.success && state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </div>
      )}

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>Name and describe this survey template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="surveyType">Survey Type</Label>
            <Select
              name="surveyType"
              defaultValue={template?.surveyType ?? "satisfaction"}
              items={SURVEY_TYPE_ITEMS}
            >
              <SelectTrigger id="surveyType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SURVEY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {SURVEY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Template name <span className="text-gold">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={template?.name ?? ""} />
            <FieldError messages={fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={template?.description ?? ""} />
          </div>

          <SubmitButton label={submitLabel} />
        </CardContent>
      </Card>
    </form>
  );
}
