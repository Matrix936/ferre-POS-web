"use client";

import { useContext, useMemo } from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import { Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon } from "@mui/icons-material";
import { ColorModeContext } from "@/lib/theme";

// Toggle de tema claro/oscuro en dos variantes:
// - "floating": botón fijo en la esquina (usado en la página de login).
// - "icon": botón inline que se integra en la Topbar del dashboard.
// Replica el toggle del Topbar del escritorio (Topbar.tsx:458-462).
export default function ThemeToggle({ variant = "floating" }: { variant?: "floating" | "icon" }) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const title = useMemo(
    () => (theme.palette.mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"),
    [theme.palette.mode],
  );

  return (
    <Tooltip title={title} enterDelay={200}>
      <IconButton
        onClick={colorMode.toggleColorMode}
        color="inherit"
        aria-label={title}
        sx={
          variant === "floating"
            ? { position: "fixed", top: 16, right: 16, zIndex: "appBar" }
            : undefined
        }
      >
        {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}