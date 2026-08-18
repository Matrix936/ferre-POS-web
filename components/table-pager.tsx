"use client";

import { Box, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

// Port de ferre-pos/src/shared/components/TablePager.tsx
// (LOCAL_TABLE_PAGE_SIZE_OPTIONS inline = [10, 25, 50]).

export const LOCAL_TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50];

interface TablePagerProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
  fromRow: number;
  toRow: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (pageSize: number) => void;
  rowLabel?: string;
  summary?: string;
}

export function TablePager({
  page,
  pageSize,
  totalPages,
  totalRows,
  fromRow,
  toRow,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  rowLabel = "registros",
  summary,
}: TablePagerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2 },
        py: 1.5,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 600, textAlign: { xs: "center", sm: "left" } }}
      >
        {summary ?? (totalRows === 0 ? `Total: 0 ${rowLabel}` : `Mostrando ${fromRow}-${toRow} de ${totalRows} ${rowLabel}`)}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "space-between", sm: "flex-end" },
          gap: { xs: 1, sm: 1.5 },
          flexWrap: "wrap",
          minWidth: 0,
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "inline" } }}>
            Mostrar:
          </Typography>
          <Select
            size="small"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            sx={{ minWidth: { xs: 64, sm: 76 }, "& .MuiSelect-select": { py: 0.75 } }}
          >
            {LOCAL_TABLE_PAGE_SIZE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <IconButton size="small" onClick={onPreviousPage} disabled={!canPreviousPage} aria-label="Página anterior">
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minWidth: 0, textAlign: "center", whiteSpace: "nowrap", fontWeight: 600, px: 0.5 }}
        >
          Página {page + 1} de {totalPages}
        </Typography>
        <IconButton size="small" onClick={onNextPage} disabled={!canNextPage} aria-label="Página siguiente">
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}