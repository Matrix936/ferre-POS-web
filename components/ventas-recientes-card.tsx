import { Box, Chip, Paper, Typography } from "@mui/material";
import { ReceiptLongOutlined } from "@mui/icons-material";
import { dineroCentavos } from "@/lib/format";
import type { VentaReciente } from "@/lib/dashboard-types";
import { EmptyState } from "@/components/empty-state";

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

function estadoColor(estado: string): "error" | "warning" | "success" | "info" {
  switch (estado) {
    case "COMPLETADA":
      return "success";
    case "CANCELADA":
      return "error";
    case "LIQUIDADO":
      return "info";
    default:
      return "warning";
  }
}

export default function VentasRecientesCard({ data }: { data: VentaReciente[] }) {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          Ventas recientes
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Últimos movimientos del periodo.
        </Typography>
      </Box>

      {data.length === 0 ? (
        <Box sx={{ py: 4 }}>
          <EmptyState icon={<ReceiptLongOutlined />} title="Sin ventas en el rango." />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {data.map((v, i) => (
            <Box
              key={v.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1,
                borderTop: i === 0 ? "none" : "1px dashed",
                borderColor: "divider",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {v.folio || v.id.slice(0, 8)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {new Date(v.fecha).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {v.cliente_nombre ? ` · ${v.cliente_nombre}` : ""}
                </Typography>
              </Box>
              <Chip size="small" label={metodoLabel(v.metodo_pago)} variant="outlined" sx={{ borderRadius: "8px", fontWeight: 700 }} />
              {v.tipo_origen === "APARTADO" ? (
                <Chip size="small" label="Apartado" color="warning" variant="outlined" sx={{ borderRadius: "8px", fontWeight: 700 }} />
              ) : (
                <Chip size="small" label={v.estado} color={estadoColor(v.estado)} variant="outlined" sx={{ borderRadius: "8px", fontWeight: 700 }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 900, minWidth: 90, textAlign: "right" }}>
                {dineroCentavos(v.total_centavos)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}