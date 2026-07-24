import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { updateCertificateTemplate } from "@/features/certificates/actions";
import { TemplateForm } from "@/features/certificates/components/template-form";
import { getCertificateTemplateById } from "@/features/certificates/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCertificateTemplatePage({ params }: Props) {
  const { id } = await params;
  const template = await getCertificateTemplateById(id);

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

      <TemplateForm action={boundUpdate} submitLabel="Save Changes" template={template} />
    </div>
  );
}
