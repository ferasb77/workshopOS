import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { createClient } from "@/infrastructure/supabase/server";

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
};

const profileRowSchema = z.object({
  full_name: z.string().nullable(),
  role: z.string(),
  organization_id: z.string(),
  workspace_id: z.string(),
  organizations: z.object({ name: z.string() }).nullable(),
  workspaces: z.object({ name: z.string() }).nullable(),
});

/**
 * Resolves the signed-in user's organization and workspace from the
 * `profiles` table. Redirects to /login when there is no session or no
 * matching profile — every caller can assume a fully resolved context.
 */
export const getSessionContext = cache(async (): Promise<SessionContext> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select(
      "full_name, role, organization_id, workspace_id, organizations(name), workspaces(name)"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profileRow) {
    console.error("No profile found for authenticated user", user.id, profileError);
    redirect("/login?error=no_profile");
  }

  const parsed = profileRowSchema.safeParse(profileRow);

  if (!parsed.success) {
    console.error("Malformed profile row for user", user.id, parsed.error);
    redirect("/login?error=no_profile");
  }

  const profile = parsed.data;

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    organizationId: profile.organization_id,
    organizationName: profile.organizations?.name ?? "",
    workspaceId: profile.workspace_id,
    workspaceName: profile.workspaces?.name ?? "",
  };
});
