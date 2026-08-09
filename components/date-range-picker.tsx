"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, LinearProgress, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { RANGOS, type Rango } from "@/lib/format";

export default function DateRangePicker({ rango }: { rango: Rango }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // Resalte optimista: el botón se marca al instante aunque el servidor aún
  // esté re-ejecutando las RPCs del dashboard (evita "no pasó nada").
  const [localRango, setLocalRango] = useState<Rango>(rango);

  useEffect(() => {
    setLocalRango(rango);
  }, [rango]);

  function select(_event: React.MouseEvent<HTMLElement>, next: Rango | null) {
    if (!next || next === localRango) return;
    setLocalRango(next);
    startTransition(() => {
      router.push(next === "30d" ? pathname : `${pathname}?rango=${next}`);
    });
  }

  return (
    <Box sx={{ position: "relative" }}>
      <ToggleButtonGroup
        exclusive
        value={localRango}
        onChange={select}
        size="small"
        aria-label="Rango de fechas"
      >
        {RANGOS.map((r) => (
          <ToggleButton key={r.value} value={r.value} sx={{ fontWeight: 600 }}>
            {r.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Barra de progreso fina bajo la Topbar mientras el servidor responde */}
      {isPending && (
        <LinearProgress
          aria-label="Cargando datos del rango"
          sx={{
            position: "fixed",
            top: 56,
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