"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartCard } from "@/components/simple-charts";

type Row = { descripcion: string; unidades_vendidas: number };

export default function ProductosMasVendidosChart({ data }: { data: Row[] }) {
  const rows = (data ?? []).map((r) => ({
    ...r,
    descripcion: r.descripcion && r.descripcion.length > 22 ? r.descripcion.slice(0, 20) + "…" : r.descripcion,
  }));

  return (
    <ChartCard title="Top productos más vendidos" subtitle="Unidades vendidas en el periodo">
      {!rows.length ? (
        <p style={{ color: "#9ca3af" }}>Sin datos.</p>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="descripcion" width={190} tick={{ fontSize: 11 }} tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 26) + "…" : v)} />
              <Tooltip formatter={(v) => [v, "Unidades"]} />
              <Bar dataKey="unidades_vendidas" fill="#2563EB" radius={[0, 8, 8, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}