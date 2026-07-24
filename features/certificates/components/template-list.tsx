import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CertificateTemplate } from "@/features/certificates/data";

import { PreviewTemplateButton } from "./preview-template-button";
import { SetDefaultTemplateButton } from "./set-default-template-button";

type Props = {
  templates: CertificateTemplate[];
  workspaceId: string;
};

export function TemplateList({ templates, workspaceId }: Props) {
  if (templates.length === 0) {
    return (
      <Card className="bg-surface-elevated">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No certificate templates yet. Create one to start issuing certificates.
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
                {template.organizationName} · {template.titleText}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="size-5 rounded-full border border-border-subtle"
                style={{ backgroundColor: template.primaryColor }}
                title={`Primary: ${template.primaryColor}`}
              />
              <span
                className="size-5 rounded-full border border-border-subtle"
                style={{ backgroundColor: template.secondaryColor }}
                title={`Secondary: ${template.secondaryColor}`}
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-end gap-2">
            <PreviewTemplateButton templateId={template.id} />
            {!template.isDefault && <SetDefaultTemplateButton templateId={template.id} workspaceId={workspaceId} />}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              nativeButton={false}
              render={<Link href={`/dashboard/settings/certificates/${template.id}/edit`} />}
            >
              Edit
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
