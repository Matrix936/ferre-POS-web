"use client";

import { createContext, useContext, type ReactNode } from "react";

// Altura real del AppBar (medida por DashboardLayout con ResizeObserver).
// Se usa para anclar barras de carga/feedback a su borde inferior sin números
// mágicos; null mientras no se ha medido aún o fuera del layout del dashboard.
const TopbarHeightContext = createContext<number | null>(null);

export function TopbarHeightProvider({
  value,
  children,
}: {
  value: number | null;
  children: ReactNode;
}) {
  return <TopbarHeightContext.Provider value={value}>{children}</TopbarHeightContext.Provider>;
}

export function useTopbarHeight(): number | null {
  return useContext(TopbarHeightContext);
}