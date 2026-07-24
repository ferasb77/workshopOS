import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { updateSurveyTemplate } from "@/features/surveys/actions";
import { SurveyTemplateBasicForm } from "@/features/surveys/components/survey-template-basic-form";
import { QuestionListEditor } from "@/features/surveys/components/question-list-editor";
import { PreviewSurveyTemplateDialog } from "@/features/surveys/components/preview-survey-template-dialog";
import { getSurveyTemplate } from "@/features/surveys/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSurveyTemplatePage({ params }: Props) {
  const { id } = await params;
  const template = await getSurveyTemplate(id);

  if (!template) {
    notFound();
  }

  const boundUpdate = updateSurveyTemplate.bind(null, template.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/settings/surveys"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to Survey Templates
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Survey Template</h1>
          <p className="mt-2 text-muted-foreground">{template.name}</p>
        </div>
        <PreviewSurveyTemplateDialog questions={template.questions} />
      </div>

      <SurveyTemplateBasicForm action={boundUpdate} submitLabel="Save Changes" template={template} />

      {/* Keyed on the full question list content, not just id/order — the
          editor keeps its own local state for drag-reorder, so it only
          needs to remount when the server data actually changes. Editing a
          question's type/text/options without touching its position
          wouldn't change an id:orderIndex key, which would leave the
          editor showing stale data after a save. */}
      <QuestionListEditor key={JSON.stringify(template.questions)} templateId={template.id} questions={template.questions} />
    </div>
  );
}
