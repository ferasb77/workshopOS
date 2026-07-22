import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function SettingsPage() {
  const session = await getSessionContext();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Your account, organization, and workspace.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed in as</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{session.fullName || "—"}</p>
            <p className="text-muted-foreground">{session.email}</p>
            <p className="text-muted-foreground">Role: {session.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization &amp; workspace</CardTitle>
            <CardDescription>Where this account operates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{session.organizationName || "—"}</p>
            <p className="text-muted-foreground">
              {session.workspaceName || "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
