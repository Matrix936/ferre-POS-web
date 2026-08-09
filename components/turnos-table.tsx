"use client";

import { useState } from "react";
import { Box, Chip, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { StorefrontOutlined } from "@mui/icons-material";
import { dineroCentavos } from "@/lib/format";
import type { TurnoResumen } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { EmptyState } from "@/components/empty-state";

const estadoColor: Record<string, "success" | "warning" | "error" | "info"> = {
  ABIERTA: "success",
  CERRADA: "info",
  CON_CORTE: "warning",
  CANCELADA: "error",
};

function fechaLocal(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function TurnosTable({ data }: { data: TurnoResumen[] }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const fromRow = totalRows === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min((page + 1) * pageSize, totalRows);
  const rows = data.slice(page * pageSize, page * pageSize + pageSize);

  const setPageSizeAndReset = (value: number) => {
    setPageSize(value);
    setPage(0);
  };

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Cortes de caja / turnos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sesiones de caja recientes con arqueo y diferencia.
        </Typography>
      </Box>

      <BusinessTable
        headers={[
          { label: "Usuario", align: "left" },
          { label: "Sucursal" },
          { label: "Apertura", align: "right" },
          { label: "Cierre", align: "right" },
          { label: "Inicial", align: "right" },
          { label: "Ventas efec.", align: "right" },
          { label: "Ingresos", align: "right" },
          { label: "Egresos", align: "right" },
          { label: "Esperado", align: "right" },
          { label: "Real", align: "right" },
          { label: "Diferencia", align: "right" },
          { label: "Estado" },
        ]}
        showRowNumber
        rowNumberPage={page}
        rowNumberPageSize={pageSize}
        minWidth={1100}
      >
        <TableBody>
          {rows.map((t, index) => {
            const dif = t.diferencia_centavos;
            return (
              <TableRow key={t.sesion_id} hover>
                <RowNumberCell index={index} />
                <TableCell align="left">
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {t.usuario_nombre || "-"}
                  </Typography>
                </TableCell>
                <TableCell>{t.sucursal_nombre}</TableCell>
                <TableCell align="right">{fechaLocal(t.fecha_apertura)}</TableCell>
                <TableCell align="right">{fechaLocal(t.fecha_cierre)}</TableCell>
                <TableCell align="right">{dineroCentavos(t.monto_inicial_centavos)}</TableCell>
                <TableCell align="right">{dineroCentavos(t.ventas_efectivo_centavos)}</TableCell>
                <TableCell align="right">{dineroCentavos(t.ingresos_centavos)}</TableCell>
                <TableCell align="right">{dineroCentavos(t.egresos_centavos)}</TableCell>
                <TableCell align="right">{dineroCentavos(t.monto_esperado_centavos)}</TableCell>
                <TableCell align="right">{t.monto_final_real_centavos != null ? dineroCentavos(t.monto_final_real_centavos) : "—"}</TableCell>
                <TableCell align="right">
                  {dif != null ? (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        color: dif === 0 ? "success.main" : dif > 0 ? "warning.main" : "error.main",
                      }}
                    >
                      {dif > 0 ? "+" : ""}
                      {dineroCentavos(dif)}
                    </Typography>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={t.estado ?? "—"}
                    color={estadoColor[t.estado ?? ""] ?? "default"}
                    variant="outlined"
                    sx={{ borderRadius: "8px", fontWeight: 700 }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {totalRows === 0 && (
            <TableRow>
              <TableCell colSpan={13} align="center">
                <EmptyState icon={<StorefrontOutlined />} title="Sin cortes de caja." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BusinessTable>

      <TablePager
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalRows={totalRows}
        fromRow={fromRow}
        toRow={toRow}
        canPreviousPage={page > 0}
        canNextPage={page + 1 < totalPages}
        onPreviousPage={() => setPage((prev) => Math.max(0, prev - 1))}
        onNextPage={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
        onPageSizeChange={setPageSizeAndReset}
        rowLabel="turnos"
      />
    </Box>
  );
}