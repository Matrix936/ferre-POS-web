import { Box, CircularProgress, Typography } from "@mui/material";

export default function FinancieroLoading() {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        Cargando indicadores financieros...
      </Typography>
    </Box>
  );
}