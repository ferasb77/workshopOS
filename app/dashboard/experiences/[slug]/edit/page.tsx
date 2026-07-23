import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ExperienceEditForm } from "@/features/experiences/components/experience-edit-form";
import { getExperienceForEdit } from "@/features/experiences/data";
import { getClientOptions } from "@/features/clients/data";
import { getEngagementOptions } from "@/features/engagements/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditExperiencePage({ params }: Props) {
  const { slug } = await params;
  const [experience, clients, engagements] = await Promise.all([
    getExperienceForEdit(slug),
    getClientOptions(),
    getEngagementOptions(),
  ]);

  if (!experience) {
    notFound();
  }

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

      <ExperienceEditForm experience={experience} clients={clients} engagements={engagements} />
    </div>
  );
}
