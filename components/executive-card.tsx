"use client";

import { Box, Paper, Typography } from "@mui/material";

// Port de la ExecutiveCard del DashboardView del escritorio
// (ferre-pos/src/dashboard/components/DashboardView.tsx:693-731),
// sin onClick (la web es de solo lectura, no navega a módulos).
export function ExecutiveCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
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
        {helper ? (
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}