"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ColorModeContext, createAppTheme } from "@/lib/theme";

// Clave de persistencia del tema (solo web).
const THEME_KEY = "ferre-pos-web:theme-mode";

// Claro por defecto + toggle manual persistido en localStorage
// (espejo de main.tsx del escritorio; sin detección automática).
export default function AppThemeProvider({ children }: { children: ReactNode }) {
  // Arranca en claro (paridad con el HTML servido) y aplica la preferencia
  // guardada justo después de montar para evitar hydration mismatch.
  const [mode, setMode] = useState<PaletteMode>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark") setMode("dark");
    } catch {
      // almacenamiento no disponible — queda claro
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // almacenamiento no disponible (modo privado) — no rompe
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    [],
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}