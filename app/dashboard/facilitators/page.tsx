import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FacilitatorsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Facilitators</h1>
      <p className="mt-2 text-muted-foreground">
        The people who deliver your experiences.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Facilitator management is planned for a later sprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is where facilitator profiles and assignments will live.
        </CardContent>
      </Card>
    </div>
  );
}
