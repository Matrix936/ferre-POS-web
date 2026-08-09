#!/usr/bin/env node
/**
 * Prepara el proyecto SUPABASE DE STAGING para probar el script de RLS.
 *
 * USO:
 *   node --env-file=.env.staging.local scripts/staging/setup-staging.mjs
 *
 * Qué hace (todo sobre el STAGING, nunca producción):
 *   1) Conecta a la DB vía pooler/directa (STAGING_DATABASE_URL).
 *   2) Aplica supabase/schema_ferre_pos_completo.sql  (estructura idéntica).
 *   3) Aplica supabase/rls_dashboard_solo_lectura.sql (el script a probar).
 *   4) Siembra datos mínimos de prueba (idempotente, ON CONFLICT DO NOTHING).
 *   5) Crea en Auth los usuarios de prueba: dueño (SUPERADMIN) y un USUARIO
 *      de sucursal reducida, con app_metadata.role/sucursal_id.
 *
 * Idempotente: se puede re-ejecutar sin romper nada.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

const DB_URL = process.env.STAGING_DATABASE_URL;
const SUPABASE_URL = process.env.STAGING_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;

const OWNER = { email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD };
const SCOPED = {
  email: process.env.SCOPED_EMAIL,
  password: process.env.SCOPED_PASSWORD,
  sucursal_id: process.env.SCOPED_SUCURSAL_ID ?? "SUC-B",
};

for (const [k, v] of Object.entries({
  STAGING_DATABASE_URL: DB_URL,
  STAGING_SUPABASE_URL: SUPABASE_URL,
  STAGING_SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
  OWNER_EMAIL: OWNER.email,
  OWNER_PASSWORD: OWNER.password,
  SCOPED_EMAIL: SCOPED.email,
  SCOPED_PASSWORD: SCOPED.password,
})) {
  if (!v) {
    console.error(`Falta ${k} en el entorno. Revisa .env.staging.local`);
    process.exit(1);
  }
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function applyFile(client, label, path) {
  const sql = readFileSync(path, "utf8");
  console.log(`▶ Aplicando ${label}...`);
  await client.query(sql);
  console.log(`  ✓ ${label} aplicado sin errores.`);
}

async function seed(client) {
  console.log("▶ Sembrando datos mínimos de prueba (idempotente)...");

  const sql = `
    -- Catálogos
    insert into public.proveedores (id, nombre) values
      ('PROV1', 'Proveedor de prueba') on conflict (id) do nothing;
    insert into public.marcas (id, nombre) values
      ('MARCA1', 'Marca de prueba') on conflict (id) do nothing;
    insert into public.sucursales (id, nombre, direccion, telefono) values
      ('SUC-A', 'Sucursal A', 'Dir A', '111'),
      ('SUC-B', 'Sucursal B', 'Dir B', '222') on conflict (id) do nothing;

    -- Usuarios del sistema (requeridos por ventas.usuario_id)
    insert into public.usuarios (id, email, nombre, role, sucursal_id, password_hash) values
      ('USR-A', 'usr-a@test.local', 'Cajero A', 'SUPERADMIN', 'SUC-A', 'x'),
      ('USR-B', 'usr-b@test.local', 'Cajero B', 'USUARIO', 'SUC-B', 'x') on conflict (id) do nothing;

    -- Productos (4: normal, bajo stock, sin stock, sobre stock)
    insert into public.productos
      (id, proveedor_id, codigo_proveedor, descripcion, precio_costo_centavos, precio_venta_centavos, marca_id)
    values
      ('P1', 'PROV1', 'CP1', 'Tornillo 1/2', 10000, 12500, 'MARCA1'),
      ('P2', 'PROV1', 'CP2', 'Clavo 2"',    5000,  2000,  'MARCA1'),
      ('P3', 'PROV1', 'CP3', 'Tuerca M8',   8000,  11000, 'MARCA1'),
      ('P4', 'PROV1', 'CP4', 'Brida 4"',    3000,  4500,  'MARCA1')
    on conflict (id) do nothing;

    -- Inventario por sucursal
    insert into public.inventario_sucursal
      (producto_id, sucursal_id, stock, stock_minimo, costo_promedio_centavos, precio_venta_centavos)
    values
      ('P1', 'SUC-A', 10, 5,  10000, 12500),   -- normal
      ('P2', 'SUC-B', 2,  5,  5000,  2000),    -- bajo stock
      ('P3', 'SUC-A', 0,  3,  8000,  11000),   -- sin stock
      ('P4', 'SUC-B', 20, 5,  3000,  4500)     -- sobre stock (>= 3*min)
    on conflict (producto_id, sucursal_id) do nothing;

    -- Ventas (fechas recientes en UTC; el reporte las ve en America/Mexico_City)
    insert into public.ventas
      (id, usuario_id, sucursal_id, fecha, total_centavos, metodo_pago, estado)
    values
      ('V1', 'USR-A', 'SUC-A', now() - interval '2 hours', 25000, 'EFECTIVO', 'COMPLETADA'),
      ('V2', 'USR-A', 'SUC-A', now() - interval '26 hours', 15000, 'CREDITO',  'COMPLETADA'),
      ('V3', 'USR-A', 'SUC-A', now() - interval '1 hour',  9000,  'EFECTIVO', 'CANCELADA'),
      ('V4', 'USR-B', 'SUC-B', now() - interval '3 hours', 8000,  'TRANSFERENCIA', 'COMPLETADA'),
      ('V5', 'USR-B', 'SUC-B', now() - interval '50 hours', 12000, 'EFECTIVO', 'COMPLETADA')
    on conflict (id, sucursal_id) do nothing;

    -- Detalle de ventas (para el top de productos)
    insert into public.detalle_ventas
      (id, venta_id, sucursal_id, producto_id, cantidad, precio_venta_pactado_centavos)
    values
      ('DV1', 'V1', 'SUC-A', 'P1', 2, 12500),
      ('DV2', 'V2', 'SUC-A', 'P1', 1, 15000),
      ('DV4', 'V4', 'SUC-B', 'P2', 4, 2000),
      ('DV5', 'V5', 'SUC-B', 'P2', 6, 2000)
    on conflict (id, sucursal_id) do nothing;
  `;
  await client.query(sql);
  console.log("  ✓ Datos sembrados.");
}

async function upsertAuthUser({ email, password, role, sucursalId }) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  const metadata = { role, sucursal_id: sucursalId };

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { app_metadata: metadata });
    console.log(`  ✓ Auth: ${email} actualizado (role=${role}, sucursal_id=${sucursalId}).`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: metadata,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  console.log(`  ✓ Auth: ${email} creado (role=${role}, sucursal_id=${sucursalId}).`);
  return data.user.id;
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  console.log("Conectado a la DB del staging.");
  try {
    await applyFile(client, "schema_ferre_pos_completo.sql", join(repoRoot, "supabase", "schema_ferre_pos_completo.sql"));
    await applyFile(client, "rls_dashboard_solo_lectura.sql", join(repoRoot, "supabase", "rls_dashboard_solo_lectura.sql"));
    await seed(client);
  } finally {
    await client.end();
  }

  console.log("▶ Creando usuarios de Auth del staging...");
  await upsertAuthUser({ email: OWNER.email, password: OWNER.password, role: "SUPERADMIN", sucursalId: "SUC-A" });
  await upsertAuthUser({
    email: SCOPED.email,
    password: SCOPED.password,
    role: "USUARIO",
    sucursalId: SCOPED.sucursal_id,
  });

  console.log("\nSetup completado. Siguiente paso:");
  console.log("  node --env-file=.env.staging.local scripts/staging/verify-staging.mjs");
  console.log("\nIMPORTANTE: desactiva el registro público (Authentication → Providers → Email → Sign up) si no lo has hecho.");
}

main().catch((e) => {
  console.error("\nERROR:", e.message);
  process.exit(1);
});