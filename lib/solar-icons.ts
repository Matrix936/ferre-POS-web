import type { IconifyIcon } from "@iconify/react";

// Iconos Solar embebidos offline (solo los usados) para no depender del CDN
// de Iconify en runtime. Extraídos de @iconify-json/solar/icons.json.
// Paridad con los nombres del escritorio (Sidebar.tsx → solar:widget-3-line-duotone).
export const SOLAR_WIDGET_3: IconifyIcon = {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 6.5a4 4 0 1 1 8 0a4 4 0 0 1-8 0Zm11 11a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z" opacity=".5"/><path d="M21.5 6.5a4 4 0 1 0-8 0a4 4 0 0 0 8 0Zm-11 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0Z"/></g>',
};

const REGISTRO: Record<string, IconifyIcon> = {
  "solar:widget-3-line-duotone": SOLAR_WIDGET_3,
};

export function solarIconData(nombre: string): IconifyIcon | undefined {
  return REGISTRO[nombre];
}