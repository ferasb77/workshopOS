import type { ReactNode } from "react";

import { NAV_ITEMS } from "@/config/navigation";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { SessionContext } from "@/infrastructure/session/session-context";
import { NavLinks } from "@/features/dashboard/components/nav-links";
import { NavLogo } from "@/features/dashboard/components/nav-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type Props = {
  session: SessionContext;
  children: ReactNode;
};

export function DashboardShell({ session, children }: Props) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-col gap-1 px-2 py-1.5">
            <NavLogo />
            <p className="truncate text-xs text-muted-foreground">
              {session.organizationName || "Organization"}
            </p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <NavLinks items={NAV_ITEMS} />
        </SidebarContent>

        <SidebarFooter>
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {session.fullName || session.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session.workspaceName || "Workspace"}
            </p>
          </div>
          <SignOutButton />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger />
        </header>

        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
