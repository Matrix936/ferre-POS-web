"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formSx,
  fieldSx,
  labelSx,
  inputSx,
  inputFocusSx,
  buttonSx,
  errorAlertSx,
  errorIconSx,
} from "@/lib/tokens";

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
    <form onSubmit={onSubmit} noValidate style={formSx}>
      <label style={fieldSx}>
        <span style={labelSx}>Correo</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputSx}
          onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusSx)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        />
      </label>
      <label style={fieldSx}>
        <span style={labelSx}>Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputSx}
          onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusSx)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        />
      </label>

      {error ? (
        <p role="alert" style={errorAlertSx}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            style={errorIconSx}
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        style={loading ? { ...buttonSx, opacity: 0.75, cursor: "progress" } : buttonSx}
      >
        {loading ? (
          <>
            <span
              className="fsp-spinner"
              aria-hidden="true"
              style={{ color: "#fff" }}
            />
            Autenticando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}