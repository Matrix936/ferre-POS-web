"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { usePathname } from "next/navigation";

// Overlay global de transición (login → dashboard, dashboard → login).
// Garantiza feedback visual continuo mientras una navegación está en vuelo:
// se activa desde cualquier provider hijo y se oculta solo cuando la ruta
// realmente cambió (o tras un tiempo máximo de seguridad si algo falló).
export const NAV_OVERLAY_TIMEOUT_MS = 10000;

interface NavigationOverlayContextValue {
  show: (label?: string) => void;
  hide: () => void;
}

const NavigationOverlayContext = createContext<NavigationOverlayContextValue | null>(null);

export function useNavigationOverlay(): NavigationOverlayContextValue {
  const ctx = useContext(NavigationOverlayContext);
  if (!ctx) {
    throw new Error("useNavigationOverlay debe usarse dentro de NavigationOverlayProvider");
  }
  return ctx;
}

export function NavigationOverlayProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState("Redirigiendo...");
  const prevPathname = useRef(pathname);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const show = useCallback(
    (nextLabel?: string) => {
      if (nextLabel) setLabel(nextLabel);
      setVisible(true);
      clearTimer();
      showTimer.current = setTimeout(hide, NAV_OVERLAY_TIMEOUT_MS);
    },
    [clearTimer, hide],
  );

  // Cuando la navegación commite a otra ruta, el overlay sobra: se oculta.
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (visible) hide();
    }
  }, [pathname, visible, hide]);

  return (
    <NavigationOverlayContext.Provider value={{ show, hide }}>
      {children}
      <Box
        aria-hidden={!visible}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "background.default",
          opacity: visible ? 1 : 0,
          visibility: visible ? "visible" : "hidden",
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      >
        <CircularProgress size={44} />
        {label ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        ) : null}
      </Box>
    </NavigationOverlayContext.Provider>
  );
}