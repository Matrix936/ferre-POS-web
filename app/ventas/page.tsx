import { Box, Typography } from "@mui/material";
import { dashboardScope } from "@/lib/dashboard-scope";
import { cantidad, dineroCentavos } from "@/lib/format";
import { fila, type HistorialVentaRow, type HistorialVentaResumen } from "@/lib/dashboard-types";
import DateRangePicker from "@/components/date-range-picker";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExecutiveCard } from "@/components/executive-card";
import HistorialFilters, { type HistorialFilterValue } from "@/components/ventas-historial/historial-filters";
import HistorialTable from "@/components/ventas-historial/historial-table";

type Props = {
  searchParams: Promise<{
    rango?: string;
    sucursal?: string;
    usuario?: string;
    estado?: string;
    folio?: string;
    pagina?: string;
    permitir?: string;
  }>;
};

export default async function VentasHistorialPage({ searchParams }: Props) {
  const { supabase, user, rango, desde, hasta, esDueño, p_sucursal_id } = await dashboardScope(searchParams);

  const sp = await searchParams;
  const sucursal = sp.sucursal ?? "";
  const usuario = sp.usuario ?? "";
  const estado = sp.estado ?? "";
  const folio = sp.folio ?? "";
  const pagina = Math.max(1, Number(sp.pagina ?? 1) || 1);
  const pageSize = [10, 25, 50].includes(Number(sp.permitir)) ? Number(sp.permitir) : 10;

  const resolvedSucursal = esDueño ? (sucursal || null) : (p_sucursal_id ?? null);

  const filterValue: HistorialFilterValue = { sucursal, usuario, estado, folio };

  const iso = { p_desde: desde, p_hasta: hasta };
  const rpcParams = {
    ...iso,
    p_sucursal_id: resolvedSucursal,
    p_usuario_id: usuario || null,
    p_estado: estado || null,
    p_folio: folio || null,
    p_pagina: pagina,
    p_por_pagina: pageSize,
  };

  const [{ data: dRows }, { data: dResumen }, { data: dSucursales }, { data: dUsuarios }] = await Promise.all([
    supabase.rpc("ventas_historial_page", rpcParams),
    supabase.rpc("ventas_historial_resumen", {
      p_desde: desde,
      p_hasta: hasta,
      p_sucursal_id: resolvedSucursal,
      p_usuario_id: usuario || null,
      p_estado: estado || null,
      p_folio: folio || null,
    }),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("dash_v_usuarios").select("id, nombre").order("nombre"),
  ]);

  const rows = (Array.isArray(dRows) ? dRows : []) as HistorialVentaRow[];
  const resumen = fila<HistorialVentaResumen>(dResumen);
  const catalogoSucursales = (Array.isArray(dSucursales) ? dSucursales : []) as { id: string; nombre: string }[];
  const catalogoUsuarios = (Array.isArray(dUsuarios) ? dUsuarios : []) as { id: string; nombre: string }[];
  const totalRows = rows.length ? Number(rows[0]?.total ?? 0) : 0;

  const ventaTotal = Number(resumen?.venta_total_centavos ?? 0);
  const ticketPromedio = Number(resumen?.ticket_promedio_centavos ?? 0);

  // Los cambios de filtro/página se disparan desde el cliente vía router.push
  // (server components re-ejecutan las RPCs con el nuevo searchParams).
  return (
    <DashboardLayout user={{ email: user.email, rol: (user.app_metadata?.role as string | undefined) ?? undefined }}>
      <Box sx={{ width: "100%", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Historial de Ventas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ventas y apartados del periodo
              {esDueño ? " · todas las sucursales" : null}
            </Typography>
          </Box>
          <DateRangePicker rango={rango} />
        </Box>

        <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", mb: 2 }}>
          <HistorialFilters
            value={filterValue}
            sucursales={catalogoSucursales}
            usuarios={catalogoUsuarios}
            showSucursal={esDueño}
            showUsuario={esDueño}
          />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
          <ExecutiveCard label="Venta total del filtro" value={dineroCentavos(ventaTotal)} helper="Suma de movimientos que cumplen los filtros" />
          <ExecutiveCard label="Tickets" value={cantidad(totalRows)} helper="Movimientos que cumplen los filtros" />
          <ExecutiveCard label="Ticket promedio" value={dineroCentavos(ticketPromedio)} helper="Venta total entre tickets" />
        </Box>

        <HistorialTable
          page={pagina - 1}
          pageSize={pageSize}
          totalRows={totalRows}
          rows={rows}
          showSucursal={esDueño}
        />
      </Box>
    </DashboardLayout>
  );
}