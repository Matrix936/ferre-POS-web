import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { pageSx, cardSx, titleSx, subtitleSx } from "@/lib/tokens";
import LoginForm from "@/components/login-form";

export const metadata: Metadata = { title: "Acceso · Ferre Dashboard" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main style={pageSx}>
      <div style={cardSx}>
        <h1 style={titleSx}>Ferre-POS Web</h1>
        <p style={subtitleSx}>Acceso al panel de indicadores</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}