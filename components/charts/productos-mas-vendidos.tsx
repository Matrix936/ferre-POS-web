"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Row = { descripcion: string; unidades_vendidas: number };

export default function ProductosMasVendidosChart({ data }: { data: Row[] }) {
  const rows = (data ?? []).map((r) => ({
    ...r,
    descripcion: r.descripcion && r.descripcion.length > 22 ? r.descripcion.slice(0, 20) + "…" : r.descripcion,
  }));

  if (!rows.length) {
    return <p style={{ color: "#9ca3af" }}>Sin datos.</p>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="descripcion" width={190} tick={{ fontSize: 11 }} tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 26) + "…" : v)} />
          <Tooltip formatter={(v) => [v, "Unidades"]} />
          <Bar dataKey="unidades_vendidas" fill="#0ea5e9" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}