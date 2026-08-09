"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Snackbar, TextField } from "@mui/material";
import { createClient } from "@/lib/supabase/client";
import AsyncButton from "@/components/async-button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-cierre del snackbar (5s, igual que FeedbackSnackbar del escritorio).
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

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
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: "100%" }}>
      <TextField
        margin="normal"
        required
        fullWidth
        autoFocus
        label="Usuario"
        placeholder="Busca por correo"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
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