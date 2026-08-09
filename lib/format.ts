export type Rango = "hoy" | "7d" | "30d" | "todo";

const MS_HORA = 3600000;

// Céntimos → $MXN formateado (Intl, es-MX; enteros sin decimales)
export function dineroCentavos(centavos: number | bigint | null | undefined): string {
  const n = Number(centavos ?? 0) / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function cantidad(n: number | bigint | null | undefined): string {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(n ?? 0));
}

export const RANGOS: { value: Rango; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "todo", label: "Todo" },
];

// Fecha civil (yyyy-MM-dd) del instante dado en la zona America/Mexico_City.
function mexicoClave(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha); // en-CA → yyyy-MM-dd
}

// Media noche local de México (UTC-6, sin DST desde 2022) ⇒ 06:00 UTC.
function mexicoMedianoche(clave: string): Date {
  return new Date(`${clave}T06:00:00.000Z`);
}

// Resuelve rango → intervalos {desde, hasta} como instantes Date (límites en
// hora de México). `todo` devuelve null/null (sin filtro).
export function rangoAFechas(r: Rango, ahora = new Date()): { desde: Date | null; hasta: Date | null } {
  const hoy = mexicoMedianoche(mexicoClave(ahora));
  switch (r) {
    case "hoy":
      return { desde: hoy, hasta: new Date(hoy.getTime() + 24 * MS_HORA) };
    case "7d":
      return { desde: new Date(hoy.getTime() - 6 * 24 * MS_HORA), hasta: new Date(hoy.getTime() + 24 * MS_HORA) };
    case "30d":
      return { desde: new Date(hoy.getTime() - 29 * 24 * MS_HORA), hasta: new Date(hoy.getTime() + 24 * MS_HORA) };
    case "todo":
      return { desde: null, hasta: null };
  }
}

// Convierte fecha a 'yyyy-MM-dd' (para params de ventas_por_dia/ventas_por_sucursal)
export function toFechaISO(d: Date | null): string {
  return d ? mexicoClave(d) : "";
}
