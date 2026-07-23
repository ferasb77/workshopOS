import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClientForm } from "@/features/clients/components/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>

        <h1 className="mt-3 text-3xl font-bold">New Client</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new client organization. You can add engagements once they&apos;re set up.
        </p>
      </div>

      <ClientForm />
    </div>
  );
}
