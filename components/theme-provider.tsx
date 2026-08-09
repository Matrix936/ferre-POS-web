"use client";

import { useMemo, type ReactNode } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "@/lib/theme";

// Modo oscuro automático según el sistema del dispositivo (sin toggle).
export default function AppThemeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () => createAppTheme(prefersDark ? "dark" : "light"),
    [prefersDark],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}