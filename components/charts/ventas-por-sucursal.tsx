"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ChartCard } from "@/components/simple-charts";

type Row = { sucursal_nombre: string; total_centavos: number; transacciones: number };

const money = (v: number) => `$${(v / 100).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

export default function VentasPorSucursalChart({ data }: { data: Row[] }) {
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
            <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
              <XAxis dataKey="sucursal_nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${Math.round(v / 100)}`} width={70} />
              <Tooltip formatter={(v, n) => (n === "total_centavos" ? [money(Number(v)), "Total"] : [v, "Transacciones"])} />
              <Legend formatter={(v: string) => (v === "total_centavos" ? "Total ($)" : "Transacciones")} />
              <Bar dataKey="total_centavos" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}