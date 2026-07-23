import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ClientEditForm } from "@/features/clients/components/client-edit-form";
import { getClientById } from "@/features/clients/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to {client.name}
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Edit Client</h1>
        <p className="mt-2 text-muted-foreground">Update the details for {client.name}.</p>
      </div>

      <ClientEditForm client={client} />
    </div>
  );
}
