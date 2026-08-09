"use client";

import { alpha, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconifyIcon } from "@/components/iconify-icon";

// Sidebar de la web de solo lectura: replica la identidad visual del
// escritorio (ferre-pos/src/layout/components/Sidebar.tsx): colapso 260↔72px,
// item activo con barra lateral primario, logo animado. Solo expone las rutas
// read-only del panel.

const items = [
  {
    label: "Inicio",
    to: "/dashboard",
    icon: <IconifyIcon icon="solar:widget-3-line-duotone" />,
  },
  {
    label: "Rentabilidad",
    to: "/rentabilidad",
    icon: <IconifyIcon icon="solar:chart-2-line-duotone" />,
  },
  {
    label: "Financiero",
    to: "/financiero",
    icon: <IconifyIcon icon="solar:wallet-money-line-duotone" />,
  },
  {
    label: "Caja",
    to: "/caja",
    icon: <IconifyIcon icon="solar:cash-out-line-duotone" />,
  },
];

export function Sidebar({ isOpen, onNavigate }: { isOpen: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <Box
      component="aside"
      sx={{
        width: isOpen ? 260 : 72,
        flexShrink: 0,
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        zIndex: 10,
        overflow: "hidden",
        transition: (theme: any) =>
          theme.transitions.create("width", {
            duration: 280,
            easing: theme.transitions.easing.easeInOut,
          }),
        willChange: "width",
      }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: isOpen ? 2 : 1,
          py: 1,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Ferre-POS"
          className="fsp-logo-spin"
          sx={{
            width: "auto",
            height: "auto",
            maxWidth: isOpen ? 180 : 44,
            maxHeight: 44,
            objectFit: "contain",
            opacity: isOpen ? 1 : 0.85,
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          py: 1.5,
          px: isOpen ? 1.25 : 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <List
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            "& .MuiListItemButton-root": {
              justifyContent: isOpen ? "flex-start" : "center",
              px: isOpen ? 2 : 1,
            },
            "& .MuiListItemIcon-root": {
              minWidth: isOpen ? 38 : 0,
              justifyContent: "center",
            },
            "& .MuiListItemText-root": {
              m: 0,
              opacity: isOpen ? 1 : 0,
              maxWidth: isOpen ? 176 : 0,
            },
          }}
        >
          {items.map((item) => {
            const isActive =
              item.to === "/dashboard" ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <ListItem key={item.to} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.to}
                  selected={isActive}
                  onClick={onNavigate}
                  aria-label={item.label}
                  sx={{
                    position: "relative",
                    borderRadius: "10px",
                    mb: 0.25,
                    minHeight: 42,
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 5,
                      top: 10,
                      bottom: 10,
                      width: 3,
                      borderRadius: 999,
                      bgcolor: "primary.main",
                      opacity: 0,
                      transform: "scaleY(0.4)",
                      transition: (theme: any) =>
                        theme.transitions.create(["opacity", "transform"], {
                          duration: 180,
                          easing: theme.transitions.easing.easeInOut,
                        }),
                    },
                    "&.Mui-selected": {
                      bgcolor: (theme: any) =>
                        alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.1),
                      color: "primary.main",
                      "&::before": {
                        opacity: 1,
                        transform: "scaleY(1)",
                      },
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                      "&:hover": {
                        bgcolor: (theme: any) =>
                          alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.16),
                      },
                    },
                    "&:not(.Mui-selected)": {
                      color: "text.secondary",
                      "& .MuiListItemIcon-root": { color: "text.secondary" },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}