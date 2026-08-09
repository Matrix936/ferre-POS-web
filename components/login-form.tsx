"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Autocomplete, Box, Snackbar, TextField } from "@mui/material";
import { createClient } from "@/lib/supabase/client";
import AsyncButton from "@/components/async-button";
import { useNavigationOverlay } from "@/components/navigation-overlay";

// Historial de correos usados en el login (solo web, sin endpoints).
// Mismo espíritu del escritorio (ferre-pos:last-login-user), pero con lista
// de autocomplete 100% client-side.
const EMAILS_KEY = "ferre-pos-web:emails";
const LEGACY_EMAIL_KEY = "ferre-pos-web:last-email";
const MAX_EMAILS = 5;

function readSavedEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EMAILS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((e): e is string => typeof e === "string" && e.trim() !== "");
      }
    }
    // Migración desde el email único guardado antes del autocomplete.
    const legacy = localStorage.getItem(LEGACY_EMAIL_KEY);
    return legacy ? [legacy] : [];
  } catch {
    return [];
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show: showOverlay } = useNavigationOverlay();
  const [savedEmails] = useState(readSavedEmails);
  const [email, setEmail] = useState(() => readSavedEmails()[0] ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-cierre del snackbar (5s, igual que FeedbackSnackbar del escritorio).
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // Persiste en localStorage y navega tras un login exitoso.
  function saveEmailAndNavigate() {
    const trimmed = email.trim();
    if (trimmed) {
      try {
        const dedupe = [
          trimmed,
          ...savedEmails.filter(
            (s) => s.trim().toLowerCase() !== trimmed.toLowerCase(),
          ),
        ];
        const nextList = dedupe.slice(0, MAX_EMAILS);
        localStorage.setItem(EMAILS_KEY, JSON.stringify(nextList));
        localStorage.setItem(LEGACY_EMAIL_KEY, nextList[0] ?? "");
      } catch {
        // almacenamiento no disponible (modo privado) — el login no debe fallar
      }
    }

    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  }

  async function doSubmit() {
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

    // El overlay mantiene el feedback visible durante la navegación al
    // dashboard (el router.replace del App Router no es awaitable, no hay
    // "después de navegar" para soltar el loading del botón).
    showOverlay("Cargando panel...");
    saveEmailAndNavigate();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSubmit();
  }

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: "100%" }}>
      <Autocomplete
        freeSolo
        disableClearable
        fullWidth
        options={savedEmails}
        value={email}
        onInputChange={(_event, value) => setEmail(value)}
        sx={{ mb: 2 }}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="normal"
            required
            autoFocus
            label="Usuario"
            placeholder="Busca por correo"
            autoComplete="email"
            disabled={loading}
            onKeyDown={(event) => {
              // El Autocomplete se traga Enter para seleccionar opciones
              // (propiedad no estándar defaultMuiPrevented de MUI). Si NO hay
              // opción resaltada, enviamos el form manualmente.
              const e = event as React.KeyboardEvent & {
                defaultMuiPrevented?: boolean;
              };
              if (e.key === "Enter" && !e.defaultMuiPrevented) {
                e.preventDefault();
                doSubmit();
              }
            }}
          />
        )}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Contraseña"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <AsyncButton
          type="submit"
          variant="contained"
          disableElevation
          sx={{ py: 1, px: 3, fontWeight: 500 }}
          loading={loading}
          loadingText="Verificando..."
        >
          Ingresar
        </AsyncButton>
      </Box>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          role="alert"
          severity="error"
          variant="standard"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}