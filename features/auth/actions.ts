"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/server";

export type LoginState = {
  error: string;
};

export async function login(
  previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient();

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}