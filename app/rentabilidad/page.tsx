import { Box, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import { deltaPorcentaje, dineroCentavos, periodoAnterior } from "@/lib/format";
import { fila, type RentabilidadResumen, type ProductoRentabilidad } from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExecutiveCard } from "@/components/executive-card";
import { SimpleBarChart, SimpleDonutChart } from "@/components/simple-charts";
import RentabilidadProductosTable from "@/components/rentabilidad-productos-table";

type Props = {
  searchParams: Promise<{ rango?: string }>;
};

export default async function RentabilidadPage({ searchParams }: Props) {
  const { supabase, user, rango, desde, hasta, esDueño, p_sucursal_id } = await dashboardScope(searchParams);

  const iso = { p_desde: desde, p_hasta: hasta };
  const prev = periodoAnterior(desde, hasta);
  const prevIso = { p_desde: prev.desde, p_hasta: prev.hasta };

  const [{ data: dResumen }, resumenPrevResult, { data: dProductos }] = await Promise.all([
    supabase.rpc("rentabilidad_resumen", { ...iso, p_sucursal_id }),
    prev.desde ? supabase.rpc("rentabilidad_resumen", { ...prevIso, p_sucursal_id }) : Promise.resolve(null),
    supabase.rpc("rentabilidad_productos", { ...iso, p_sucursal_id, p_limite: 50 }),
  ]);
  const dResumenPrev = resumenPrevResult?.data ?? null;

  const resumen = fila<RentabilidadResumen>(dResumen);
  const resumenPrev = fila<RentabilidadResumen>(dResumenPrev);
  const productos = (Array.isArray(dProductos) ? dProductos : []) as ProductoRentabilidad[];

  const ventaTotal = Number(resumen?.venta_total_centavos ?? 0);
  const costoTotal = Number(resumen?.costo_total_centavos ?? 0);
  const utilidad = Number(resumen?.utilidad_centavos ?? 0);
  const margen = Number(resumen?.margen_porcentaje ?? 0);

  const hasPrev = prev.desde !== null && resumenPrev;
  const delta = (field: keyof RentabilidadResumen) =>
    hasPrev ? deltaPorcentaje(Number(resumen?.[field] ?? 0), Number(resumenPrev?.[field] ?? 0)) : null;

  const topData = productos.slice(0, 10).map((p) => ({
    label: p.descripcion,
    value: Number(p.utilidad_centavos ?? 0),
  }));

  const marcaTotales = new Map<string, number>();
  productos.forEach((p) => {
    const marca = p.marca?.trim() ? p.marca : "Sin marca";
    marcaTotales.set(marca, (marcaTotales.get(marca) ?? 0) + Number(p.utilidad_centavos ?? 0));
  });
  const marcasOrdenadas = [...marcaTotales.entries()].sort((a, b) => b[1] - a[1]);
  const marcasPrincipales = marcasOrdenadas.slice(0, 5);
  const restoUtilidad = marcasOrdenadas.slice(5).reduce((s, [, v]) => s + v, 0);
  const marcaData = [
    ...marcasPrincipales.map(([label, value]) => ({ label, value })),
    ...(restoUtilidad > 0 ? [{ label: "Otras marcas", value: restoUtilidad }] : []),
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout user={{ email: user.email, rol: (user.app_metadata?.role as string | undefined) ?? undefined }}>
      <Box sx={{ width: "100%", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Rentabilidad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Utilidad generada en el periodo
              {esDueño ? " · todas las sucursales" : null}
            </Typography>
          </Box>
          <DateRangePicker rango={rango} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
          <ExecutiveCard label="Venta total" value={dineroCentavos(ventaTotal)} helper="Ingresos del periodo" delta={delta("venta_total_centavos")} />
          <ExecutiveCard label="Costo de venta" value={dineroCentavos(costoTotal)} helper="Costo pactado de mercancía" delta={delta("costo_total_centavos")} />
          <ExecutiveCard label="Utilidad neta" value={dineroCentavos(utilidad)} helper="Venta − costo" delta={delta("utilidad_centavos")} />
          <ExecutiveCard label="Margen bruto" value={`${margen.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`} helper="Utilidad sobre venta" delta={delta("margen_porcentaje")} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
          <SimpleBarChart title="Top 10 por utilidad" subtitle="Productos con mayor utilidad en el periodo" data={topData} format="currency" />
          <SimpleDonutChart title="Utilidad por marca" subtitle="Distribución de la utilidad generada" data={marcaData} format="currency" />
        </Box>

        <RentabilidadProductosTable data={productos} />
      </Box>
    </DashboardLayout>
  );
}