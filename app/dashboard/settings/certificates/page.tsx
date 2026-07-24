import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCertificateTemplates } from "@/features/certificates/data";
import { TemplateList } from "@/features/certificates/components/template-list";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function CertificateTemplatesPage() {
  const session = await getSessionContext();
  const templates = await getCertificateTemplates(session.workspaceId);

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
          <h1 className="text-3xl font-bold">Certificate Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Branding and content for the certificates issued from every experience.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/settings/certificates/new" />}
        >
          New Template
        </Button>
      </div>

      <TemplateList templates={templates} workspaceId={session.workspaceId} />
    </div>
  );
}
