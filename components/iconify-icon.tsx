"use client";

import type { ReactElement } from "react";
import { Icon } from "@iconify/react";
import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import { solarIconData } from "@/lib/solar-icons";

// Port de ferre-pos/src/shared/components/IconifyIcon.tsx, pero con datos de
// icono embebidos offline (sin fetch al CDN de Iconify en runtime).
export function IconifyIcon({
  icon,
  ...props
}: { icon: string } & SvgIconProps): ReactElement | null {
  const data = solarIconData(icon);
  if (!data) return null;
  return (
    <SvgIcon {...props}>
      <Icon icon={data} width="100%" height="100%" />
    </SvgIcon>
  );
}