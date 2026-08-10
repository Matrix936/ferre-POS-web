import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RANGOS, rangoAFechas, type Rango } from "@/lib/format";

// Scope compartido de las páginas del dashboard web (solo lectura):
//  - valida sesión (redirect a /login si no hay usuario),
//  - resuelve el rango de fechas desde searchParams (?rango=...),
//  - calcula el alcance por sucursal según el rol (SUPERADMIN/ADMIN ven todas
//    y pueden filtrar con ?sucursal=; el resto queda fijo a su sucursal),
//  - lista el catálogo de sucursales para el selector de filtro.
export async function dashboardScope(searchParams: Promise<{ rango?: string; sucursal?: string }>) {
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

  // El parámetro ?sucursal= solo se respeta para dueños; un empleado siempre
  // queda acotado a su sucursal aunque la URL lo intente.
  const sucursalParam = esDueño ? (sp.sucursal ?? "").trim() : "";
  const sucursal = sucursalParam || "";
  const p_sucursal_id = esDueño ? (sucursal || null) : (user.app_metadata?.sucursal_id as string | null | undefined) ?? null;

  const { data: cat } = await supabase.from("sucursales").select("id, nombre").order("nombre");
  const sucursales = (Array.isArray(cat) ? cat : []) as { id: string; nombre: string }[];

  const sucursalNombre = sucursales.find((s) => s.id === p_sucursal_id)?.nombre ?? null;

  return {
    supabase,
    user,
    rango,
    desde,
    hasta,
    rol,
    esDueño,
    sucursal,
    sucursales,
    sucursalNombre,
    p_sucursal_id,
  };
}

export type DashboardScope = Awaited<ReturnType<typeof dashboardScope>>;