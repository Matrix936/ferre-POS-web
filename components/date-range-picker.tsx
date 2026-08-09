"use client";

import { useRouter, usePathname } from "next/navigation";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { RANGOS, type Rango } from "@/lib/format";

export default function DateRangePicker({ rango }: { rango: Rango }) {
  const router = useRouter();
  const pathname = usePathname();

  function select(_event: React.MouseEvent<HTMLElement>, next: Rango | null) {
    if (!next) return;
    router.push(next === "30d" ? pathname : `${pathname}?rango=${next}`);
  }

  return (
    <ToggleButtonGroup
      exclusive
      value={rango}
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
  );
}