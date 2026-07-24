"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ExperienceSurveyConfig, SurveyTemplateSummary } from "@/features/surveys/data";

import { saveExperienceSurveyConfig, sendPostTrainingSurveyToAll, sendPreTrainingSurveyToAll } from "../actions";

type SectionState = { enabled: boolean; templateId: string; autoSend: boolean };

function toSectionState(config: { enabled: boolean; templateId: string | null; autoSend: boolean }): SectionState {
  return { enabled: config.enabled, templateId: config.templateId ?? "", autoSend: config.autoSend };
}

function ConfigSection({
  title,
  description,
  templateLabel,
  autoSendLabel,
  autoSendDescription,
  templates,
  state,
  onChange,
  onSendAll,
  isSending,
  sendResult,
  isConfiguredOnServer,
}: {
  title: string;
  description: string;
  templateLabel: string;
  autoSendLabel: string;
  autoSendDescription: string;
  templates: SurveyTemplateSummary[];
  state: SectionState;
  onChange: (next: SectionState) => void;
  onSendAll: () => void;
  isSending: boolean;
  sendResult: string | null;
  isConfiguredOnServer: boolean;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border-subtle bg-night/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-ivory">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={state.enabled} onCheckedChange={(enabled) => onChange({ ...state, enabled })} />
      </div>

      {state.enabled && (
        <>
          <div className="space-y-2">
            <Label>{templateLabel}</Label>
            <Select
              value={state.templateId}
              onValueChange={(value) => value && onChange({ ...state, templateId: value })}
              items={templates.map((template) => ({
                value: template.id,
                label: `${template.name}${template.isDefault ? " (default)" : ""}`,
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No templates of this type exist yet — create one in Survey Templates first.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>{autoSendLabel}</Label>
              <p className="text-sm text-muted-foreground">{autoSendDescription}</p>
            </div>
            <Switch checked={state.autoSend} onCheckedChange={(autoSend) => onChange({ ...state, autoSend })} />
          </div>

          <div className="flex flex-col items-start gap-1.5 border-t border-border-subtle pt-4">
            <Button type="button" variant="secondary" size="sm" onClick={onSendAll} disabled={isSending || !isConfiguredOnServer}>
              {isSending ? "Sending..." : "Send to all now"}
            </Button>
            {!isConfiguredOnServer && (
              <p className="text-xs text-muted-foreground">Save this section before sending.</p>
            )}
            {sendResult && <p className="text-xs text-muted-foreground">{sendResult}</p>}
          </div>
        </>
      )}
    </div>
  );
}

type Props = {
  experienceId: string;
  experienceSlug: string;
  preTemplates: SurveyTemplateSummary[];
  postTemplates: SurveyTemplateSummary[];
  initialConfig: ExperienceSurveyConfig;
};

export function PrePostSurveyConfig({ experienceId, experienceSlug, preTemplates, postTemplates, initialConfig }: Props) {
  const [pre, setPre] = useState<SectionState>(toSectionState(initialConfig.preTraining));
  const [post, setPost] = useState<SectionState>(toSectionState(initialConfig.postTraining));

  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  const [preSendResult, setPreSendResult] = useState<string | null>(null);
  const [postSendResult, setPostSendResult] = useState<string | null>(null);
  const [isSendingPre, startPreSendTransition] = useTransition();
  const [isSendingPost, startPostSendTransition] = useTransition();

  function handleSave() {
    setSaveStatus("idle");
    setSaveError(null);

    startSaveTransition(async () => {
      const result = await saveExperienceSurveyConfig(experienceId, experienceSlug, {
        preTraining: { enabled: pre.enabled, templateId: pre.templateId || null, autoSend: pre.autoSend },
        postTraining: { enabled: post.enabled, templateId: post.templateId || null, autoSend: post.autoSend },
      });

      if (result.success) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
        setSaveError(result.error);
      }
    });
  }

  function handleSendPre() {
    setPreSendResult(null);
    startPreSendTransition(async () => {
      const result = await sendPreTrainingSurveyToAll(experienceId, experienceSlug);
      setPreSendResult(
        result.success
          ? `Sent to ${result.sent} participant${result.sent === 1 ? "" : "s"}${result.failed > 0 ? `, ${result.failed} failed` : ""}.`
          : result.error
      );
    });
  }

  function handleSendPost() {
    setPostSendResult(null);
    startPostSendTransition(async () => {
      const result = await sendPostTrainingSurveyToAll(experienceId, experienceSlug);
      setPostSendResult(
        result.success
          ? `Sent to ${result.sent} participant${result.sent === 1 ? "" : "s"}${result.failed > 0 ? `, ${result.failed} failed` : ""}.`
          : result.error
      );
    });
  }

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>Pre/Post Training Surveys</CardTitle>
        <CardDescription>Measure knowledge and confidence before and after this experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConfigSection
          title="Pre-Training Survey"
          description="Sent when a participant registers."
          templateLabel="Template"
          autoSendLabel="Send automatically when participant registers"
          autoSendDescription="Off means you'll need to send it manually below."
          templates={preTemplates}
          state={pre}
          onChange={setPre}
          onSendAll={handleSendPre}
          isSending={isSendingPre}
          sendResult={preSendResult}
          isConfiguredOnServer={initialConfig.preTraining.enabled}
        />

        <ConfigSection
          title="Post-Training Survey"
          description="Sent when the experience is marked completed."
          templateLabel="Template"
          autoSendLabel="Send automatically when experience is completed"
          autoSendDescription="Off means you'll need to send it manually below."
          templates={postTemplates}
          state={post}
          onChange={setPost}
          onSendAll={handleSendPost}
          isSending={isSendingPost}
          sendResult={postSendResult}
          isConfiguredOnServer={initialConfig.postTraining.enabled}
        />

        {saveStatus === "error" && saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Survey Configuration"}
          </Button>
          {saveStatus === "saved" && !isSaving && <p className="text-sm text-emerald-400">Saved.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
