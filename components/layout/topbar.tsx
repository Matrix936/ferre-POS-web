"use client";

import { useEffect, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Logout as LogoutIcon, Menu as MenuIcon } from "@mui/icons-material";
import ThemeToggle from "@/components/theme-toggle";

// Port de la Topbar del escritorio (ferre-pos/src/layout/components/Topbar.tsx)
// solo en su parte de UI: fecha/hora es-MX, toggle de tema, avatar y menú de
// cuenta con Cerrar sesión. Sin sync/wifi/notificaciones (endpoints de Tauri).

const formatCurrentDateTime = (date: Date) => {
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  const formattedTime = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);

  return `${formattedDate.charAt(0).toUpperCase()}${formattedDate.slice(1)} - ${formattedTime.toUpperCase()}`;
};

interface DashboardUser {
  email?: string;
  nombre?: string;
  rol?: string;
}

export function Topbar({
  onToggleSidebar,
  user,
}: {
  onToggleSidebar: () => void;
  user?: DashboardUser;
}) {
  const [currentDateTime, setCurrentDateTime] = useState(() => formatCurrentDateTime(new Date()));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDateTime(formatCurrentDateTime(new Date()));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const nombre = user?.nombre?.trim() || user?.email?.split("@")[0] || "Usuario";
  const rol = user?.rol;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: 56, px: { xs: 1, md: 2 }, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={onToggleSidebar} edge="start" aria-label="Alternar menú" color="inherit">
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", ml: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
              {currentDateTime.split(" - ")[0]}
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: "bold", lineHeight: 1.1 }}>
              {currentDateTime.split(" - ")[1]}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ThemeToggle variant="icon" />

          <Tooltip title="Opciones de cuenta" enterDelay={200}>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ p: 0.5 }}
              aria-label="Cuenta"
            >
              <Avatar alt={nombre} sx={{ width: 35, height: 35, bgcolor: "primary.main", fontWeight: 600 }}>
                {nombre.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        elevation={2}
        slotProps={{ paper: { sx: { minWidth: 200, mt: 1.5, borderRadius: 2 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {nombre}
          </Typography>
          {rol ? (
            <Chip
              label={rol}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 22, borderRadius: "6px", fontSize: "0.72rem", mt: 0.5 }}
            />
          ) : null}
        </Box>
        <Divider />
        <form action="/auth/signout" method="post">
          <MenuItem
            component="button"
            type="submit"
            sx={{
              width: "100%",
              color: "error.main",
              "& .MuiSvgIcon-root": { color: "error.main" },
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Cerrar Sesión
          </MenuItem>
        </form>
      </Menu>
    </AppBar>
  );
}