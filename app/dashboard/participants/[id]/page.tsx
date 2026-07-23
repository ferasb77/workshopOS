import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ParticipantDetailView } from "@/features/participants/components/participant-detail";
import { getParticipantById, getParticipantSurveyHistory } from "@/features/participants/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ParticipantDetailPage({ params }: Props) {
  const { id } = await params;

  const detail = await getParticipantById(id);

  if (!detail) {
    notFound();
  }

  const surveyResponses = await getParticipantSurveyHistory(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/participants"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to participants
      </Link>

      <ParticipantDetailView detail={detail} surveyResponses={surveyResponses} />
    </div>
  );
}
