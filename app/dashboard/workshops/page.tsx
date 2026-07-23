import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecentWorkshopsPanel } from "@/features/dashboard/components/recent-workshops-panel";
import { getDashboardData } from "@/infrastructure/repositories/dashboard";

export default async function WorkshopsPage() {
  const { recentWorkshops } = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workshops</h1>
          <p className="mt-2 text-muted-foreground">
            Every workshop your organization has run or scheduled.
          </p>
        </div>

        <Button size="lg" nativeButton={false} render={<Link href="/dashboard/workshops/new" />}>
          <Plus className="size-4" />
          New Workshop
        </Button>
      </div>

      <RecentWorkshopsPanel
        workshops={recentWorkshops}
        title="All Workshops"
        description={`${recentWorkshops.length} workshop${recentWorkshops.length === 1 ? "" : "s"}, ordered by start date.`}
      />
    </div>
  );
}
