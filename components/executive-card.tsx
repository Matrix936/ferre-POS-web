"use client";

import { Box, Paper, Typography } from "@mui/material";
import { ArrowDownward as ArrowDownwardIcon, ArrowUpward as ArrowUpwardIcon } from "@mui/icons-material";

// Port de la ExecutiveCard del DashboardView del escritorio
// (ferre-pos/src/dashboard/components/DashboardView.tsx:693-731),
// sin onClick (la web es de solo lectura, no navega a módulos).
// `delta` es un porcentaje de cambio vs periodo anterior (opcional); si es
// null no se muestra. Positivo ▲ verde, negativo ▼ rojo.
export function ExecutiveCard({ label, value, helper, delta }: { label: string; value: string; helper?: string; delta?: number | null }) {
  const hasDelta = delta !== undefined && delta !== null;
  const deltaUp = hasDelta && (delta as number) >= 0;

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        transition: "box-shadow 160ms ease, background-color 160ms ease",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 800 }}>
          {label}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            mt: 1,
            fontSize: { xs: "1.4rem", sm: "2.125rem" },
            lineHeight: 1.2,
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </Typography>
        <Box
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            minHeight: 20,
          }}
        >
          {hasDelta ? (
            <>
              {deltaUp ? (
                <ArrowUpwardIcon fontSize="inherit" sx={{ fontSize: 17, color: "success.main" }} />
              ) : (
                <ArrowDownwardIcon fontSize="inherit" sx={{ fontSize: 17, color: "error.main" }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: deltaUp ? "success.main" : "error.main",
                }}
              >
                {Math.abs(delta as number).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs periodo anterior
              </Typography>
            </>
          ) : helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}