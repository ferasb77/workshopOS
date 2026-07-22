import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ParticipantsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Participants</h1>
      <p className="mt-2 text-muted-foreground">
        Everyone enrolled or checked in across your experiences.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Participant evidence is planned for a later sprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is where enrollment and check-in records will surface.
        </CardContent>
      </Card>
    </div>
  );
}
