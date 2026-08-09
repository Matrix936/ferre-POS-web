"use client";

import type { ReactNode } from "react";
import { Button, CircularProgress, type ButtonProps } from "@mui/material";

interface AsyncButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: ReactNode;
}

// Port de ferre-pos/src/shared/components/AsyncButton.tsx
export default function AsyncButton({
  loading = false,
  loadingText,
  children,
  disabled,
  startIcon,
  endIcon,
  ...props
}: AsyncButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : startIcon}
      endIcon={loading ? undefined : endIcon}
    >
      {loading ? loadingText ?? children : children}
    </Button>
  );
}