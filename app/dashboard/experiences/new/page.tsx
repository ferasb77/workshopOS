import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExperienceForm } from "@/features/experiences/components/experience-form";
import { getClientOptions } from "@/features/clients/data";
import { getEngagementOptions } from "@/features/engagements/data";
import { getAllFacilitators } from "@/features/facilitators/data";

type Props = {
  searchParams: Promise<{ clientId?: string; engagementId?: string }>;
};

export default async function NewExperiencePage({ searchParams }: Props) {
  const { clientId, engagementId } = await searchParams;
  const [clients, engagements, facilitatorSummaries] = await Promise.all([
    getClientOptions(),
    getEngagementOptions(),
    getAllFacilitators(),
  ]);

  const facilitators = facilitatorSummaries.map((facilitator) => ({
    id: facilitator.id,
    fullName: facilitator.fullName,
    primaryExpertise: facilitator.expertiseAreas[0] ?? null,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/dashboard/experiences"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="size-4" />
          Back to experiences
        </Link>

        <h1 className="mt-3 text-3xl font-bold">New Experience</h1>
        <p className="mt-2 text-muted-foreground">
          Set up a new experience. You can always come back and update these details later.
        </p>
      </div>

      <ExperienceForm
        clients={clients}
        engagements={engagements}
        facilitators={facilitators}
        defaultClientId={clientId}
        defaultEngagementId={engagementId}
      />
    </div>
  );
}
