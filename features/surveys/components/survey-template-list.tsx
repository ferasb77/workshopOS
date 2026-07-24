import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyTemplateSummary } from "@/features/surveys/data";

import { DeleteSurveyTemplateDialog } from "./delete-survey-template-dialog";
import { PreviewSurveyTemplateButton } from "./preview-survey-template-button";
import { SetDefaultSurveyTemplateButton } from "./set-default-survey-template-button";

type Props = {
  templates: SurveyTemplateSummary[];
  workspaceId: string;
};

export function SurveyTemplateList({ templates, workspaceId }: Props) {
  if (templates.length === 0) {
    return (
      <Card className="bg-surface-elevated">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No survey templates yet. Create one to start building custom surveys.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.id} className="bg-surface-elevated">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {template.name}
                {template.isDefault && <Badge>Default</Badge>}
              </CardTitle>
              <CardDescription>
                {template.questionCount} question{template.questionCount === 1 ? "" : "s"}
                {template.description ? ` · ${template.description}` : ""}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-end gap-2">
            <PreviewSurveyTemplateButton templateId={template.id} />
            {!template.isDefault && <SetDefaultSurveyTemplateButton templateId={template.id} workspaceId={workspaceId} />}
            <DeleteSurveyTemplateDialog templateId={template.id} templateName={template.name} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              nativeButton={false}
              render={<Link href={`/dashboard/settings/surveys/${template.id}/edit`} />}
            >
              Edit
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
