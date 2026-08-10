"use client";

import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMediaQuery, useTheme } from "@mui/material";
import { ChartCard } from "@/components/simple-charts";

type Row = {
  fecha: string;
  sucursal_nombre: string;
  total_centavos: number;
  transacciones: number;
};

const fmtSuc = (data: Row[]): Row[] =>
  data.map((r) => ({
    ...r,
    fecha: r.fecha?.slice(0, 10) ?? r.fecha,
  }));

const money = (v: number) => `$${(v / 100).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

export default function VentasPorDiaChart({ data, prev = [] }: { data: Row[]; prev?: Row[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const rows = fmtSuc(data);
  const prevRows = fmtSuc(prev);
  const hasPrev = prevRows.length > 0;
  const prevByFecha = new Map<string, number>(prevRows.map((r) => [r.fecha, Number(r.total_centavos ?? 0)]));
  const chartData = rows.map((r) => ({
    ...r,
    prev_centavos: hasPrev ? (prevByFecha.get(r.fecha) ?? null) : null,
  }));

  return (
    <ChartCard title="Ventas por día" subtitle={hasPrev ? "Periodo actual vs anterior" : isMobile ? "Total del periodo (dinero)" : "Total y transacciones del periodo"}>
      {!rows.length ? (
        <p style={{ color: "#9ca3af" }}>Sin ventas en el rango.</p>
      ) : (
        <div style={{ width: "100%", height: isMobile ? 230 : 260 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 6, right: isMobile ? 4 : 10, left: isMobile ? -8 : 0, bottom: isMobile ? 2 : 0 }}>
              <defs>
                <linearGradient id="ventTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: isMobile ? 9 : 11 }}
                tickFormatter={(v) => v?.slice(5)}
                interval="preserveStartEnd"
                minTickGap={isMobile ? 22 : 28}
              />
              <YAxis
                yAxisId="izq"
                tick={{ fontSize: isMobile ? 9 : 11 }}
                tickFormatter={(v: number) => `$${Math.round(v / 100)}`}
                width={isMobile ? 48 : 70}
              />
              {!isMobile && (
                <YAxis yAxisId="der" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v)} width={30} />
              )}
              <Tooltip
                formatter={(value, name) => {
                  if (name === "total_centavos") return [money(Number(value)), "Total"];
                  if (name === "prev_centavos") return [money(Number(value)), "Periodo anterior"];
                  return [value, "Transacciones"];
                }}
              />
              <Legend
                verticalAlign={isMobile ? "bottom" : "top"}
                wrapperStyle={isMobile ? { fontSize: 11, paddingTop: 6 } : undefined}
                formatter={(v: string) =>
                  v === "total_centavos" ? "Total ($)" : v === "prev_centavos" ? "Periodo anterior" : "Transacciones"
                }
              />
              <Area yAxisId="izq" type="monotone" dataKey="total_centavos" stroke="#2563EB" fill="url(#ventTotal)" name="total_centavos" />
              {hasPrev && (
                <Line
                  yAxisId="izq"
                  type="monotone"
                  dataKey="prev_centavos"
                  stroke="#F59E0B"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  connectNulls
                  dot={false}
                  name="prev_centavos"
                />
              )}
              {!isMobile && (
                <Bar yAxisId="der" dataKey="transacciones" fill="#93c5fd" name="transacciones" radius={[3, 3, 0, 0]} barSize={12} opacity={0.7} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}