"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useMediaQuery, useTheme } from "@mui/material";
import { ChartCard } from "@/components/simple-charts";

type Row = { sucursal_nombre: string; total_centavos: number; transacciones: number };

const money = (v: number) => `$${(v / 100).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

export default function VentasPorSucursalChart({ data }: { data: Row[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const rows = (data ?? []).map((r) => ({
    ...r,
    sucursal_nombre: r.sucursal_nombre ?? "—",
  }));

  return (
    <ChartCard title="Ventas por sucursal" subtitle="Total del periodo">
      {!rows.length ? (
        <p style={{ color: "#9ca3af" }}>Sin datos.</p>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ top: 6, right: 8, left: isMobile ? -10 : 0, bottom: isMobile ? 2 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
              <XAxis
                dataKey="sucursal_nombre"
                tick={{ fontSize: isMobile ? 9 : 11 }}
                tickFormatter={(v: string) => (isMobile && v && v.length > 8 ? `${v.slice(0, 7)}…` : v)}
                interval={isMobile ? "preserveStartEnd" : 0}
                minTickGap={isMobile ? 12 : 0}
              />
              <YAxis tick={{ fontSize: isMobile ? 9 : 11 }} tickFormatter={(v: number) => `$${Math.round(v / 100)}`} width={isMobile ? 44 : 70} />
              <Tooltip formatter={(v, n) => (n === "total_centavos" ? [money(Number(v)), "Total"] : [v, "Transacciones"])} />
              <Legend verticalAlign={isMobile ? "bottom" : "top"} wrapperStyle={isMobile ? { fontSize: 11, paddingTop: 6 } : undefined} formatter={(v: string) => (v === "total_centavos" ? "Total ($)" : "Transacciones")} />
              <Bar dataKey="total_centavos" fill="#16A34A" radius={[3, 3, 0, 0]} maxBarSize={isMobile ? 24 : 40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}