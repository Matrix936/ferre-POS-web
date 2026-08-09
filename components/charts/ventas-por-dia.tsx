"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

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

export default function VentasPorDiaChart({ data }: { data: Row[] }) {
  const rows = fmtSuc(data);

  if (!rows.length) {
    return <p style={{ color: "#9ca3af" }}>Sin ventas en el rango.</p>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ventTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
          <YAxis yAxisId="izq" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${Math.round(v / 100)}`} width={70} />
          <YAxis yAxisId="der" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v)} width={30} />
          <Tooltip
            formatter={(value, name) =>
              name === "total_centavos" ? [money(Number(value)), "Total"] : [value, "Transacciones"]
            }
          />
          <Legend formatter={(v: string) => (v === "total_centavos" ? "Total ($)" : "Transacciones")} />
          <Area yAxisId="izq" type="monotone" dataKey="total_centavos" stroke="#1d4ed8" fill="url(#ventTotal)" name="total_centavos" />
          <Bar yAxisId="der" dataKey="transacciones" fill="#93c5fd" name="transacciones" radius={[3, 3, 0, 0]} barSize={12} opacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}