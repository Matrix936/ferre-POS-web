"use client";

import { useContext, useMemo } from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import { Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon } from "@mui/icons-material";
import { ColorModeContext } from "@/lib/theme";

// Botón flotante de tema claro/oscuro.
// Replica el toggle del Topbar del escritorio (Topbar.tsx:458-462),
// usando el mismo ColorModeContext y los mismos iconos.
export default function ThemeToggle() {
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
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: "appBar",
        }}
      >
        {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}