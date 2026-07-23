import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { WorkshopEditForm } from "@/features/workshops/components/workshop-edit-form";
import { getWorkshopForEdit } from "@/features/workshops/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditWorkshopPage({ params }: Props) {
  const { slug } = await params;
  const workshop = await getWorkshopForEdit(slug);

  if (!workshop) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/dashboard/workshops/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="size-4" />
          Back to {workshop.title}
        </Link>

        <h1 className="mt-3 text-3xl font-bold">Edit Workshop</h1>
        <p className="mt-2 text-muted-foreground">Update the details for {workshop.title}.</p>
      </div>

      <WorkshopEditForm workshop={workshop} />
    </div>
  );
}
