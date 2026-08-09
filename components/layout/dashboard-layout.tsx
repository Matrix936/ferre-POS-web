"use client";

import { useState, type ReactNode } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// Port de ferre-pos/src/layout/components/DashboardLayout.tsx (solo UI).
// Responsive: < md el sidebar es un Drawer temporal (overlay) que se abre con
// el hamburger; ≥ md conserva el colapso 260↔72px persistido del escritorio.
const SIDEBAR_KEY = "ferre-pos-web:sidebar-open";

function leerSidebarOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "false";
  } catch {
    return true;
  }
}

export function DashboardLayout({
  children,
  user,
}: {
  children: ReactNode;
  user?: { email?: string; nombre?: string; rol?: string };
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(() => !leerSidebarOpen());
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(SIDEBAR_KEY, String(!next));
        } catch {
          // almacenamiento no disponible — no rompe
        }
        return next;
      });
    }
  };

  const sidebarDesktop = (
    <Sidebar isOpen={!collapsed} />
  );

  const sidebarMobile = (
    <Sidebar isOpen onNavigate={() => setMobileOpen(false)} />
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        bgcolor: "background.default",
        fontFamily: (theme: any) => theme.typography.fontFamily,
        "@supports not (height: 100dvh)": { height: "100vh" },
      }}
    >
      {/* Desktop: sidebar permanente con colapso */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            position: "relative",
            height: "100%",
            bgcolor: "transparent",
            border: 0,
            overflow: "hidden",
            transition: theme.transitions.create("width", {
              duration: 280,
              easing: theme.transitions.easing.easeInOut,
            }),
          },
        }}
      >
        {sidebarDesktop}
      </Drawer>

      {/* Mobile: drawer temporal sobre overlay */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 260,
            bgcolor: "background.paper",
          },
        }}
      >
        {sidebarMobile}
      </Drawer>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar onToggleSidebar={toggleSidebar} user={user} />
        <Box component="main" sx={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}>
          <Box sx={{ width: "100%", minHeight: "100%", p: { xs: 2, md: 3 } }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}