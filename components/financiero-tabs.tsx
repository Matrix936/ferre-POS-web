"use client";

import { useState } from "react";
import { Box, Chip, Tab, TableBody, TableCell, TableRow, Tabs, Typography } from "@mui/material";
import { AccountBalanceWalletOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { dineroCentavos } from "@/lib/format";
import type { FinancieroResumen, VentaPorMetodo, AgingRow, CxPAgingRow } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { ExecutiveCard } from "@/components/executive-card";
import { SimpleDonutChart } from "@/components/simple-charts";
import { EmptyState } from "@/components/empty-state";

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
  metodo,
  edadCxC,
  edadCxP,
}: {
  resumen: FinancieroResumen;
  metodo: VentaPorMetodo[];
  edadCxC: AgingRow[];
  edadCxP: CxPAgingRow[];
}) {
  const [tab, setTab] = useState(0);

  const donutData = metodo.map((m) => ({
    label: (m.metodo_pago?.[0]?.toUpperCase() ?? "") + (m.metodo_pago?.slice(1) ?? ""),
    value: Number(m.total_centavos ?? 0),
  }));

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
      </Tabs>

      {tab === 0 && <ResumenTab resumen={resumen} donutData={donutData} />}
      {tab === 1 && <AgingCxCTab data={edadCxC} />}
      {tab === 2 && <AgingCxPTab data={edadCxP} />}
    </>
  );
}

function ResumenTab({ resumen, donutData }: { resumen: FinancieroResumen; donutData: { label: string; value: number }[] }) {
  return (
    <>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
        <ExecutiveCard label="Ingresos caja" value={dineroCentavos(resumen.ingresos_caja_centavos)} helper="Movimientos de ingreso" />
        <ExecutiveCard label="Egresos caja" value={dineroCentavos(resumen.egresos_caja_centavos)} helper="Movimientos de salida" />
        <ExecutiveCard label="Compras (pago a proveedores)" value={dineroCentavos(resumen.compras_centavos)} helper="Incluye cotizaciones excluidas" />
        <ExecutiveCard label="Flujo neto estimado" value={dineroCentavos(resumen.flujo_neto_estimado_centavos)} helper="Efectivo + tarjeta + transferencia ± caja − compras" />
        <ExecutiveCard label="Cuentas por cobrar" value={dineroCentavos(resumen.cuentas_por_cobrar_centavos)} helper="Saldo deudor de clientes" />
        <ExecutiveCard label="Cuentas por pagar" value={dineroCentavos(resumen.cuentas_por_pagar_centavos)} helper="Compras pendientes" />
        <ExecutiveCard label="Ventas crédito" value={dineroCentavos(resumen.ventas_credito_centavos)} helper="Crédito otorgado en el periodo" />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
        <SimpleDonutChart title="Ventas por forma de pago" subtitle="Composición del periodo" data={donutData} format="currency" />
        <ResumenMetodoGrid resumen={resumen} />
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
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Cuentas por cobrar — antigüedad
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Saldo por cliente según días de atraso.
        </Typography>
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

function AgingCxPTab({ data }: { data: CxPAgingRow[] }) {
  const pager = usePager(data.length);
  const rows = pager.rows(data);

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Cuentas por pagar — antigüedad
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Compras pendientes por proveedor según vencimiento.
        </Typography>
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