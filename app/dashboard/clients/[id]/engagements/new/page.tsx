import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { EngagementForm } from "@/features/engagements/components/engagement-form";
import { getClientById } from "@/features/clients/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewEngagementPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/dashboard/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="size-4" />
          Back to {client.name}
        </Link>

        <h1 className="mt-3 text-3xl font-bold">New Engagement</h1>
        <p className="mt-2 text-muted-foreground">Set up a new contract or project for {client.name}.</p>
      </div>

      <EngagementForm clientId={client.id} clientName={client.name} />
    </div>
  );
}
