"use client";

import {
  Box,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  type SxProps,
  type Theme,
} from "@mui/material";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Port de ferre-pos/src/shared/components/BusinessTable.tsx
// (solo sustituye useLocation de react-router por usePathname de Next).

export interface BusinessTableHeader {
  label: ReactNode;
  align?: "left" | "center" | "right";
  width?: number | string;
  sx?: SxProps<Theme>;
}

interface BusinessTableProps {
  headers: BusinessTableHeader[];
  children: ReactNode;
  size?: "small" | "medium";
  density?: "compact" | "comfortable" | "roomy";
  minWidth?: number | string;
  sx?: SxProps<Theme>;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  resetScrollKey?: string | number;
  showRowNumber?: boolean;
  rowNumberPage?: number;
  rowNumberPageSize?: number;
}

interface RowNumberCtxValue {
  page: number;
  pageSize: number;
}

const RowNumberCtx = createContext<RowNumberCtxValue | null>(null);

export function RowNumberCell({ index }: { index: number }) {
  const ctx = useContext(RowNumberCtx);
  if (!ctx) return null;
  return (
    <TableCell align="center" sx={{ width: 60, color: "text.secondary" }}>
      {ctx.page * ctx.pageSize + index + 1}
    </TableCell>
  );
}

export function BusinessTable({
  headers,
  children,
  size = "small",
  density = "comfortable",
  minWidth,
  sx,
  stickyHeader,
  maxHeight,
  resetScrollKey,
  showRowNumber,
  rowNumberPage = 0,
  rowNumberPageSize = 25,
}: BusinessTableProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);
  const pathname = usePathname();

  const allHeaders = showRowNumber
    ? [{ label: "#", width: 60, align: "center" as const }, ...headers]
    : headers;

  const densityStyles =
    density === "compact"
      ? {
          headerPy: 1,
          bodyPy: 0.85,
          rowMinHeight: 46,
        }
      : density === "roomy"
        ? {
            headerPy: 1.55,
            bodyPy: 1.4,
            rowMinHeight: 62,
          }
        : {
            headerPy: 1.3,
            bodyPy: 1.15,
            rowMinHeight: 54,
          };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateHints = () => {
      const { scrollLeft, clientWidth, scrollWidth } = node;
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
      if (scrollLeft > maxScrollLeft) {
        node.scrollLeft = maxScrollLeft;
        return;
      }
      setShowLeftHint(scrollLeft > 4);
      setShowRightHint(maxScrollLeft - scrollLeft > 4);
    };

    updateHints();
    node.addEventListener("scroll", updateHints, { passive: true });

    const handleWheel = (event: WheelEvent) => {
      const hasHorizontalOverflow = node.scrollWidth - node.clientWidth > 4;
      if (!hasHorizontalOverflow || !event.ctrlKey) return;

      const delta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
      if (!Number.isFinite(delta) || delta === 0) return;

      event.preventDefault();
      node.scrollLeft += delta;
    };

    node.addEventListener("wheel", handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => updateHints());
    resizeObserver.observe(node);

    return () => {
      node.removeEventListener("scroll", updateHints);
      node.removeEventListener("wheel", handleWheel);
      resizeObserver.disconnect();
    };
  }, [allHeaders.length, children, minWidth, size, stickyHeader, maxHeight]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const rafId = window.requestAnimationFrame(() => {
      node.scrollLeft = 0;
      const { scrollLeft, clientWidth, scrollWidth } = node;
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
      setShowLeftHint(scrollLeft > 4);
      setShowRightHint(maxScrollLeft - scrollLeft > 4);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [pathname, resetScrollKey]);

  const table = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: 1,
          bottom: 1,
          width: 28,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 180ms ease",
          borderRadius: 2,
        },
        "&::before": {
          left: 1,
          background: (theme) =>
            `linear-gradient(to right, ${theme.palette.background.paper}, transparent)`,
          boxShadow: (theme) =>
            showLeftHint ? `inset 10px 0 12px -12px ${theme.palette.action.active}` : "none",
          opacity: showLeftHint ? 1 : 0,
        },
        "&::after": {
          right: 1,
          background: (theme) =>
            `linear-gradient(to left, ${theme.palette.background.paper}, transparent)`,
          boxShadow: (theme) =>
            showRightHint ? `inset -10px 0 12px -12px ${theme.palette.action.active}` : "none",
          opacity: showRightHint ? 1 : 0,
        },
      }}
    >
      <TableContainer
        ref={containerRef}
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          width: "100%",
          overflowX: "auto",
          overflowY: stickyHeader ? "auto" : "hidden",
          maxHeight: stickyHeader ? maxHeight ?? 600 : undefined,
        }}
      >
        <Table
          size={size}
          stickyHeader={stickyHeader}
          sx={{
            width: "100%",
            minWidth: minWidth ?? "100%",
            tableLayout: "auto",
            "& th, & td": {
              whiteSpace: "nowrap",
              textAlign: "center",
            },
            "& .MuiTableHead-root .MuiTableCell-root": {
              py: densityStyles.headerPy,
              verticalAlign: "middle",
            },
            "& .MuiTableBody-root .MuiTableRow-root": {
              minHeight: densityStyles.rowMinHeight,
            },
            "& .MuiTableBody-root .MuiTableCell-root": {
              py: densityStyles.bodyPy,
              verticalAlign: "middle",
              textAlign: "center",
            },
            ...sx,
          }}
        >
          <TableHead>
            <TableRow>
              {allHeaders.map((h, i) => (
                <TableCell
                  key={i}
                  align={h.align ?? "center"}
                  sx={{ fontWeight: 600, width: h.width, ...h.sx }}
                >
                  {h.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          {children}
        </Table>
      </TableContainer>
    </Box>
  );

  if (showRowNumber) {
    return (
      <RowNumberCtx.Provider value={{ page: rowNumberPage, pageSize: rowNumberPageSize }}>
        {table}
      </RowNumberCtx.Provider>
    );
  }

  return table;
}