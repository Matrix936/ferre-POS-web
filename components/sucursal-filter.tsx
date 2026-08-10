"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, LinearProgress, MenuItem, TextField } from "@mui/material";
import { StorefrontOutlined } from "@mui/icons-material";
import { useTopbarHeight } from "@/components/layout/topbar-height-context";

export default function SucursalFilter({
  sucursal,
  sucursales,
}: {
  sucursal: string;
  sucursales: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const topbarHeight = useTopbarHeight() ?? 56;
  // Resalte optimista igual que DateRangePicker.
  const [local, setLocal] = useState(sucursal);

  useEffect(() => {
    setLocal(sucursal);
  }, [sucursal]);

  function commit(next: string) {
    if (next === local) return;
    setLocal(next);
    const params = new URLSearchParams(window.location.search);
    if (next) {
      params.set("sucursal", next);
    } else {
      params.delete("sucursal");
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        select
        size="small"
        label="Sucursal"
        value={local}
        onChange={(e) => commit(e.target.value)}
        slotProps={{
          select: { startAdornment: <StorefrontOutlined fontSize="small" sx={{ mr: 0.75, color: "text.secondary" }} /> },
        }}
        sx={{ minWidth: { xs: "100%", sm: 190 } }}
      >
        <MenuItem value="">Todas</MenuItem>
        {sucursales.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.nombre}
          </MenuItem>
        ))}
      </TextField>

      {/* Barra de progreso fina bajo la Topbar mientras el servidor responde */}
      {isPending && (
        <LinearProgress
          aria-label="Filtrando sucursal"
          sx={{
            position: "fixed",
            top: topbarHeight,
            left: 0,
            right: 0,
            zIndex: 1300,
            height: 3,
          }}
        />
      )}
    </Box>
  );
}