import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSurveyTemplates } from "@/features/surveys/data";
import { SurveyTemplateList } from "@/features/surveys/components/survey-template-list";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function SurveyTemplatesPage() {
  const session = await getSessionContext();
  const templates = await getSurveyTemplates(session.workspaceId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to Settings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Survey Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Build custom surveys and assign them at the organization or experience level.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/settings/surveys/new" />}>
          New Template
        </Button>
      </div>

      <SurveyTemplateList templates={templates} workspaceId={session.workspaceId} />
    </div>
  );
}
