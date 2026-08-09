#!/usr/bin/env node
/**
 * Aprovisiona al "dueño" en Supabase Auth y sincroniza sus app_metadata
 * (role + sucursal_id) con la fila correspondiente de la tabla `usuarios`.
 *
 * USO (desde la raíz del repo):
 *   node --env-file=.env.local scripts/seed-owner.mjs \
 *     --email=demonio@ferreteria.mx --password='SuperSecreto1!'
 *
 * ADVERTENCIA: usa la service_role key (bypasea RLS). Ejecutar únicamente
 * desde la máquina del desarrollador, NUNCA dentro de la app Next.js ni en el
 * navegador. Esta es la única pieza que necesita service_role.
 *
 * Si existe una fila en `usuarios` con el mismo email, los app_metadata se
 * toman de ahí (role y sucursal_id del sistema). Si no, se usan los valores
 * --role y --sucursal-id (por defecto SUPERADMIN / la primera sucursal).
 *
 * RECORDATORIO MANUAL: en Supabase Dashboard → Authentication → Providers,
 * desactiva "Email — Sign up" (habilitación de registro público) para que no
 * cualquiera cree una cuenta.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

// --- args -------------------------------------------------------------------
const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    role: { type: "string", default: "SUPERADMIN" },
    "sucursal-id": { type: "string" },
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}
if (!values.email) {
  console.error("Falta --email=<email>.");
  process.exit(1);
}
if (!values.password) {
  console.error("Falta --password=<password> (contraseña del dueño).");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const norm = (s) => (s ? s.trim().toLowerCase() : s);

async function main() {
  const email = norm(values.email);

  // 1) Buscar fila en `usuarios` (service_role ve todo)
  const { data: usuarios, error: uErr } = await admin
    .from("usuarios")
    .select("id,email,nombre,role,sucursal_id,activo")
    .ilike("email", email)
    .limit(1);

  if (uErr) {
    console.warn(`No se pudo leer la tabla usuarios (${uErr.message}); se usarán los valores de --role/--sucursal-id.`);
  }

  let role = values.role;
  let sucursalId = values["sucursal-id"] ?? null;
  const usr = usuarios && usuarios.length ? usuarios[0] : null;

  if (usr) {
    role = usr.role;
    sucursalId = usr.sucursal_id;
    console.log(`usuarios: encontrado "${usr.email}" → role=${role}, sucursal_id=${sucursalId}`);
  } else {
    console.warn(`usuarios: sin fila para "${email}". Contenido potencialmente ANTIGUO/parcial.`);
  }

  // Si aún no hay sucursal, intentar la primera disponible
  if (!sucursalId) {
    const { data: suc } = await admin.from("sucursales").select("id").not("eliminado", "is", true).limit(1);
    sucursalId = suc && suc.length ? suc[0].id : null;
  }
  if (!sucursalId) {
    console.error("No se pudo resolver una sucursal_id. Pasa --sucursal-id=<id>.");
    process.exit(1);
  }

  // 2) Crear o actualizar el usuario en Supabase Auth
  const { data: list, error: liErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (liErr) throw liErr;
  const existing = list.users.find((u) => norm(u.email ?? "") === email);

  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`auth: usuario existente ${userId}. Se actualiza app_metadata.`);
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role, sucursal_id: sucursalId },
    });
  } else {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: values.password,
      email_confirm: true,
      app_metadata: { role, sucursal_id: sucursalId },
    });
    if (cErr) throw cErr;
    userId = created.user.id;
    console.log(`auth: usuario creado ${userId}.`);
  }

  console.log("\nResumen:");
  console.log(`  email        : ${email}`);
  console.log(`  role         : ${role}`);
  console.log(`  sucursal_id  : ${sucursalId}`);
  console.log(`  user_id      : ${userId}`);
  console.log("\nSiguiente paso (manual): desactiva el signup público en");
  console.log("Supabase Dashboard → Authentication → Providers.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});