"use client";

import { useState } from "react";
import { Box, Chip, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { TrendingUpOutlined } from "@mui/icons-material";
import { cantidad, dineroCentavos } from "@/lib/format";
import type { ProductoRentabilidad } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { AvatarProducto } from "@/components/avatar-producto";
import { EmptyState } from "@/components/empty-state";

export default function RentabilidadProductosTable({ data }: { data: ProductoRentabilidad[] }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const fromRow = totalRows === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min((page + 1) * pageSize, totalRows);
  const rows = data.slice(page * pageSize, page * pageSize + pageSize);

  const setPageSizeAndReset = (value: number) => {
    setPageSize(value);
    setPage(0);
  };

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Rentabilidad por producto
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Top por utilidad generada en el periodo.
        </Typography>
      </Box>

      <BusinessTable
        headers={[
          { label: "Producto", align: "left" },
          { label: "Marca" },
          { label: "Unid.", align: "right" },
          { label: "Venta", align: "right" },
          { label: "Costo", align: "right" },
          { label: "Utilidad", align: "right" },
          { label: "Margen" },
        ]}
        showRowNumber
        rowNumberPage={page}
        rowNumberPageSize={pageSize}
        minWidth={820}
      >
        <TableBody>
          {rows.map((p, index) => (
            <TableRow key={p.producto_id} hover>
              <RowNumberCell index={index} />
              <TableCell align="left">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                  <AvatarProducto
                    codigo={p.codigo_proveedor || p.producto_id}
                    descripcion={p.descripcion}
                    sx={{ width: 34, height: 34, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {p.descripcion}
                    </Typography>
                    {p.codigo_proveedor ? (
                      <Typography variant="caption" color="text.secondary">
                        {p.codigo_proveedor}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{p.marca || "-"}</TableCell>
              <TableCell align="right">{cantidad(p.unidades_vendidas)}</TableCell>
              <TableCell align="right">{dineroCentavos(p.venta_centavos)}</TableCell>
              <TableCell align="right">{dineroCentavos(p.costo_centavos)}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 800, color: "success.main" }}>
                  {dineroCentavos(p.utilidad_centavos)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={`${Number(p.margen_porcentaje ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`}
                  color={Number(p.margen_porcentaje ?? 0) >= 0 ? "success" : "error"}
                  variant="outlined"
                  sx={{ borderRadius: "8px", fontWeight: 700 }}
                />
              </TableCell>
            </TableRow>
          ))}
          {totalRows === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <EmptyState icon={<TrendingUpOutlined />} title="Sin datos de rentabilidad." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BusinessTable>

      <TablePager
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalRows={totalRows}
        fromRow={fromRow}
        toRow={toRow}
        canPreviousPage={page > 0}
        canNextPage={page + 1 < totalPages}
        onPreviousPage={() => setPage((prev) => Math.max(0, prev - 1))}
        onNextPage={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
        onPageSizeChange={setPageSizeAndReset}
        rowLabel="productos"
      />
    </Box>
  );
}