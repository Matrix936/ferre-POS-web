import { Box, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import { periodoAnterior } from "@/lib/format";
import { fila, type FinancieroResumen, type VentaPorMetodo, type AgingRow, type CxPAgingRow, type MovimientoCajaRow } from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import SucursalFilter from "@/components/sucursal-filter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import FinancieroTabs from "@/components/financiero-tabs";

type Props = {
  searchParams: Promise<{ rango?: string; sucursal?: string }>;
};

export default async function FinancieroPage({ searchParams }: Props) {
  const { supabase, user, rango, desde, hasta, esDueño, p_sucursal_id, sucursal, sucursales, sucursalNombre } = await dashboardScope(searchParams);

  const iso = { p_desde: desde, p_hasta: hasta };
  const prev = periodoAnterior(desde, hasta);
  const prevIso = { p_desde: prev.desde, p_hasta: prev.hasta };

  const [{ data: dResumen }, { data: dMetodo }, { data: dCxC }, { data: dCxP }, { data: dMovCaja }, resumenPrevResult] = await Promise.all([
    supabase.rpc("financiero_resumen", { ...iso, p_sucursal_id }),
    supabase.rpc("ventas_por_metodo", { ...iso, p_sucursal_id }),
    supabase.rpc("cuentas_por_cobrar_aging", { p_sucursal_id }),
    supabase.rpc("cuentas_por_pagar_aging", { p_sucursal_id }),
    supabase.rpc("movimientos_caja", { ...iso, p_sucursal_id, p_pagina: 1, p_por_pagina: 200 }),
    prev.desde ? supabase.rpc("financiero_resumen", { ...prevIso, p_sucursal_id }) : Promise.resolve(null),
  ]);
  const dResumenPrev = resumenPrevResult?.data ?? null;

  const resumen = fila<FinancieroResumen>(dResumen) ?? ({} as FinancieroResumen);
  const resumenPrev = fila<FinancieroResumen>(dResumenPrev);
  const metodo = (Array.isArray(dMetodo) ? dMetodo : []) as VentaPorMetodo[];
  const cxc = (Array.isArray(dCxC) ? dCxC : []) as AgingRow[];
  const cxp = (Array.isArray(dCxP) ? dCxP : []) as CxPAgingRow[];
  const movCaja = (Array.isArray(dMovCaja) ? dMovCaja : []) as MovimientoCajaRow[];

  return (
    <DashboardLayout user={{ email: user.email, rol: (user.app_metadata?.role as string | undefined) ?? undefined }}>
      <Box sx={{ width: "100%", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Financiero
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Caja, ventas por forma de pago y antigüedad de deudas
              {esDueño ? (sucursalNombre ? ` · ${sucursalNombre}` : " · todas las sucursales") : null}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {esDueño && <SucursalFilter sucursal={sucursal} sucursales={sucursales} />}
            <DateRangePicker rango={rango} />
          </Box>
        </Box>

        <FinancieroTabs resumen={resumen} resumenPrev={resumenPrev} metodo={metodo} edadCxC={cxc} edadCxP={cxp} movCaja={movCaja} prevDisponible={Boolean(prev.desde)} />
      </Box>
    </DashboardLayout>
  );
}