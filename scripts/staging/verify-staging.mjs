#!/usr/bin/env node
/**
 * Verificación REAL del script de RLS sobre el STAGING.
 *
 * USO:
 *   node --env-file=.env.staging.local scripts/staging/verify-staging.mjs
 *
 * Pruebas:
 *   A) service_role conserva acceso TOTAL (INSERT/UPDATE/DELETE reales en
 *      ventas + lectura) — simula a la app de escritorio.
 *   B) authenticated con app_metadata.role=SUPERADMIN lee todas las tablas
 *      esperadas (todas las sucursales).
 *   C) authenticated NO puede INSERT/UPDATE/DELETE en ninguna tabla.
 *   D) Las 8 funciones de indicadores se invocan vía RPC y devuelven valores
 *      coherentes con los datos sembrados.
 *   E) (bonus) authenticated USUARIO (SUC-B) solo ve su sucursal.
 *
 * Sale con código 0 si todo pasa; 1 si algo falla.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.STAGING_SUPABASE_URL;
const ANON = process.env.STAGING_SUPABASE_ANON_KEY;
const SERVICE = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
const OWNER = { email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD };
const SCOPED = {
  email: process.env.SCOPED_EMAIL,
  password: process.env.SCOPED_PASSWORD,
  sucursal_id: process.env.SCOPED_SUCURSAL_ID ?? "SUC-B",
};
for (const [k, v] of Object.entries({ URL, ANON, SERVICE, OWNER_EMAIL: OWNER.email, OWNER_PASSWORD: OWNER.password, SCOPED_EMAIL: SCOPED.email, SCOPED_PASSWORD: SCOPED.password })) {
  if (!v) { console.error(`Falta ${k}.`); process.exit(1); }
}

const service = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });

const results = [];
function report(pass, label, detail = "") {
  results.push(pass);
  console.log(`${pass ? "  ✅" : "  ❌"} ${label}${detail ? ` — ${detail}` : ""}`);
}
function errMsg(e) { return e?.message ?? (e?.code ? `${e.code}:${e.message ?? ""}` : JSON.stringify(e)); }

async function signIn(label, creds) {
  // Cliente NUEVO por sesión: supabase-js solo guarda UNA sesión activa por
  // cliente, y si reutilizamos el mismo, la última sesión pisaría a la anterior.
  const c = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword(creds);
  if (error || !data.session) { console.error(`No se pudo iniciar sesión para ${label}: ${errMsg(error)}`); process.exit(2); }
  console.log(`→ Sesión: ${label} (${creds.email})`);
  const meta = data.session.user.app_metadata ?? {};
  console.log(`   role=${meta.role} sucursal_id=${meta.sucursal_id}`);
  return c;
}

async function expectError(label, fn) {
  const { error } = await fn();
  if (error) report(true, `${label} (rechazado: ${error.message?.split("\n")[0] ?? error.code})`);
  else report(false, `${label} — SE PERMITIÓ una escritura no autorizada!`);
}

async function main() {
  // ---- Sesiones -----------------------------------------------------
  const owner = await signIn("dueño SUPERADMIN", OWNER);
  const scoped = await signIn("usuario USUARIO", { email: SCOPED.email, password: SCOPED.password });

// ============================================================
// A) service_role: acceso total (simula app de escritorio)
// ============================================================
console.log("\n[A] service_role — acceso total (CRUD real en ventas)");
const srvId = "SRV-TEST";
try {
  const ins = await service.from("ventas").insert({
    id: srvId, usuario_id: "USR-A", sucursal_id: "SUC-A",
    fecha: new Date().toISOString(), total_centavos: 99999, metodo_pago: "EFECTIVO", estado: "COMPLETADA",
  });
  report(!ins.error, "INSERT en ventas", ins.error ? errMsg(ins.error) : "");
  const upd = await service.from("ventas").update({ total_centavos: 55555 }).eq("id", srvId);
  report(!upd.error, "UPDATE en ventas", upd.error ? errMsg(upd.error) : "");
  const sel = await service.from("ventas").select("id,total_centavos").eq("id", srvId);
  report(sel.data?.[0]?.total_centavos === 55555, "SELECT (lee lo que escribió)", sel.error ? errMsg(sel.error) : "total_centavos=" + sel.data?.[0]?.total_centavos);
} finally {
  await service.from("ventas").delete().eq("id", srvId);
}
const readAll = await service.from("sucursales").select("id");
report(readAll.data && readAll.data.length >= 2, "service_role lee catálogos", readAll.error ? errMsg(readAll.error) : `sucursales=${readAll.data?.length}`);

  // ============================================================
  // B) authenticated SUPERADMIN: lectura de todas las tablas
  // ============================================================
  console.log("\n[B] authenticated SUPERADMIN — lectura (todas las sucursales)");
  const checks = [
    ["sucursales", 2], ["productos", 4], ["inventario_sucursal", 4],
    ["ventas", 5], ["detalle_ventas", 4], ["marcas", 1],
  ];
  for (const [tbl, min] of checks) {
    const { data, error } = await owner.from(tbl).select("*");
    report(!error && data.length >= min, `SELECT ${tbl}`, error ? errMsg(error) : `rows=${data.length} (min ${min})`);
  }
  const bothSuc = await owner.from("ventas").select("sucursal_id", { count: "exact" });
  const sucs = new Set((bothSuc.data ?? []).map((r) => r.sucursal_id));
  report(sucs.size === 2, "SUPERADMIN ve AMBAS sucursales", `sucursales presentes: ${[...sucs].join(",")}`);

  // ============================================================
  // C) authenticated NO puede escribir
  // ============================================================
  console.log("\n[C] authenticated (SUPERADMIN) — sin escritura");
  const toInsertVenta = { id: "X-1", usuario_id: "USR-A", sucursal_id: "SUC-A", fecha: new Date().toISOString(), metodo_pago: "EFECTIVO" };
  await expectError("INSERT ventas", () => owner.from("ventas").insert(toInsertVenta));
  await expectError("UPDATE ventas", () => owner.from("ventas").update({ total_centavos: 1 }).eq("id", "V1"));
  await expectError("DELETE ventas", () => owner.from("ventas").delete().eq("id", "V1"));
  await expectError("INSERT productos", () => owner.from("productos").insert({ id: "X-P", proveedor_id: "PROV1", descripcion: "x" }));
  await expectError("INSERT inventario_sucursal", () => owner.from("inventario_sucursal").insert({ producto_id: "P1", sucursal_id: "SUC-A", stock: 1 }));
  await expectError("INSERT sucursales", () => owner.from("sucursales").insert({ id: "X-S", nombre: "x", direccion: "x" }));
  await expectError("UPDATE productos", () => owner.from("productos").update({ descripcion: "hack" }).eq("id", "P1"));

  // ============================================================
  // D) Funciones de indicadores (RPC) — valores coherentes
  // ============================================================
  console.log("\n[D] Funciones de indicadores (vía RPC, authenticated)");
  const sales = await owner.rpc("indicador_ventas");
  if (!sales.error) {
    const s = sales.data[0];
    report(
      s.transacciones === 4 && s.total_vendido_centavos === 60000 && s.ventas_canceladas === 1 &&
        s.ventas_credito_centavos === 15000 && s.ventas_contado_centavos === 45000 && s.ticket_promedio_centavos === 15000,
      "indicador_ventas",
      `tot=${s.total_vendido_centavos} ops=${s.transacciones} prom=${s.ticket_promedio_centavos} cancel=${s.ventas_canceladas} cred=${s.ventas_credito_centavos} cont=${s.ventas_contado_centavos}`,
    );
  } else report(false, "indicador_ventas", errMsg(sales.error));

  const metodos = await owner.rpc("ventas_por_metodo");
  report(!metodos.error && metodos.data.some((m) => m.metodo_pago === "CREDITO" && m.total_centavos === 15000), "ventas_por_metodo", metodos.error ? errMsg(metodos.error) : metodos.data.map((m) => `${m.metodo_pago}=${m.total_centavos}`).join(", "));

  const top = await owner.rpc("productos_mas_vendidos");
  report(!top.error && top.data[0]?.producto_id === "P2" && top.data[0]?.unidades_vendidas === 10, "productos_mas_vendidos", top.error ? errMsg(top.error) : `${top.data[0]?.producto_id} (${top.data[0]?.unidades_vendidas} uds)`);

  const inv = await owner.rpc("inventario_resumen");
  if (!inv.error) {
    const v = inv.data[0];
    report(
      v.productos_en_inventario === 4 && v.stock_bajo === 1 && v.sin_stock === 1 && v.sobre_stock === 1 && v.valor_centavos === 170000,
      "inventario_resumen",
      `prod=${v.productos_en_inventario} val=${v.valor_centavos} bajo=${v.stock_bajo} sin=${v.sin_stock} sobre=${v.sobre_stock}`,
    );
  } else report(false, "inventario_resumen", errMsg(inv.error));

  const bajo = await owner.rpc("inventario_bajo_stock");
  report(!bajo.error && bajo.data.length === 2, "inventario_bajo_stock", bajo.error ? errMsg(bajo.error) : `rows=${bajo.data.length} (${bajo.data.map((r) => r.producto_id).join(",")})`);

  const dia = await owner.rpc("ventas_por_dia");
  report(!dia.error && dia.data.length > 0, "ventas_por_dia", dia.error ? errMsg(dia.error) : `rows=${dia.data.length}`);

  const suc = await owner.rpc("ventas_por_sucursal");
  const sucSum = !suc.error ? suc.data.find((r) => r.sucursal_id === "SUC-A")?.total_centavos : null;
  report(!suc.error && sucSum === 40000, "ventas_por_sucursal", suc.error ? errMsg(suc.error) : suc.data.map((r) => `${r.sucursal_id}=${r.total_centavos}`).join(", "));

  // ============================================================
  // E) (bonus) USUARIO con alcance — solo su sucursal
  // ============================================================
  console.log("\n[E] authenticated USUARIO (SUC-B) — alcance por sucursal");
  const ventasB = await scoped.from("ventas").select("id,sucursal_id");
  const idsB = (ventasB.data ?? []).map((r) => r.id);
  report(!ventasB.error && idsB.length === 2 && !idsB.includes("V1") && idsB.includes("V4"), "SELECT ventas → solo SUC-B", ventasB.error ? errMsg(ventasB.error) : idsB.join(","));
  const hidden = await scoped.from("ventas").select("id").eq("id", "V1");
  report(!hidden.error && hidden.data.length === 0, "No ve la venta de SUC-A (id V1)", hidden.error ? errMsg(hidden.error) : `${hidden.data.length} filas`);
  const invB = await scoped.rpc("inventario_resumen");
  report(!invB.error && invB.data[0].productos_en_inventario === 2, "RPC inventario_resumen → solo SUC-B", invB.error ? errMsg(invB.error) : `prod=${invB.data[0].productos_en_inventario}`);
  await expectError("USUARIO INSERT ventas", () => scoped.from("ventas").insert({ id: "Y-1", usuario_id: "USR-B", sucursal_id: "SUC-B", fecha: new Date().toISOString(), metodo_pago: "EFECTIVO" }));

  // ============================================================
  const passed = results.filter(Boolean).length;
  console.log(`\nRESULTADO: ${passed}/${results.length} pruebas correctas.`);
  if (passed < results.length) process.exit(1);
}

main().catch((e) => { console.error("ERROR inesperado:", e); process.exit(2); });