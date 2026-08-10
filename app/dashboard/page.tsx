import { Box, Chip, Paper, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import { deltaPorcentaje, dineroCentavos, cantidad, periodoAnterior } from "@/lib/format";
import {
  fila,
  type IndicadorVentas,
  type VentaPorMetodo,
  type ProductoMasVendido,
  type InventarioResumen,
  type ProductoBajoStock,
  type VentaPorDia,
  type VentaPorSucursal,
  type RentabilidadResumen,
  type VentaReciente,
} from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import SucursalFilter from "@/components/sucursal-filter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExecutiveCard } from "@/components/executive-card";
import { SimpleDonutChart } from "@/components/simple-charts";
import VentasPorDiaChart from "@/components/charts/ventas-por-dia";
import ProductosMasVendidosChart from "@/components/charts/productos-mas-vendidos";
import VentasPorSucursalChart from "@/components/charts/ventas-por-sucursal";
import InventarioBajoStockTable from "@/components/inventario-bajo-stock-table";
import VentasRecientesCard from "@/components/ventas-recientes-card";

type Props = {
  searchParams: Promise<{ rango?: string; sucursal?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { supabase, user, rol, rango, desde, hasta, esDueño, p_sucursal_id, sucursal, sucursales, sucursalNombre } = await dashboardScope(searchParams);

  const rpcOpts = { p_sucursal_id };
  const iso = { p_desde: desde, p_hasta: hasta };
  const prev = periodoAnterior(desde, hasta);
  const prevIso = { p_desde: prev.desde, p_hasta: prev.hasta };

  const [{ data: dVentas }, { data: dMetodo }, { data: dTop }, { data: dInv }, { data: dBajo }, { data: dDia }, { data: dSuc }, { data: dRent }, { data: dVentasPrev }, { data: dRentPrev }, { data: dDiaPrev }, { data: dRec }] =
    await Promise.all([
      supabase.rpc("indicador_ventas", { ...iso, ...rpcOpts, p_metodo_pago: null }),
      supabase.rpc("ventas_por_metodo", { ...iso, p_sucursal_id }),
      supabase.rpc("productos_mas_vendidos", { ...iso, p_sucursal_id, p_limite: 5 }),
      supabase.rpc("inventario_resumen", rpcOpts),
      supabase.rpc("inventario_bajo_stock", { p_sucursal_id, p_limite: 50 }),
      supabase.rpc("ventas_por_dia", { ...iso, p_sucursal_id }),
      supabase.rpc("ventas_por_sucursal", iso),
      supabase.rpc("rentabilidad_resumen", { ...iso, ...rpcOpts }),
      supabase.rpc("indicador_ventas", { ...prevIso, ...rpcOpts, p_metodo_pago: null }),
      supabase.rpc("rentabilidad_resumen", { ...prevIso, ...rpcOpts }),
      supabase.rpc("ventas_por_dia", { ...prevIso, p_sucursal_id }),
      supabase.rpc("dashboard_recientes", { ...iso, p_sucursal_id, p_limite: 6 }),
    ]);

  const ind = fila<IndicadorVentas>(dVentas);
  const metodo = (Array.isArray(dMetodo) ? dMetodo : []) as VentaPorMetodo[];
  const top = (Array.isArray(dTop) ? dTop : []) as ProductoMasVendido[];
  const inv = fila<InventarioResumen>(dInv);
  const bajo = (Array.isArray(dBajo) ? dBajo : []) as ProductoBajoStock[];
  const porDia = (Array.isArray(dDia) ? dDia : []) as VentaPorDia[];
  const porSuc = (Array.isArray(dSuc) ? dSuc : []) as VentaPorSucursal[];
  const porDiaPrev = (Array.isArray(dDiaPrev) ? dDiaPrev : []) as VentaPorDia[];
  const recientes = (Array.isArray(dRec) ? dRec : []) as VentaReciente[];
  const rent = fila<RentabilidadResumen>(dRent);
  const indPrev = fila<IndicadorVentas>(dVentasPrev);
  const rentPrev = fila<RentabilidadResumen>(dRentPrev);

  // Si se seleccionó una sucursal, acota la vista por-sucursal a la elegida.
  const porSucFiltrado = p_sucursal_id ? porSuc.filter((s) => s.sucursal_id === p_sucursal_id) : porSuc;

  const donutData = metodo.map((m) => ({
    label: (m.metodo_pago?.[0]?.toUpperCase() ?? "") + (m.metodo_pago?.slice(1) ?? ""),
    value: Number(m.total_centavos ?? 0),
  }));

  const totalVendido = Number(ind?.total_vendido_centavos ?? 0);
  const transacciones = Number(ind?.transacciones ?? 0);
  const ticketPromedio = Number(ind?.ticket_promedio_centavos ?? 0);
  const ventasCanceladas = Number(ind?.ventas_canceladas ?? 0);
  const credito = Number(ind?.ventas_credito_centavos ?? 0);
  const contado = Number(ind?.ventas_contado_centavos ?? 0);
  const valorInventario = Number(inv?.valor_centavos ?? 0);
  const stockTotal = Number(inv?.stock_total ?? 0);
  const stockBajo = Number(inv?.stock_bajo ?? bajo.length);
  const sinStock = Number(inv?.sin_stock ?? 0);
  const sobreStock = Number(inv?.sobre_stock ?? 0);

  const utilidad = Number(rent?.utilidad_centavos ?? 0);
  const margen = Number(rent?.margen_porcentaje ?? 0);
  const deltaVentas = deltaPorcentaje(totalVendido, Number(indPrev?.total_vendido_centavos ?? 0));
  const deltaUtilidad = deltaPorcentaje(utilidad, Number(rentPrev?.utilidad_centavos ?? 0));

  return (
    <DashboardLayout
      user={{ email: user.email, rol: rol ?? undefined }}
    >
      <Box sx={{ width: "100%", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Dashboard Analítico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conectado como <strong>{user.email}</strong>
              {esDueño ? sucursalNombre ? <> · <strong>{sucursalNombre}</strong></> : <> · <strong>todas las sucursales</strong></> : user.app_metadata?.sucursal_id ? <> · sucursal</> : null}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {esDueño && <SucursalFilter sucursal={sucursal} sucursales={sucursales} />}
            <DateRangePicker rango={rango} />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
          <ExecutiveCard label="Ventas" value={dineroCentavos(totalVendido)} delta={deltaVentas} helper={ind ? `${cantidad(transacciones)} tickets` : undefined} />
          <ExecutiveCard label="Utilidad neta" value={dineroCentavos(utilidad)} delta={deltaUtilidad} helper={`Margen ${margen.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`} />
          <ExecutiveCard label="Ticket promedio" value={dineroCentavos(ticketPromedio)} helper="Venta promedio por ticket" />
          <ExecutiveCard label="Ventas canceladas" value={cantidad(ventasCanceladas)} helper="Operaciones canceladas" />
          <ExecutiveCard label="Crédito" value={dineroCentavos(credito)} helper="Crédito pendiente" />
          <ExecutiveCard label="Contado" value={dineroCentavos(contado)} helper="Ventas de contado" />
          <ExecutiveCard label="Inventario valuado" value={dineroCentavos(valorInventario)} helper={`${cantidad(stockTotal)} piezas`} />
          <ExecutiveCard label="Stock bajo" value={cantidad(stockBajo)} helper={`${cantidad(sinStock)} sin stock`} />
          <ExecutiveCard label="Sobreinventario" value={cantidad(sobreStock)} helper="Capital detenido" />
        </Box>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Alertas gerenciales
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip size="small" label={`${cantidad(stockBajo)} productos en bajo stock`} color={stockBajo > 0 ? "warning" : "success"} variant="outlined" />
            <Chip size="small" label={`${cantidad(sinStock)} productos sin stock`} color={sinStock > 0 ? "error" : "success"} variant="outlined" />
            <Chip size="small" label={`${cantidad(sobreStock)} sobreinventario`} color={sobreStock > 0 ? "info" : "success"} variant="outlined" />
            <Chip size="small" label={`${cantidad(ventasCanceladas)} ventas canceladas`} color={ventasCanceladas > 0 ? "warning" : "success"} variant="outlined" />
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.25fr 0.75fr" }, mb: 2 }}>
          <Box sx={{ width: "100%" }}>
            <ProductosMasVendidosChart data={top} />
          </Box>
          <Box sx={{ width: "100%" }}>
            <SimpleDonutChart title="Ingresos por forma de pago" subtitle="Composición del periodo" data={donutData} format="currency" />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
          <VentasPorDiaChart data={porDia} prev={porDiaPrev} />
          <VentasPorSucursalChart data={porSucFiltrado} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.3fr 0.7fr" }, mb: 2, alignItems: "stretch" }}>
          <InventarioBajoStockTable data={bajo} />
          <VentasRecientesCard data={recientes} />
        </Box>
      </Box>
    </DashboardLayout>
  );
}