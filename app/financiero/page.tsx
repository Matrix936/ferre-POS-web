import { Box, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import { fila, type FinancieroResumen, type VentaPorMetodo, type AgingRow, type CxPAgingRow } from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import FinancieroTabs from "@/components/financiero-tabs";

type Props = {
  searchParams: Promise<{ rango?: string }>;
};

export default async function FinancieroPage({ searchParams }: Props) {
  const { supabase, user, rango, desde, hasta, esDueño, p_sucursal_id } = await dashboardScope(searchParams);

  const iso = { p_desde: desde, p_hasta: hasta };

  const [{ data: dResumen }, { data: dMetodo }, { data: dCxC }, { data: dCxP }] = await Promise.all([
    supabase.rpc("financiero_resumen", { ...iso, p_sucursal_id }),
    supabase.rpc("ventas_por_metodo", { ...iso, p_sucursal_id }),
    supabase.rpc("cuentas_por_cobrar_aging", { p_sucursal_id }),
    supabase.rpc("cuentas_por_pagar_aging", { p_sucursal_id }),
  ]);

  const resumen = fila<FinancieroResumen>(dResumen) ?? ({} as FinancieroResumen);
  const metodo = (Array.isArray(dMetodo) ? dMetodo : []) as VentaPorMetodo[];
  const cxc = (Array.isArray(dCxC) ? dCxC : []) as AgingRow[];
  const cxp = (Array.isArray(dCxP) ? dCxP : []) as CxPAgingRow[];

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
              {esDueño ? " · todas las sucursales" : null}
            </Typography>
          </Box>
          <DateRangePicker rango={rango} />
        </Box>

        <FinancieroTabs resumen={resumen} metodo={metodo} edadCxC={cxc} edadCxP={cxp} />
      </Box>
    </DashboardLayout>
  );
}