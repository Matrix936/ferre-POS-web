"use client";

import { useMemo, useState } from "react";
import { Box, Chip, InputAdornment, TableBody, TableCell, TableRow, TextField, Typography } from "@mui/material";
import { Search, WarningAmberOutlined } from "@mui/icons-material";
import { cantidad } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { ProductoBajoStock } from "@/lib/dashboard-types";
import { BusinessTable, RowNumberCell } from "@/components/business-table";
import { TablePager } from "@/components/table-pager";
import { AvatarProducto } from "@/components/avatar-producto";
import { EmptyState } from "@/components/empty-state";
import ExportCsvButton from "@/components/export-csv-button";

export default function InventarioBajoStockTable({ data }: { data: ProductoBajoStock[] }) {
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
        (p.marca ?? "").toLowerCase().includes(q) ||
        (p.sucursal_nombre ?? "").toLowerCase().includes(q),
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
            Productos bajo stock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detecta faltantes para reabastecer.
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
            filename="productos-bajo-stock"
            rows={filtered.map((p) => ({
              Producto: p.descripcion,
              Marca: p.marca,
              Sucursal: p.sucursal_nombre,
              Stock: p.stock,
              "Stock minimo": p.stock_minimo,
              Estado: p.stock <= 0 ? "Sin stock" : p.motivo,
            }))}
          />
        </Box>
      </Box>

      <BusinessTable
        headers={[
          { label: "Producto", align: "left" },
          { label: "Marca" },
          { label: "Sucursal" },
          { label: "Stock", align: "right" },
          { label: "Mín.", align: "right" },
          { label: "Estado" },
        ]}
        showRowNumber
        rowNumberPage={page}
        rowNumberPageSize={pageSize}
        minWidth={720}
      >
        <TableBody>
          {rows.map((p, index) => (
            <TableRow key={`${p.producto_id}-${p.sucursal_id}`} hover>
              <RowNumberCell index={index} />
              <TableCell align="left">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                  <AvatarProducto
                    codigo={p.codigo_proveedor || p.producto_id}
                    descripcion={p.descripcion}
                    sx={{ width: 34, height: 34, flexShrink: 0 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {p.descripcion}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{p.marca || "-"}</TableCell>
              <TableCell>{p.sucursal_nombre}</TableCell>
              <TableCell align="right">
                {cantidad(p.stock)} <span style={{ color: "#9ca3af" }}>{p.unidad}</span>
              </TableCell>
              <TableCell align="right">{cantidad(p.stock_minimo)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={p.stock <= 0 ? "Sin stock" : p.motivo}
                  color={p.stock <= 0 ? "error" : "warning"}
                  variant="outlined"
                  sx={{ borderRadius: "8px", fontWeight: 700 }}
                />
              </TableCell>
            </TableRow>
          ))}
          {totalRows === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <EmptyState icon={<WarningAmberOutlined />} title="Sin alertas de bajo stock." />
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
        rowLabel="alertas"
      />
    </Box>
  );
}