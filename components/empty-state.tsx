"use client";

import { cloneElement, type ReactElement } from "react";
import { Box, Typography } from "@mui/material";

// Port de ferre-pos/src/shared/components/EmptyState.tsx
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactElement & { props: Record<string, unknown> };
  title: string;
  message?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.25,
        my: 4,
      }}
    >
      {cloneElement(icon, {
        sx: {
          fontSize: 72,
          opacity: 0.2,
          color: "text.secondary",
          lineHeight: 1,
          ...((icon.props.sx as Record<string, unknown> | undefined) ?? {}),
        },
      } as Record<string, unknown>)}
      <Typography variant="body1" sx={{ fontWeight: 600, color: "text.secondary" }}>
        {title}
      </Typography>
      {message ? (
        <Typography variant="caption" color="text.secondary">
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}