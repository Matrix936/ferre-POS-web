"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMediaQuery, useTheme } from "@mui/material";
import { ChartCard } from "@/components/simple-charts";

type Row = { descripcion: string; unidades_vendidas: number };

const truncar = (v: string, largo: number) => (v && v.length > largo ? v.slice(0, largo - 1) + "…" : v);

export default function ProductosMasVendidosChart({ data }: { data: Row[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const rows = (data ?? []).map((r) => ({
    ...r,
    descripcion: truncar(r.descripcion, isMobile ? 14 : 22),
  }));

  return (
    <ChartCard title="Top productos más vendidos" subtitle="Unidades vendidas en el periodo">
      {!rows.length ? (
        <p style={{ color: "#9ca3af" }}>Sin datos.</p>
      ) : (
        <div style={{ width: "100%", height: isMobile ? 230 : 260 }}>
          <ResponsiveContainer>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: isMobile ? -14 : 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: isMobile ? 9 : 11 }} />
              <YAxis
                type="category"
                dataKey="descripcion"
                width={isMobile ? 104 : 190}
                tick={{ fontSize: isMobile ? 9 : 11 }}
                tickFormatter={(v: string) => truncar(v, isMobile ? 16 : 26)}
              />
              <Tooltip formatter={(v) => [v, "Unidades"]} />
              <Bar dataKey="unidades_vendidas" fill="#2563EB" radius={[0, 8, 8, 0]} maxBarSize={isMobile ? 12 : 16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}