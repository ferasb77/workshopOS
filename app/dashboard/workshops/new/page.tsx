import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { WorkshopForm } from "@/features/workshops/components/workshop-form";

export default function NewWorkshopPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/dashboard/workshops"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="size-4" />
          Back to workshops
        </Link>

        <h1 className="mt-3 text-3xl font-bold">New Workshop</h1>
        <p className="mt-2 text-muted-foreground">
          Set up a new workshop. You can always come back and update these details later.
        </p>
      </div>

      <WorkshopForm />
    </div>
  );
}
