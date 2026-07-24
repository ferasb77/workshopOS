import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { updateCertificateTemplate } from "@/features/certificates/actions";
import { TemplateForm } from "@/features/certificates/components/template-form";
import { TemplateTypeToggle } from "@/features/certificates/components/template-type-toggle";
import { UploadedTemplateEditor } from "@/features/certificates/components/uploaded-template-editor";
import { getCertificateTemplateById } from "@/features/certificates/data";
import { getSessionContext } from "@/infrastructure/session/session-context";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCertificateTemplatePage({ params }: Props) {
  const { id } = await params;
  const [template, session] = await Promise.all([getCertificateTemplateById(id), getSessionContext()]);

  if (!template) {
    notFound();
  }

  const boundUpdate = updateCertificateTemplate.bind(null, template.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/settings/certificates"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to Certificate Templates
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Edit Certificate Template</h1>
        <p className="mt-2 text-muted-foreground">{template.name}</p>
      </div>

      <TemplateTypeToggle templateId={template.id} currentType={template.templateType} />

      {template.templateType === "generated" ? (
        <TemplateForm action={boundUpdate} submitLabel="Save Changes" template={template} />
      ) : (
        <UploadedTemplateEditor workspaceId={session.workspaceId} template={template} />
      )}
    </div>
  );
}
