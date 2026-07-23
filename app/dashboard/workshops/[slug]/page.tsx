import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { WorkshopStatusBadge } from "@/features/dashboard/components/workshop-status-badge";
import { SurveyResultsPanel } from "@/features/surveys/components/survey-results-panel";
import { LogisticsTab } from "@/features/workshops/components/logistics-tab";
import { ParticipantsTab } from "@/features/workshops/components/participants-tab";
import { WORKSHOP_TABS, WorkshopTabs, type WorkshopTabKey } from "@/features/workshops/components/workshop-tabs";
import {
  getWorkshopBySlug,
  getWorkshopLogisticsTasks,
  getWorkshopParticipants,
  getWorkshopSurveyResults,
} from "@/features/workshops/data";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function resolveTab(tab: string | undefined): WorkshopTabKey {
  const match = WORKSHOP_TABS.find((t) => t.key === tab);
  return match?.key ?? "participants";
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function WorkshopDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const activeTab = resolveTab(tab);

  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) {
    notFound();
  }

  // Participants are needed on every tab (header count, survey tab's
  // response-rate math) — the other two are fetched only for the tab
  // actually being viewed, so each tab is an independent view: switching
  // to Participants still works even if, say, the logistics table isn't
  // there yet.
  const participants = await getWorkshopParticipants(workshop.id);

  const surveyResults =
    activeTab === "survey" ? await getWorkshopSurveyResults(workshop.id) : null;
  const logisticsGroups =
    activeTab === "logistics" ? await getWorkshopLogisticsTasks(workshop.id) : null;

  const isLocked = workshop.status === "completed" || workshop.status === "cancelled";
  const unsentSurveyCount = participants.filter((p) => p.surveyStatus === "not_sent").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{workshop.title}</h1>
            <WorkshopStatusBadge status={workshop.status} />
          </div>
          <p className="mt-2 text-muted-foreground">
            {formatDate(workshop.startDate)} – {formatDate(workshop.endDate)}
            {workshop.venue ? ` · ${workshop.venue}` : ""}
            {` · ${participants.length} / ${workshop.capacity} registered`}
          </p>
        </div>

        <Button
          variant="secondary"
          nativeButton={false}
          render={<Link href={`/dashboard/workshops/${workshop.slug}/edit`} />}
        >
          Edit
        </Button>
      </div>

      <WorkshopTabs slug={workshop.slug} activeTab={activeTab} />

      {activeTab === "participants" && (
        <ParticipantsTab workshop={workshop} participants={participants} />
      )}

      {activeTab === "survey" && surveyResults && (
        <SurveyResultsPanel
          workshopId={workshop.id}
          workshopSlug={workshop.slug}
          workshopTitle={workshop.title}
          participantsCount={participants.length}
          unsentCount={unsentSurveyCount}
          averages={surveyResults.averages}
          responses={surveyResults.responses}
        />
      )}

      {activeTab === "logistics" && logisticsGroups && (
        <LogisticsTab workshopSlug={workshop.slug} isLocked={isLocked} groups={logisticsGroups} />
      )}
    </div>
  );
}
