"use client";

import { useState } from "react";
import { Box, Button, Chip, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { ReceiptLongOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { dineroCentavos } from "@/lib/format";
import type { HistorialVentaRow } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { EmptyState } from "@/components/empty-state";
import ExportCsvButton from "@/components/export-csv-button";
import VentaDetalleDialog from "@/components/ventas-historial/venta-detalle-dialog";

export default function HistorialTable({
  page,
  pageSize,
  totalRows,
  rows,
  showSucursal,
}: {
  page: number;
  pageSize: number;
  totalRows: number;
  rows: HistorialVentaRow[];
  showSucursal: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<HistorialVentaRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const fromRow = totalRows === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min((page + 1) * pageSize, totalRows);

  // La navegación (página) y el tamaño viven en la URL para que el page server
  // re-cote las RPCs; aquí solo se reconstruye el searchParams con los filtros
  // actuales + pagina/permitir.
  const pushQuery = (overrides: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(overrides).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    const qs = params.toString();
    router.push(qs ? `/ventas?${qs}` : "/ventas");
  };

  const go = (next: number) => pushQuery({ pagina: String(Math.max(0, Math.min(totalPages - 1, next)) + 1) });
  const setPageSize = (value: number) => pushQuery({ permitir: String(value), pagina: "1" });

  return (
    <>
      <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Movimientos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ventas y apartados del periodo.
            </Typography>
          </Box>
          <ExportCsvButton
            filename="historial-ventas"
            rows={rows.map((v) => ({
              Folio: v.folio || v.id.slice(0, 8),
              Fecha: v.fecha,
              ...(showSucursal ? { Sucursal: v.sucursal_nombre } : {}),
              Usuario: v.usuario_nombre,
              Tipo: v.tipo_origen,
              Metodo: v.metodo_pago,
              Estado: v.estado,
              Total: v.total_centavos,
              Cliente: v.cliente_nombre,
            }))}
          />
        </Box>
        <BusinessTable
          showRowNumber
          rowNumberPage={page}
          rowNumberPageSize={pageSize}
          minWidth={showSucursal ? 960 : 860}
          headers={[
            { label: "Folio", align: "left" },
            { label: "Fecha" },
            ...(showSucursal ? [{ label: "Sucursal" }] : []),
            { label: "Usuario" },
            { label: "Tipo" },
            { label: "Método" },
            { label: "Estado" },
            { label: "Total", align: "right" },
            { label: "Detalle" },
          ]}
        >
          <TableBody>
            {rows.map((venta, index) => (
              <TableRow key={venta.id} hover>
                <RowNumberCell index={index} />
                <TableCell align="left">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {venta.folio || venta.id.slice(0, 8)}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(venta.fecha).toLocaleString()}</TableCell>
                {showSucursal && <TableCell>{venta.sucursal_nombre}</TableCell>}
                <TableCell>{venta.usuario_nombre}</TableCell>
                <TableCell>{venta.tipo_origen}</TableCell>
                <TableCell>{metodoLabel(venta.metodo_pago)}</TableCell>
                <TableCell>
                  <EstadoChip estado={venta.estado} />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {dineroCentavos(venta.total_centavos)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setSelected(venta)}>
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showSucursal ? 10 : 9} align="center">
                  <EmptyState icon={<ReceiptLongOutlined />} title="No hay registros para los filtros seleccionados." />
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
          onPreviousPage={() => go(page - 1)}
          onNextPage={() => go(page + 1)}
          onPageSizeChange={setPageSize}
          rowLabel="registros"
        />
      </Box>

      <VentaDetalleDialog open={Boolean(selected)} venta={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function metodoLabel(metodo: string): string {
  const map: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    CREDITO: "Crédito",
    APARTADO: "Apartado",
  };
  return map[metodo] ?? metodo;
}

function EstadoChip({ estado }: { estado: string }) {
  const color =
    estado === "COMPLETADA" ? "success" : estado === "CANCELADA" ? "error" : estado === "LIQUIDADO" ? "info" : "warning";
  return (
    <Chip
      size="small"
      label={estado}
      color={color}
      variant="outlined"
      sx={{ borderRadius: "8px", fontWeight: 700 }}
    />
  );
}