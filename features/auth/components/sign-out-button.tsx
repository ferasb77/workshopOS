import { LogOut } from "lucide-react";

import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2"
      >
        <LogOut />
        Sign out
      </Button>
    </form>
  );
}
