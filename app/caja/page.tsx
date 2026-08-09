import { Box, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import type { TurnoResumen } from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import TurnosTable from "@/components/turnos-table";

type Props = {
  searchParams: Promise<{ rango?: string }>;
};

export default async function CajaPage({ searchParams }: Props) {
  const { supabase, user, rango, desde, hasta, esDueño, p_sucursal_id } = await dashboardScope(searchParams);

  const iso = { p_desde: desde, p_hasta: hasta };

  const { data: dTurnos } = await supabase.rpc("turnos_resumen", { ...iso, p_sucursal_id, p_limite: 100 });
  const turnos = (Array.isArray(dTurnos) ? dTurnos : []) as TurnoResumen[];

  return (
    <DashboardLayout user={{ email: user.email, rol: (user.app_metadata?.role as string | undefined) ?? undefined }}>
      <Box sx={{ width: "100%", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Caja
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cortes de caja y turnos recientes
              {esDueño ? " · todas las sucursales" : null}
            </Typography>
          </Box>
          <DateRangePicker rango={rango} />
        </Box>

        <TurnosTable data={turnos} />
      </Box>
    </DashboardLayout>
  );
}