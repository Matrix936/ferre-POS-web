import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  pageSx,
  cardSx,
  logoWrapSx,
  logoSx,
  taglineSx,
} from "@/lib/tokens";
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
        <div style={logoWrapSx}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Ferre-POS"
            style={logoSx}
            className="fsp-logo-spin"
          />
        </div>
        <h1 style={taglineSx}>Gestión de Inventario y Ventas</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}