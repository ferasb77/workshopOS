import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

import { EngagementDetail } from "@/features/engagements/components/engagement-detail";
import { getEngagementById, getEngagementExperiences } from "@/features/engagements/data";

type Props = {
  params: Promise<{ id: string; engagementId: string }>;
};

export default async function EngagementDetailPage({ params }: Props) {
  const { id, engagementId } = await params;
  const engagement = await getEngagementById(engagementId);

  if (!engagement || engagement.clientId !== id) {
    notFound();
  }

  const experiences = await getEngagementExperiences(engagementId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/dashboard/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to {engagement.clientName}
      </Link>

      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/clients" className="hover:text-gold">
          Clients
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href={`/dashboard/clients/${id}`} className="hover:text-gold">
          {engagement.clientName}
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-ivory">{engagement.title}</span>
      </nav>

      <EngagementDetail engagement={engagement} experiences={experiences} />
    </div>
  );
}
