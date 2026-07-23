import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { FacilitatorEditForm } from "@/features/facilitators/components/facilitator-edit-form";
import { getFacilitatorById } from "@/features/facilitators/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditFacilitatorPage({ params }: Props) {
  const { id } = await params;
  const facilitator = await getFacilitatorById(id);

  if (!facilitator) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/dashboard/facilitators/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to {facilitator.fullName}
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Edit Facilitator</h1>
        <p className="mt-2 text-muted-foreground">Update {facilitator.fullName}&apos;s profile.</p>
      </div>

      <FacilitatorEditForm facilitator={facilitator} />
    </div>
  );
}
