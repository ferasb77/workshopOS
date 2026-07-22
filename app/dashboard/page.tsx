import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function DashboardPage() {
  const session = await getSessionContext();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">
        Welcome back{session.fullName ? `, ${session.fullName}` : ""}
      </h1>

      <p className="mt-2 text-muted-foreground">
        {session.organizationName} · {session.workspaceName}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Experiences</CardTitle>
            <CardDescription>
              Workshops and other experiences you run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full experience management is coming in a later sprint.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              People enrolled and checked in across experiences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Participant evidence is coming in a later sprint.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
