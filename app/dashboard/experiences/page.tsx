import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExperiencesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Experiences</h1>
      <p className="mt-2 text-muted-foreground">
        Workshops and other experiences your organization runs.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Experience management is planned for a later sprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is where creating, editing, and publishing experiences will
          live.
        </CardContent>
      </Card>
    </div>
  );
}
