import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createSurveyTemplate } from "@/features/surveys/actions";
import { SurveyTemplateBasicForm } from "@/features/surveys/components/survey-template-basic-form";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function NewSurveyTemplatePage() {
  const session = await getSessionContext();
  const boundCreate = createSurveyTemplate.bind(null, session.workspaceId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/settings/surveys"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to Survey Templates
      </Link>

      <div>
        <h1 className="text-3xl font-bold">New Survey Template</h1>
        <p className="mt-2 text-muted-foreground">
          Name your template first — you&apos;ll add questions on the next screen.
        </p>
      </div>

      <SurveyTemplateBasicForm action={boundCreate} submitLabel="Create Template" />
    </div>
  );
}
