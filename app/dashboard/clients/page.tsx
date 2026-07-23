import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientDirectory } from "@/features/clients/components/client-directory";
import { getAllClients } from "@/features/clients/data";

export default async function ClientsPage() {
  const clients = await getAllClients();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="mt-2 text-muted-foreground">
            The organizations you deliver experiences for.
          </p>
        </div>

        <Button size="lg" nativeButton={false} render={<Link href="/dashboard/clients/new" />}>
          <Plus className="size-4" />
          Add Client
        </Button>
      </div>

      <ClientDirectory clients={clients} />
    </div>
  );
}
