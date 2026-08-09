"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

type Row = { metodo_pago: string; total_centavos: number; transacciones: number };

const PALETTE = ["#1d4ed8", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const money = (v: number) => `$${(v / 100).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

export default function VentasPorMetodoChart({ data }: { data: Row[] }) {
  const rows = (data ?? []).map((r) => ({ ...r, name: r.metodo_pago, value: r.total_centavos }));

  if (!rows.length) {
    return <p style={{ color: "#9ca3af" }}>Sin datos.</p>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="metodo_pago" innerRadius={50} outerRadius={90} paddingAngle={2} label={(p) => (p as { metodo_pago?: string }).metodo_pago ?? ""}>
            {rows.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => money(Number(v))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}