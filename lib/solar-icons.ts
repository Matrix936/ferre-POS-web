import type { IconifyIcon } from "@iconify/react";

// Iconos Solar embebidos offline (solo los usados) para no depender del CDN
// de Iconify en runtime. Extraídos de @iconify-json/solar/icons.json.
// Paridad con los nombres del escritorio (Sidebar.tsx → solar:*-line-duotone).
export const SOLAR_WIDGET_3: IconifyIcon = {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 6.5a4 4 0 1 1 8 0a4 4 0 0 1-8 0Zm11 11a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z" opacity=".5"/><path d="M21.5 6.5a4 4 0 1 0-8 0a4 4 0 0 0 8 0Zm-11 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0Z"/></g>',
};

export const SOLAR_CHART_2: IconifyIcon = {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 22h18" opacity=".5"/><path d="M3 11c0-.943 0-1.414.293-1.707S4.057 9 5 9s1.414 0 1.707.293S7 10.057 7 11v6c0 .943 0 1.414-.293 1.707S5.943 19 5 19s-1.414 0-1.707-.293S3 17.943 3 17zm7-4c0-.943 0-1.414.293-1.707S11.057 5 12 5s1.414 0 1.707.293S14 6.057 14 7v10c0 .943 0 1.414-.293 1.707S12.943 19 12 19s-1.414 0-1.707-.293S10 17.943 10 17zm7-3c0-.943 0-1.414.293-1.707S18.057 2 19 2s1.414 0 1.707.293S21 3.057 21 4v13c0 .943 0 1.414-.293 1.707S19.943 19 19 19s-1.414 0-1.707-.293S17 17.943 17 17z"/></g>',
};

export const SOLAR_WALLET_MONEY: IconifyIcon = {
  body: '<g fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9h4" opacity=".5"/><path stroke-width="1.5" d="M20.833 10h-2.602C16.446 10 15 11.343 15 13s1.447 3 3.23 3h2.603c.084 0 .125 0 .16-.002c.54-.033.97-.432 1.005-.933c.002-.032.002-.071.002-.148v-3.834c0-.077 0-.116-.002-.148c-.036-.501-.465-.9-1.005-.933c-.035-.002-.076-.002-.16-.002Z"/><path stroke-width="1.5" d="M20.965 10c-.078-1.872-.328-3.02-1.137-3.828C18.657 5 16.771 5 13 5h-3C6.229 5 4.343 5 3.172 6.172S2 9.229 2 13s0 5.657 1.172 6.828S6.229 21 10 21h3c3.771 0 5.657 0 6.828-1.172c.809-.808 1.06-1.956 1.137-3.828"/><path stroke-linecap="round" stroke-width="1.5" d="m6 5l3.735-2.477a3.24 3.24 0 0 1 3.53 0L17 5" opacity=".5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.991 13H18" opacity=".5"/></g>',
};

export const SOLAR_CARD: IconifyIcon = {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12s0 5.657-1.172 6.828S17.771 20 14 20h-4c-3.771 0-5.657 0-6.828-1.172S2 15.771 2 12Z"/><path stroke-linecap="round" d="M10 16H6m8 0h-1.5M2 10h20" opacity=".5"/></g>',
};

export const SOLAR_CASH_OUT: IconifyIcon = {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18.667 12C20.55 11.721 22 10.046 22 8.02C22 5.8 20.259 4 18.111 4H5.89C3.74 4 2 5.8 2 8.02c0 2.026 1.449 3.701 3.333 3.98" opacity=".5"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v7m0 0l2-2.333M12 14l-2-2.333"/><path d="M5 11c0-1.886 0-2.828.586-3.414S7.114 7 9 7h6c1.886 0 2.828 0 3.414.586S19 9.114 19 11v6c0 1.886 0 2.828-.586 3.414S16.886 21 15 21H9c-1.886 0-2.828 0-3.414-.586S5 18.886 5 17z"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 18h14" opacity=".5"/></g>',
};

const REGISTRO: Record<string, IconifyIcon> = {
  "solar:widget-3-line-duotone": SOLAR_WIDGET_3,
  "solar:chart-2-line-duotone": SOLAR_CHART_2,
  "solar:wallet-money-line-duotone": SOLAR_WALLET_MONEY,
  "solar:card-line-duotone": SOLAR_CARD,
  "solar:cash-out-line-duotone": SOLAR_CASH_OUT,
};

export function solarIconData(nombre: string): IconifyIcon | undefined {
  return REGISTRO[nombre];
}