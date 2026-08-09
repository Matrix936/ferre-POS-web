"use client";

import { Box, CircularProgress, Drawer, IconButton, TableBody, TableCell, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Close as CloseIcon, ReceiptLongOutlined } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dineroCentavos } from "@/lib/format";
import type { HistorialVentaDetalle, HistorialVentaRow } from "@/lib/dashboard-types";
import { BusinessTable } from "@/components/business-table";
import { EmptyState } from "@/components/empty-state";

// Port del detalle read-only (sin acciones de escritura) de HistorialVentas.tsx.
export default function VentaDetalleDialog({
  open,
  venta,
  onClose,
}: {
  open: boolean;
  venta: HistorialVentaRow | null;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<HistorialVentaDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (!open || !venta) return;
    let active = true;
    setDetalle([]);
    setError("");
    setLoading(true);
    const supabase = createClient();
    const load = async () => {
      try {
        const { data, error } = await supabase.rpc("venta_detalle", { p_venta_id: venta.id });
        if (!active) return;
        if (error) {
          setError(Array.isArray(error.message) ? error.message[0] : error.message);
        } else {
          setDetalle((Array.isArray(data) ? data : []) as HistorialVentaDetalle[]);
        }
      } catch (err) {
        if (active) setError(String(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [open, venta]);

  const esApartado = venta?.tipo_origen === "APARTADO";
  const hayDevoluciones = detalle.some((d) => Number(d.cantidad_devuelta ?? 0) > 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        paper: { sx: { width: { xs: "100%", sm: 680 }, maxWidth: "100%", bgcolor: "background.default", borderRadius: { sm: "8px 0 0 8px" } } },
      }}
    >
      <Box sx={{ p: 3, overflowY: "auto", height: "100%" }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {esApartado ? "Detalle de Apartado" : "Detalle de Venta"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
              {venta?.folio || (venta?.id ?? "").slice(0, 8)}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Cerrar detalle" edge="end" sx={{ mt: -0.5, mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {error && <Typography variant="body2" color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}

        {!loading && !error && venta && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <DetailRow label="Estado" value={venta.estado} />
              <DetailRow label="Sucursal" value={venta.sucursal_nombre} />
              <DetailRow label="Cajero" value={venta.usuario_nombre} />
              <DetailRow label="Método" value={venta.metodo_pago} />
              {venta.cliente_nombre ? <DetailRow label="Cliente" value={venta.cliente_nombre} /> : null}
              <DetailRow label="Fecha" value={new Date(venta.fecha).toLocaleString()} />
            </Box>

            {hayDevoluciones && (
              <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                Esta venta tiene devoluciones registradas. Los productos con cantidad devuelta están marcados.
              </Typography>
            )}

            <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
              <BusinessTable
                size={isMobile ? "small" : "medium"}
                minWidth={560}
                headers={[
                  { label: "Producto", align: "left", width: "40%" },
                  { label: "Marca" },
                  { label: "Cant.", align: "right" },
                  { label: "Precio", align: "right" },
                  { label: "Subtotal", align: "right" },
                ]}
              >
                <TableBody>
                  {detalle.map((d) => {
                    const importe =
                      Number(d.cantidad ?? 0) * Number(d.precio_venta_pactado_centavos ?? 0) -
                      Number(d.descuento_aplicado_centavos ?? 0);
                    return (
                      <TableRow key={d.id} hover>
                        <TableCell align="left">
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {d.descripcion}
                          </Typography>
                          {Number(d.cantidad_devuelta ?? 0) > 0 ? (
                            <Typography variant="caption" color="info.main">
                              Devuelto: {d.cantidad_devuelta}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{d.marca || "-"}</TableCell>
                        <TableCell align="right">{d.cantidad}</TableCell>
                        <TableCell align="right">{dineroCentavos(d.precio_venta_pactado_centavos)}</TableCell>
                        <TableCell align="right">{dineroCentavos(importe)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {detalle.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <EmptyState icon={<ReceiptLongOutlined />} title="Sin productos registrados." />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </BusinessTable>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <SummaryRow label="Total" value={dineroCentavos(venta.total_centavos)} bold />
              {esApartado && (
                <>
                  <SummaryRow label="Anticipo" value={dineroCentavos(venta.anticipo_total_centavos)} />
                  <SummaryRow label="Saldo pendiente" value={dineroCentavos(venta.saldo_pendiente_centavos)} />
                  <SummaryRow label="Vencimiento" value={venta.fecha_vencimiento ? new Date(venta.fecha_vencimiento).toLocaleDateString() : "-"} />
                </>
              )}
              {venta.metodo_pago === "EFECTIVO" && venta.efectivo_recibido_centavos !== null && (
                <>
                  <SummaryRow label="Recibido" value={dineroCentavos(venta.efectivo_recibido_centavos)} />
                  <SummaryRow label="Cambio" value={dineroCentavos(venta.cambio_entregado_centavos)} />
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 900 : 800 }}>
        {value}
      </Typography>
    </Box>
  );
}