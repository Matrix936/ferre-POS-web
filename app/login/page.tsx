import type { Metadata } from "next";
import { Suspense } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Ferre-POS"
            className="fsp-logo-spin"
            sx={{
              width: "auto",
              maxWidth: "100%",
              maxHeight: 128,
              height: "auto",
              objectFit: "contain",
              mb: 2,
            }}
          />
          <Typography
            component="h2"
            variant="body1"
            sx={{ color: "text.secondary", mb: 4 }}
          >
            Gestión de Inventario y Ventas
          </Typography>
          <Suspense>
            <LoginForm />
          </Suspense>
        </Paper>
      </Container>
    </Box>
  );
}