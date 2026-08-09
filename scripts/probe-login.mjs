#!/usr/bin/env node
/**
 * Probe end-to-end del login del dashboard contra Supabase (anon key).
 *
 * USO (desde la raíz del repo):
 *   node --env-file=.env.local scripts/probe-login.mjs --email=x@y.z --password='...'
 *
 * Qué verifica (sin exponer contraseñas ni tokens):
 *   1) signInWithPassword funciona (Auth sano).
 *   2) app_metadata contiene role y sucursal_id (necesarios para el RLS).
 *   3) rpc('indicador_ventas') responde sin error de permisos
 *      (prueba RLS → JWT → granted en la función).
 *
 * Requiere anon key en una de estas dos variantes:
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (convención Next.js)
 *   SUPABASE_ANON_KEY              (alias; ya presente en .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Faltan SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) y NEXT_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_ANON_KEY).");
  process.exit(1);
}
if (!values.email || !values.password) {
  console.error("Falta --email=<email> y --password=<password>.");
  process.exit(1);
}

const norm = (s) => (s ? s.trim().toLowerCase() : s);

async function main() {
  const email = norm(values.email);
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`1) signInWithPassword(${email}) ...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: values.password,
  });

  if (error) {
    console.error(`ERROR de autenticación: ${error.message}`);
    process.exit(1);
  }

  const user = data.user;
  const rol = user?.app_metadata?.role ?? null;
  const sucursalId = user?.app_metadata?.sucursal_id ?? null;
  console.log("2) Sesión OK");
  console.log(`   email        : ${user.email}`);
  console.log(`   role         : ${rol ?? "(sin role)"}`);
  console.log(`   sucursal_id  : ${sucursalId ?? "(sin sucursal)"}`);
  console.log(`   confirmado   : ${user.confirmed_at || user.email_confirmed_at ? "sí" : "no"}`);

  if (rol !== "SUPERADMIN" && rol !== "ADMIN" && !sucursalId) {
    console.error("app_metadata incompleto: el rol/sucursal no permitirán leer datos bajo RLS.");
    process.exit(1);
  }

  console.log("3) Llamando rpc('indicador_ventas', {p_desde:null,...}) ...");
  const { data: ind, error: rpcErr } = await supabase.rpc("indicador_ventas", {
    p_desde: null,
    p_hasta: null,
    p_sucursal_id: null,
    p_metodo_pago: null,
  });
  if (rpcErr) {
    console.error(`ERROR en RPC: ${rpcErr.message}`);
    process.exit(1);
  }
  const row = Array.isArray(ind) ? ind[0] : ind;
  console.log(`   RPC OK → total_vendido_centavos = ${row?.total_vendido_centavos ?? "(sin dato)"}`);
  console.log(`   raw        : ${JSON.stringify(row)}`);

  console.log("\nProbe completado: login + RLS + función granted, sin errores.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});