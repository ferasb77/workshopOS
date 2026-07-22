import type { ReactNode } from "react";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getSessionContext } from "@/infrastructure/session/session-context";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionContext();

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
