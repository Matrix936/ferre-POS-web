"use client";

import { Button } from "@mui/material";
import { Download } from "@mui/icons-material";
import { downloadCsv } from "@/lib/csv";

// Port del botón "Exportar CSV" de los indicadores del escritorio.
export default function ExportCsvButton({
  filename,
  rows,
  label = "Exportar CSV",
}: {
  filename: string;
  rows: Record<string, string | number | null | undefined>[];
  label?: string;
}) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<Download />}
      disabled={rows.length === 0}
      onClick={() => downloadCsv(filename, rows)}
    >
      {label}
    </Button>
  );
}