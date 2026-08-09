"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Correo
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Contraseña
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}
        />
      </label>
      {error ? (
        <p style={{ color: "#b91c1c", margin: 0, fontSize: "0.9rem" }}>{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.6rem",
          borderRadius: 6,
          background: "#1d4ed8",
          color: "#fff",
          border: "none",
          cursor: loading ? "progress" : "pointer",
        }}
      >
        {loading ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}