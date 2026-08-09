import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RANGOS, rangoAFechas, type Rango } from "@/lib/format";
import {
  fila,
  type IndicadorVentas,
  type VentaPorMetodo,
  type ProductoMasVendido,
  type InventarioResumen,
  type ProductoBajoStock,
  type VentaPorDia,
  type VentaPorSucursal,
} from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import KpiCard from "@/components/kpi-card";
import VentasPorDiaChart from "@/components/charts/ventas-por-dia";
import VentasPorMetodoChart from "@/components/charts/ventas-por-metodo";
import ProductosMasVendidosChart from "@/components/charts/productos-mas-vendidos";
import VentasPorSucursalChart from "@/components/charts/ventas-por-sucursal";
import InventarioBajoStockTable from "@/components/inventario-bajo-stock-table";

type Props = {
  searchParams: Promise<{ rango?: string }>;
};

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "1.25rem",
  boxShadow: "0 1px 2px rgba(0,0,0,.04)",
} as const;

const sectionTitle = {
  fontSize: "1.05rem",
  margin: "0 0 1rem",
  color: "#111827",
} as const;

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const raw = sp.rango;
  const rango: Rango = RANGOS.some((r) => r.value === raw) ? (raw as Rango) : "30d";
  const { desde, hasta } = rangoAFechas(rango);

  // Scope por rol: SUPERADMIN/ADMIN ven todas las sucursales (p_sucursal_id = null).
  const rol = user.app_metadata?.role ?? null;
  const esDueño = rol === "SUPERADMIN" || rol === "ADMIN";
  const p_sucursal_id = esDueño ? null : (user.app_metadata?.sucursal_id ?? null);

  const rpcOpts = { p_sucursal_id };
  const iso = { p_desde: desde, p_hasta: hasta };

const [{ data: dVentas }, { data: dMetodo }, { data: dTop }, { data: dInv }, { data: dBajo }, { data: dDia }, { data: dSuc }] =
    await Promise.all([
      supabase.rpc("indicador_ventas", { ...iso, ...rpcOpts, p_metodo_pago: null }),
      supabase.rpc("ventas_por_metodo", { ...iso, p_sucursal_id }),
      supabase.rpc("productos_mas_vendidos", { ...iso, p_sucursal_id, p_limite: 5 }),
      supabase.rpc("inventario_resumen", rpcOpts),
      supabase.rpc("inventario_bajo_stock", { p_sucursal_id, p_limite: 50 }),
      supabase.rpc("ventas_por_dia", { ...iso, p_sucursal_id }),
      supabase.rpc("ventas_por_sucursal", iso),
    ]);

  const ind = fila<IndicadorVentas>(dVentas);
  const metodo = (Array.isArray(dMetodo) ? dMetodo : []) as VentaPorMetodo[];
  const top = (Array.isArray(dTop) ? dTop : []) as ProductoMasVendido[];
  const inv = fila<InventarioResumen>(dInv);
  const bajo = (Array.isArray(dBajo) ? dBajo : []) as ProductoBajoStock[];
  const porDia = (Array.isArray(dDia) ? dDia : []) as VentaPorDia[];
  const porSuc = (Array.isArray(dSuc) ? dSuc : []) as VentaPorSucursal[];

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Panel de indicadores</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#6b7280" }}>
            Conectado como <strong>{user.email}</strong>
            {esDueño ? <> · <strong>todas las sucursales</strong></> : user.app_metadata?.sucursal_id ? <> · sucursal</> : null}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <DateRangePicker rango={rango} />
          <form action={"/auth/signout"} method="post">
            <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {ind ? (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <KpiCard label="Total vendido" value={ind.total_vendido_centavos} moneda />
          <KpiCard label="Transacciones (completadas)" value={ind.transacciones} />
          <KpiCard label="Ticket promedio" value={ind.ticket_promedio_centavos} moneda />
          <KpiCard label="Ventas canceladas" value={ind.ventas_canceladas} />
          <KpiCard label="Crédito" value={ind.ventas_credito_centavos} moneda />
          <KpiCard label="Contado" value={ind.ventas_contado_centavos} moneda />
        </section>
      ) : (
        <p style={{ color: "#6b7280" }}>Sin datos de ventas en este rango.</p>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={card}>
          <h2 style={sectionTitle}>Ventas por día</h2>
          <VentasPorDiaChart data={porDia} />
        </div>
        <div style={card}>
          <h2 style={sectionTitle}>Por método de pago</h2>
          <VentasPorMetodoChart data={metodo} />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={card}>
          <h2 style={sectionTitle}>Top productos más vendidos</h2>
          <ProductosMasVendidosChart data={top} />
        </div>
        <div style={card}>
          <h2 style={sectionTitle}>Ventas por sucursal</h2>
          <VentasPorSucursalChart data={porSuc} />
        </div>
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>Inventario</h2>
        {inv ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <KpiCard label="Productos en inventario" value={inv.productos_en_inventario} />
              <KpiCard label="Valor (costo)" value={inv.valor_centavos} moneda />
              <KpiCard label="Stock total" value={inv.stock_total} />
              <KpiCard label="Bajo stock" value={inv.stock_bajo} />
              <KpiCard label="Sin stock" value={inv.sin_stock} />
              <KpiCard label="Sobre stock" value={inv.sobre_stock} />
            </div>
            <InventarioBajoStockTable data={bajo} />
          </>
        ) : (
          <p style={{ color: "#6b7280" }}>Sin datos de inventario.</p>
        )}
      </section>

      <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "#9ca3af" }}>
        Fase 1 · dashboard de solo lectura · <Link href="/login">Ir al inicio de sesión</Link>
      </p>
    </main>
  );
}