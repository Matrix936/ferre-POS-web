"use client";

import { useState } from "react";
import { Box, Chip, Tab, TableBody, TableCell, TableRow, Tabs, Typography } from "@mui/material";
import { AccountBalanceWalletOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { deltaPorcentaje, dineroCentavos } from "@/lib/format";
import type { FinancieroResumen, VentaPorMetodo, AgingRow, CxPAgingRow, MovimientoCajaRow } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { ExecutiveCard } from "@/components/executive-card";
import { SimpleBarChart, SimpleDonutChart } from "@/components/simple-charts";
import { EmptyState } from "@/components/empty-state";
import ExportCsvButton from "@/components/export-csv-button";

function usePager(total: number, initialSize = 10) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromRow = total === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min((page + 1) * pageSize, total);
  return {
    page,
    pageSize,
    totalPages,
    fromRow,
    toRow,
    rows: <T,>(list: T[]) => list.slice(page * pageSize, page * pageSize + pageSize),
    setPageSizeAndReset: (value: number) => {
      setPageSize(value);
      setPage(0);
    },
    prev: () => setPage((p) => Math.max(0, p - 1)),
    next: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
  };
}

export default function FinancieroTabs({
  resumen,
  resumenPrev,
  metodo,
  edadCxC,
  edadCxP,
  movCaja,
  prevDisponible = false,
}: {
  resumen: FinancieroResumen;
  resumenPrev?: FinancieroResumen | null;
  metodo: VentaPorMetodo[];
  edadCxC: AgingRow[];
  edadCxP: CxPAgingRow[];
  movCaja: MovimientoCajaRow[];
  prevDisponible?: boolean;
}) {
  const [tab, setTab] = useState(0);

  const donutData = metodo.map((m) => ({
    label: (m.metodo_pago?.[0]?.toUpperCase() ?? "") + (m.metodo_pago?.slice(1) ?? ""),
    value: Number(m.total_centavos ?? 0),
  }));

  const flujoData = [
    { label: "Ingresos caja", value: Number(resumen.ingresos_caja_centavos ?? 0), color: "#2E7D32" },
    { label: "Egresos caja", value: Number(resumen.egresos_caja_centavos ?? 0), color: "#D32F2F" },
    { label: "Compras", value: Number(resumen.compras_centavos ?? 0), color: "#ED6C02" },
    { label: "CxC", value: Number(resumen.cuentas_por_cobrar_centavos ?? 0), color: "#9C27B0" },
    { label: "CxP", value: Number(resumen.cuentas_por_pagar_centavos ?? 0), color: "#6D4C41" },
  ];

  // Deltas % vs periodo anterior (null cuando no hay base → la card no muestra).
  const delta = (field: keyof FinancieroResumen) =>
    prevDisponible && resumenPrev ? deltaPorcentaje(Number(resumen[field] ?? 0), Number(resumenPrev[field] ?? 0)) : null;

  return (
    <>
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="Resumen" />
        <Tab label="Cuentas por cobrar" />
        <Tab label="Cuentas por pagar" />
        <Tab label="Movimientos" />
      </Tabs>

      {tab === 0 && <ResumenTab resumen={resumen} donutData={donutData} flujoData={flujoData} delta={delta} />}
      {tab === 1 && <AgingCxCTab data={edadCxC} />}
      {tab === 2 && <AgingCxPTab data={edadCxP} />}
      {tab === 3 && <MovimientosCajaTab data={movCaja} />}
    </>
  );
}

function ResumenTab({
  resumen,
  donutData,
  flujoData,
  delta,
}: {
  resumen: FinancieroResumen;
  donutData: { label: string; value: number }[];
  flujoData: { label: string; value: number; color: string }[];
  delta: (field: keyof FinancieroResumen) => number | null;
}) {
  return (
    <>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
        <ExecutiveCard label="Ingresos caja" value={dineroCentavos(resumen.ingresos_caja_centavos)} helper="Movimientos de ingreso" delta={delta("ingresos_caja_centavos")} />
        <ExecutiveCard label="Egresos caja" value={dineroCentavos(resumen.egresos_caja_centavos)} helper="Movimientos de salida" delta={delta("egresos_caja_centavos")} />
        <ExecutiveCard label="Compras (pago a proveedores)" value={dineroCentavos(resumen.compras_centavos)} helper="Incluye cotizaciones excluidas" delta={delta("compras_centavos")} />
        <ExecutiveCard label="Flujo neto estimado" value={dineroCentavos(resumen.flujo_neto_estimado_centavos)} helper="Efectivo + tarjeta + transferencia ± caja − compras" delta={delta("flujo_neto_estimado_centavos")} />
        <ExecutiveCard label="Cuentas por cobrar" value={dineroCentavos(resumen.cuentas_por_cobrar_centavos)} helper="Saldo deudor de clientes" delta={delta("cuentas_por_cobrar_centavos")} />
        <ExecutiveCard label="Cuentas por pagar" value={dineroCentavos(resumen.cuentas_por_pagar_centavos)} helper="Compras pendientes" delta={delta("cuentas_por_pagar_centavos")} />
        <ExecutiveCard label="Ventas crédito" value={dineroCentavos(resumen.ventas_credito_centavos)} helper="Crédito otorgado en el periodo" delta={delta("ventas_credito_centavos")} />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
        <SimpleDonutChart title="Ventas por forma de pago" subtitle="Composición del periodo" data={donutData} format="currency" />
        <ResumenMetodoGrid resumen={resumen} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <SimpleBarChart title="Flujo operativo" subtitle="Entradas, salidas y obligaciones" data={flujoData} format="currency" />
      </Box>
    </>
  );
}

function ResumenMetodoGrid({ resumen }: { resumen: FinancieroResumen }) {
  const rows = [
    { label: "Efectivo", value: resumen.ventas_efectivo_centavos },
    { label: "Tarjeta", value: resumen.ventas_tarjeta_centavos },
    { label: "Transferencia", value: resumen.ventas_transferencia_centavos },
    { label: "Crédito", value: resumen.ventas_credito_centavos },
  ];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {r.label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {dineroCentavos(r.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function AgingCxCTab({ data }: { data: AgingRow[] }) {
  const pager = usePager(data.length);
  const rows = pager.rows(data);

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Cuentas por cobrar — antigüedad
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saldo por cliente según días de atraso.
          </Typography>
        </Box>
        <ExportCsvButton
          filename="cuentas-por-cobrar"
          rows={data.map((c) => ({
            Cliente: c.cliente_nombre,
            Vigente: c.deuda_vigente_centavos,
            "1-30": c.deuda_1_30_centavos,
            "31-60": c.deuda_31_60_centavos,
            "60+": c.deuda_60_mas_centavos,
            Total: c.total_deuda_centavos,
            "Limite credito": c.limite_credito_centavos,
            "Uso credito %": c.uso_credito_porcentaje,
          }))}
        />
      </Box>
      <BusinessTable
        headers={[
          { label: "Cliente", align: "left" },
          { label: "Vigente", align: "right" },
          { label: "1–30", align: "right" },
          { label: "31–60", align: "right" },
          { label: "60+", align: "right" },
          { label: "Total", align: "right" },
          { label: "Lím. crédito", align: "right" },
          { label: "Uso crédito" },
        ]}
        showRowNumber
        rowNumberPage={pager.page}
        rowNumberPageSize={pager.pageSize}
        minWidth={820}
      >
        <TableBody>
          {rows.map((c, index) => (
            <TableRow key={c.cliente_id} hover>
              <RowNumberCell index={index} />
              <TableCell align="left">
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {c.cliente_nombre}
                </Typography>
              </TableCell>
              <TableCell align="right">{dineroCentavos(c.deuda_vigente_centavos)}</TableCell>
              <TableCell align="right">{dineroCentavos(c.deuda_1_30_centavos)}</TableCell>
              <TableCell align="right">{dineroCentavos(c.deuda_31_60_centavos)}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800, color: Number(c.deuda_60_mas_centavos) > 0 ? "error.main" : undefined }}>
                  {dineroCentavos(c.deuda_60_mas_centavos)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {dineroCentavos(c.total_deuda_centavos)}
                </Typography>
              </TableCell>
              <TableCell align="right">{dineroCentavos(c.limite_credito_centavos)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={`${Number(c.uso_credito_porcentaje ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`}
                  color={Number(c.uso_credito_porcentaje ?? 0) >= 90 ? "error" : Number(c.uso_credito_porcentaje ?? 0) >= 60 ? "warning" : "success"}
                  variant="outlined"
                  sx={{ borderRadius: "8px", fontWeight: 700 }}
                />
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <EmptyState icon={<AccountBalanceWalletOutlined />} title="Sin cuentas por cobrar." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BusinessTable>
      <TablePager
        page={pager.page}
        pageSize={pager.pageSize}
        totalPages={pager.totalPages}
        totalRows={data.length}
        fromRow={pager.fromRow}
        toRow={pager.toRow}
        canPreviousPage={pager.page > 0}
        canNextPage={pager.page + 1 < pager.totalPages}
        onPreviousPage={pager.prev}
        onNextPage={pager.next}
        onPageSizeChange={pager.setPageSizeAndReset}
        rowLabel="clientes"
      />
    </Box>
  );
}

function MovimientosCajaTab({ data }: { data: MovimientoCajaRow[] }) {
  const pager = usePager(data.length);
  const rows = pager.rows(data);

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Movimientos de caja
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ingresos y egresos que afectan el efectivo del periodo.
          </Typography>
        </Box>
        <ExportCsvButton
          filename="movimientos-caja"
          rows={data.map((m) => ({
            Fecha: m.fecha,
            Tipo: m.tipo,
            Motivo: m.motivo,
            Usuario: m.usuario_nombre,
            Sucursal: m.sucursal_nombre,
            "Afecta efectivo": m.afecta_efectivo ? "Sí" : "No",
            Monto: m.monto_centavos,
          }))}
        />
      </Box>
      <BusinessTable
        headers={[
          { label: "Fecha", align: "left" },
          { label: "Tipo" },
          { label: "Motivo", align: "left" },
          { label: "Usuario" },
          { label: "Sucursal" },
          { label: "Afecta efectivo" },
          { label: "Monto", align: "right" },
        ]}
        showRowNumber
        rowNumberPage={pager.page}
        rowNumberPageSize={pager.pageSize}
        minWidth={860}
      >
        <TableBody>
          {rows.map((m, index) => (
            <TableRow key={m.id} hover>
              <RowNumberCell index={index} />
              <TableCell align="left">{new Date(m.fecha).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={m.tipo}
                  color={m.tipo === "INGRESO" ? "success" : "error"}
                  variant="outlined"
                  sx={{ borderRadius: "8px", fontWeight: 700 }}
                />
              </TableCell>
              <TableCell align="left">
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {m.motivo}
                </Typography>
              </TableCell>
              <TableCell>{m.usuario_nombre}</TableCell>
              <TableCell>{m.sucursal_nombre}</TableCell>
              <TableCell>{m.afecta_efectivo ? "Sí" : "No"}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800, color: m.tipo === "INGRESO" ? "success.main" : "error.main" }}>
                  {m.tipo === "INGRESO" ? "+" : "−"}
                  {dineroCentavos(m.monto_centavos)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <EmptyState icon={<AccountBalanceWalletOutlined />} title="Sin movimientos de caja en el periodo." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BusinessTable>
      <TablePager
        page={pager.page}
        pageSize={pager.pageSize}
        totalPages={pager.totalPages}
        totalRows={data.length}
        fromRow={pager.fromRow}
        toRow={pager.toRow}
        canPreviousPage={pager.page > 0}
        canNextPage={pager.page + 1 < pager.totalPages}
        onPreviousPage={pager.prev}
        onNextPage={pager.next}
        onPageSizeChange={pager.setPageSizeAndReset}
        rowLabel="movimientos"
      />
    </Box>
  );
}

function AgingCxPTab({ data }: { data: CxPAgingRow[] }) {
  const pager = usePager(data.length);
  const rows = pager.rows(data);

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Cuentas por pagar — antigüedad
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compras pendientes por proveedor según vencimiento.
          </Typography>
        </Box>
        <ExportCsvButton
          filename="cuentas-por-pagar"
          rows={data.map((p) => ({
            Proveedor: p.proveedor_nombre,
            Vigente: p.deuda_vigente_centavos,
            "1-30": p.deuda_1_30_centavos,
            "31-60": p.deuda_31_60_centavos,
            "60+": p.deuda_60_mas_centavos,
            Total: p.total_deuda_centavos,
            "Compras pend.": p.compras_pendientes,
          }))}
        />
      </Box>
      <BusinessTable
        headers={[
          { label: "Proveedor", align: "left" },
          { label: "Vigente", align: "right" },
          { label: "1–30", align: "right" },
          { label: "31–60", align: "right" },
          { label: "60+", align: "right" },
          { label: "Total", align: "right" },
          { label: "Compras pend.", align: "right" },
        ]}
        showRowNumber
        rowNumberPage={pager.page}
        rowNumberPageSize={pager.pageSize}
        minWidth={780}
      >
        <TableBody>
          {rows.map((p, index) => (
            <TableRow key={p.proveedor_id} hover>
              <RowNumberCell index={index} />
              <TableCell align="left">
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {p.proveedor_nombre}
                </Typography>
              </TableCell>
              <TableCell align="right">{dineroCentavos(p.deuda_vigente_centavos)}</TableCell>
              <TableCell align="right">{dineroCentavos(p.deuda_1_30_centavos)}</TableCell>
              <TableCell align="right">{dineroCentavos(p.deuda_31_60_centavos)}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800, color: Number(p.deuda_60_mas_centavos) > 0 ? "error.main" : undefined }}>
                  {dineroCentavos(p.deuda_60_mas_centavos)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {dineroCentavos(p.total_deuda_centavos)}
                </Typography>
              </TableCell>
              <TableCell align="right">{p.compras_pendientes}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <EmptyState icon={<ReceiptLongOutlined />} title="Sin cuentas por pagar." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BusinessTable>
      <TablePager
        page={pager.page}
        pageSize={pager.pageSize}
        totalPages={pager.totalPages}
        totalRows={data.length}
        fromRow={pager.fromRow}
        toRow={pager.toRow}
        canPreviousPage={pager.page > 0}
        canNextPage={pager.page + 1 < pager.totalPages}
        onPreviousPage={pager.prev}
        onNextPage={pager.next}
        onPageSizeChange={pager.setPageSizeAndReset}
        rowLabel="proveedores"
      />
    </Box>
  );
}