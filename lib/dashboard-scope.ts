import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RANGOS, rangoAFechas, type Rango } from "@/lib/format";

// Scope compartido de las páginas del dashboard web (solo lectura):
//  - valida sesión (redirect a /login si no hay usuario),
//  - resuelve el rango de fechas desde searchParams (?rango=...),
//  - calcula el alcance por sucursal según el rol (SUPERADMIN/ADMIN ven todas).
export async function dashboardScope(searchParams: Promise<{ rango?: string }>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const raw = sp.rango;
  const rango: Rango = RANGOS.some((r) => r.value === raw) ? (raw as Rango) : "30d";
  const { desde, hasta } = rangoAFechas(rango);

  const rol = (user.app_metadata?.role as string | null | undefined) ?? null;
  const esDueño = rol === "SUPERADMIN" || rol === "ADMIN";
  const p_sucursal_id = esDueño ? null : (user.app_metadata?.sucursal_id as string | null | undefined) ?? null;

  return {
    supabase,
    user,
    rango,
    desde,
    hasta,
    rol,
    esDueño,
    p_sucursal_id,
  };
}

export type DashboardScope = Awaited<ReturnType<typeof dashboardScope>>;