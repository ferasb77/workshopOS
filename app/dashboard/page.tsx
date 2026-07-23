import Link from "next/link";
import { CalendarCheck, ClipboardList, LayoutGrid, Plus, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AttentionPanel } from "@/features/dashboard/components/attention-panel";
import { RecentParticipantsPanel } from "@/features/dashboard/components/recent-participants-panel";
import { RecentWorkshopsPanel } from "@/features/dashboard/components/recent-workshops-panel";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { getDashboardData } from "@/infrastructure/repositories/dashboard";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function DashboardPage() {
  const [session, { stats, recentWorkshops, recentParticipants, attentionItems }] =
    await Promise.all([getSessionContext(), getDashboardData()]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{session.fullName ? `, ${session.fullName}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {session.organizationName} · {session.workspaceName}
          </p>
        </div>

        <Button size="lg" nativeButton={false} render={<Link href="/dashboard/workshops/new" />}>
          <Plus className="size-4" />
          New Workshop
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workshops" value={stats.totalWorkshops} icon={LayoutGrid} />
        <StatCard
          label="Total Participants"
          value={stats.totalParticipants}
          icon={ClipboardList}
        />
        <StatCard label="Checked In" value={stats.checkedIn} icon={UserCheck} />
        <StatCard label="Active Workshops" value={stats.activeWorkshops} icon={CalendarCheck} />
      </div>

      <AttentionPanel items={attentionItems} />

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentWorkshopsPanel workshops={recentWorkshops} />
        <RecentParticipantsPanel participants={recentParticipants} />
      </div>
    </div>
  );
}
