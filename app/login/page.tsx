import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { createClient } from "@/infrastructure/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <LoginForm />
    </main>
  );
}