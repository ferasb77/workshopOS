import { ParticipantDirectory } from "@/features/participants/components/participant-directory";
import { getRecentParticipants } from "@/features/participants/data";

export default async function ParticipantsPage() {
  const participants = await getRecentParticipants();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Participants</h1>
        <p className="mt-2 text-muted-foreground">
          The 50 most recently registered participants across every experience.
        </p>
      </div>

      <ParticipantDirectory participants={participants} />
    </div>
  );
}
