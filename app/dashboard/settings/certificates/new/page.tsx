import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createCertificateTemplate } from "@/features/certificates/actions";
import { TemplateForm } from "@/features/certificates/components/template-form";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function NewCertificateTemplatePage() {
  const session = await getSessionContext();
  const boundCreate = createCertificateTemplate.bind(null, session.workspaceId);

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
        <h1 className="text-3xl font-bold">New Certificate Template</h1>
        <p className="mt-2 text-muted-foreground">Set up the branding and copy for a new certificate template.</p>
      </div>

      <TemplateForm action={boundCreate} submitLabel="Create Template" />
    </div>
  );
}
