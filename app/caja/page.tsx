import { Box, Paper, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import { cantidad, dineroCentavos } from "@/lib/format";
import { fila, type CajaResumen, type TurnoResumen } from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import SucursalFilter from "@/components/sucursal-filter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExecutiveCard } from "@/components/executive-card";
import { SimpleDonutChart } from "@/components/simple-charts";
import TurnosTable from "@/components/turnos-table";

type Props = {
  searchParams: Promise<{ rango?: string; sucursal?: string }>;
};

const ESTADO_LABEL: Record<string, string> = {
  ABIERTA: "Abiertos",
  CERRADA: "Cerrados",
  CON_CORTE: "Con corte",
  CANCELADA: "Cancelados",
};

export default async function CajaPage({ searchParams }: Props) {
  const { supabase, user, rango, desde, hasta, esDueño, p_sucursal_id, sucursal, sucursales, sucursalNombre } = await dashboardScope(searchParams);

  const iso = { p_desde: desde, p_hasta: hasta };

  const [{ data: dTurnos }, { data: dCaja }] = await Promise.all([
    supabase.rpc("turnos_resumen", { ...iso, p_sucursal_id, p_limite: 100 }),
    supabase.rpc("caja_resumen", { ...iso, p_sucursal_id }),
  ]);
  const turnos = (Array.isArray(dTurnos) ? dTurnos : []) as TurnoResumen[];
  const resumen = fila<CajaResumen>(dCaja);

  const nTurnos = Number(resumen?.turnos_total ?? turnos.length);
  const ventasEfectivo = Number(resumen?.ventas_efectivo_centavos ?? 0);
  const ingresos = Number(resumen?.ingresos_centavos ?? 0);
  const egresos = Number(resumen?.egresos_centavos ?? 0);
  const diferenciaNeta = Number(resumen?.diferencia_centavos ?? 0);
  const abiertos = Number(resumen?.turnos_abiertos ?? 0);
  const conDiferencia = Number(resumen?.turnos_con_diferencia ?? 0);

  const estadoTotales = new Map<string, number>();
  turnos.forEach((t) => {
    estadoTotales.set(t.estado, (estadoTotales.get(t.estado) ?? 0) + 1);
  });
  const donutEstados = [...estadoTotales.entries()].map(([estado, value]) => ({
    label: ESTADO_LABEL[estado] ?? estado,
    value,
  }));

  return (
    <DashboardLayout user={{ email: user.email, rol: (user.app_metadata?.role as string | undefined) ?? undefined }}>
      <Box sx={{ width: "100%", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Caja
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cortes de caja y turnos del periodo
              {esDueño ? (sucursalNombre ? ` · ${sucursalNombre}` : " · todas las sucursales") : null}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {esDueño && <SucursalFilter sucursal={sucursal} sucursales={sucursales} />}
            <DateRangePicker rango={rango} />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
          <ExecutiveCard label="Turnos del periodo" value={cantidad(nTurnos)} helper="Sesiones de caja registradas" />
          <ExecutiveCard label="Ventas de contado" value={dineroCentavos(ventasEfectivo)} helper="Efectivo declarado en arqueos" />
          <ExecutiveCard label="Ingresos de caja" value={dineroCentavos(ingresos)} helper="Entradas adicionales (abonos, otros)" />
          <ExecutiveCard label="Egresos de caja" value={dineroCentavos(egresos)} helper="Salidas registradas en el turno" />
          <ExecutiveCard label="Diferencia neta" value={dineroCentavos(diferenciaNeta)} helper={`${cantidad(conDiferencia)} arqueos con diferencia`} />
          <ExecutiveCard label="Turnos abiertos" value={cantidad(abiertos)} helper="Pendientes de corte" />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
          <SimpleDonutChart title="Turnos por estado" subtitle="Distribución de sesiones del periodo" data={donutEstados} format="number" />
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              Consolidado del periodo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Acumulado de ventas y flujo de caja en cortes reportados.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Fila label="Ventas de contado" value={dineroCentavos(ventasEfectivo)} />
              <Fila label="Ingresos" value={dineroCentavos(ingresos)} />
              <Fila label="Egresos" value={dineroCentavos(egresos)} />
              <Fila label="Diferencia neta" value={dineroCentavos(diferenciaNeta)} strong />
            </Box>
          </Paper>
        </Box>

        <TurnosTable data={turnos} />
      </Box>
    </DashboardLayout>
  );
}

function Fila({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 900 : 800 }}>
        {value}
      </Typography>
    </Box>
  );
}