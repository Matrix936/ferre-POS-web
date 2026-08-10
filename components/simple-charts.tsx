"use client";

import { Box, Paper, Stack, Typography, alpha, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { dineroCentavos } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Port de ferre-pos/src/shared/components/SimpleCharts.tsx (+ LazySimpleCharts)
export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  format?: "currency" | "number";
  height?: number;
}

const defaultFormat = (value: number) => Number(value || 0).toLocaleString("es-MX");
const fmt = (value: number, format: "currency" | "number" = "number") =>
  format === "currency" ? dineroCentavos(value) : defaultFormat(value);
const chartColors = ["#2563EB", "#16A34A", "#F59E0B", "#7C3AED", "#EF4444", "#0891B2"];

export function SimpleBarChart({ title, subtitle, data, format = "number", height = 260 }: ChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const cleanData = data
    .filter((item) => Number(item.value || 0) > 0)
    .slice(0, isMobile ? 6 : 8)
    .map((item, index) => ({
      ...item,
      color: item.color ?? chartColors[index % chartColors.length],
      shortLabel: shortenLabel(item.label, isMobile ? 14 : 18),
    }));

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {cleanData.length === 0 ? (
        <EmptyChart height={height} />
      ) : !mounted ? (
        <Box sx={{ height }} />
      ) : (
        <Box sx={{ height: isMobile ? Math.min(height, 210) : height }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={cleanData} layout="vertical" margin={{ top: 6, right: 10, left: isMobile ? -8 : 0, bottom: 2 }} barCategoryGap={isMobile ? 8 : 12}>
              <CartesianGrid horizontal={false} stroke={alpha(theme.palette.text.primary, 0.08)} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="shortLabel"
                width={isMobile ? 92 : 118}
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 12, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as ChartDatum;
                  return <ChartTooltip label={item.label} value={fmt(item.value, format)} />;
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={isMobile ? 12 : 16}>
                {cleanData.map((item) => (
                  <Cell key={item.label} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </ChartCard>
  );
}

export function SimpleDonutChart({ title, subtitle, data, format = "currency", height = 260 }: ChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const cleanData = data
    .filter((item) => Number(item.value || 0) > 0)
    .map((item, index) => ({ ...item, color: item.color ?? chartColors[index % chartColors.length] }));
  const total = cleanData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {total <= 0 ? (
        <EmptyChart height={height} />
      ) : !mounted ? (
        <Box sx={{ minHeight: height }} />
      ) : (
        <Box sx={{ minHeight: isMobile ? Math.min(height, 210) : height, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "170px 1fr" }, gap: isMobile ? 1.5 : 2, alignItems: "center" }}>
          <Box sx={{ height: isMobile ? 150 : 170, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={cleanData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={isMobile ? 48 : 54}
                  outerRadius={isMobile ? 68 : 76}
                  paddingAngle={2}
                  stroke={theme.palette.background.paper}
                  strokeWidth={3}
                >
                  {cleanData.map((item) => (
                    <Cell key={item.label} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as ChartDatum;
                    return <ChartTooltip label={item.label} value={fmt(item.value, format)} />;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  Total
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 900 }}>
                  {fmt(total, format)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Stack spacing={isMobile ? 0.75 : 1}>
            {cleanData.map((item) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 700 }} noWrap>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                    {fmt(item.value, format)} · {pct.toFixed(0)}%
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}
    </ChartCard>
  );
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Paper elevation={0} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Paper>
  );
}

function ChartTooltip({ label, value }: { label: string; value: string }) {
  return (
    <Paper elevation={6} sx={{ px: 1.25, py: 1, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 220 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 900 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <Box sx={{ minHeight: height, display: "grid", placeItems: "center" }}>
      <Typography variant="body2" color="text.secondary">
        Sin datos para graficar.
      </Typography>
    </Box>
  );
}

function shortenLabel(label: string, largo = 18) {
  const clean = label.trim();
  if (clean.length <= largo) return clean;
  return `${clean.slice(0, largo - 1)}…`;
}