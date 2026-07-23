import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ExperienceEditForm } from "@/features/experiences/components/experience-edit-form";
import { getExperienceForEdit } from "@/features/experiences/data";
import { getClientOptions } from "@/features/clients/data";
import { getEngagementOptions } from "@/features/engagements/data";
import { getAllFacilitators } from "@/features/facilitators/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditExperiencePage({ params }: Props) {
  const { slug } = await params;
  const [experience, clients, engagements, facilitatorSummaries] = await Promise.all([
    getExperienceForEdit(slug),
    getClientOptions(),
    getEngagementOptions(),
    getAllFacilitators(),
  ]);

  if (!experience) {
    notFound();
  }

  const facilitators = facilitatorSummaries.map((facilitator) => ({
    id: facilitator.id,
    fullName: facilitator.fullName,
    primaryExpertise: facilitator.expertiseAreas[0] ?? null,
  }));

  // The experience row only stores facilitator name/email as denormalized
  // text (no facilitator_id FK), so the currently-assigned facilitator is
  // resolved by matching email — same approach the delivery-history lookup
  // already uses (features/facilitators/data.ts).
  const currentFacilitatorId = experience.facilitatorEmail
    ? facilitatorSummaries.find(
        (facilitator) =>
          facilitator.email?.toLowerCase() === experience.facilitatorEmail?.toLowerCase()
      )?.id
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/dashboard/experiences/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="size-4" />
          Back to {experience.title}
        </Link>

        <h1 className="mt-3 text-3xl font-bold">Edit Experience</h1>
        <p className="mt-2 text-muted-foreground">Update the details for {experience.title}.</p>
      </div>

      <ExperienceEditForm
        experience={experience}
        clients={clients}
        engagements={engagements}
        facilitators={facilitators}
        currentFacilitatorId={currentFacilitatorId}
      />
    </div>
  );
}
