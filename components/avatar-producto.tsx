"use client";

import { Avatar, type AvatarProps } from "@mui/material";
import { Build as BuildIcon } from "@mui/icons-material";

// Port de ferre-pos/src/shared/components/AvatarProductoTruper.tsx SIN Tauri:
// la web no expone fotos locales, así que siempre se muestra el fallback de
// icono (BuildIcon gris) en el mismo avatar redondeado con borde del escritorio.
export function AvatarProducto({
  codigo,
  descripcion,
  sx,
  ...props
}: AvatarProps & { codigo?: string; descripcion?: string }) {
  void codigo;
  void descripcion;
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 48,
        height: 48,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        ...sx,
      }}
      {...props}
    >
      <BuildIcon color="action" sx={{ opacity: 0.5 }} />
    </Avatar>
  );
}