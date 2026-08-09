"use client";

import { useMemo, useState } from "react";
import { Box, Chip, InputAdornment, TableBody, TableCell, TableRow, TextField, Typography } from "@mui/material";
import { Search, TrendingUpOutlined } from "@mui/icons-material";
import { cantidad, dineroCentavos } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { ProductoRentabilidad } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { AvatarProducto } from "@/components/avatar-producto";
import { EmptyState } from "@/components/empty-state";
import ExportCsvButton from "@/components/export-csv-button";

export default function RentabilidadProductosTable({ data }: { data: ProductoRentabilidad[] }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (p) =>
        p.descripcion.toLowerCase().includes(q) ||
        (p.codigo_proveedor ?? "").toLowerCase().includes(q) ||
        (p.marca ?? "").toLowerCase().includes(q),
    );
  }, [data, debouncedSearch]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const fromRow = totalRows === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min((page + 1) * pageSize, totalRows);
  const rows = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const setPageSizeAndReset = (value: number) => {
    setPageSize(value);
    setPage(0);
  };

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Rentabilidad por producto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Top por utilidad generada en el periodo.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 220 }}
          />
          <ExportCsvButton
            filename="rentabilidad-productos"
            rows={filtered.map((p) => ({
              Producto: p.descripcion,
              Codigo: p.codigo_proveedor,
              Marca: p.marca,
              Unidades: p.unidades_vendidas,
              Venta: p.venta_centavos,
              Costo: p.costo_centavos,
              Utilidad: p.utilidad_centavos,
              "Margen %": p.margen_porcentaje,
            }))}
          />
        </Box>
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