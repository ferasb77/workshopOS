import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecentExperiencesPanel } from "@/features/dashboard/components/recent-experiences-panel";
import { getAllExperiences } from "@/features/experiences/data";

export default async function ExperiencesPage() {
  const experiences = await getAllExperiences();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Experiences</h1>
          <p className="mt-2 text-muted-foreground">
            Every experience across every client — workshops, assessments, coaching, and more.
          </p>
        </div>

        <Button size="lg" nativeButton={false} render={<Link href="/dashboard/experiences/new" />}>
          <Plus className="size-4" />
          New Experience
        </Button>
      </div>

      <RecentExperiencesPanel
        experiences={experiences}
        title="All Experiences"
        description={`${experiences.length} experience${experiences.length === 1 ? "" : "s"}, ordered by start date.`}
      />
    </div>
  );
}
