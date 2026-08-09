-- Ferre-POS - Esquema oficial completo Supabase/PostgreSQL
-- Uso recomendado: proyectos nuevos o bases reseteadas antes de conectar sucursales.
-- No ejecuta DROP/TRUNCATE. Si ya existen tablas con tipos distintos, revisa antes de aplicar.
-- El sistema conserva columnas numeric para lectura operativa y compatibilidad,
-- pero la fuente canónica para sincronización monetaria es *_centavos (bigint).

create extension if not exists pgcrypto;

create or replace function public.force_server_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.touch_updated_at(table_name text)
returns void as $$
begin
  execute format('drop trigger if exists trg_%I_server_updated_at on public.%I', table_name, table_name);
  execute format(
    'create trigger trg_%I_server_updated_at before insert or update on public.%I
     for each row execute function public.force_server_updated_at()',
    table_name,
    table_name
  );
end;
$$ language plpgsql;

create table if not exists public.sucursales (
  id text primary key,
  nombre text not null,
  direccion text not null,
  telefono text not null default '',
  codigo_postal varchar(5) not null default '',
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.empresa_config_fiscal (
  id integer primary key check (id = 1),
  rfc varchar(13) not null default '',
  razon_social text not null default '',
  regimen_fiscal varchar(3) not null default '',
  registro_patronal text null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Configuracion de perifericos por terminal/POS. Se recomienda tratarla como
-- configuracion local por equipo aunque exista esta tabla en esquema maestro.
create table if not exists public.perifericos_config (
  id integer primary key check (id = 1),
  impresora_tickets text not null default '',
  impresora_etiquetas text not null default '',
  etiqueta_modo text not null default 'TEXTO' check (etiqueta_modo in ('TSPL', 'TEXTO')),
  etiqueta_ancho_mm integer not null default 50 check (etiqueta_ancho_mm between 20 and 120),
  etiqueta_alto_mm integer not null default 30 check (etiqueta_alto_mm between 20 and 120),
  etiqueta_gap_mm integer not null default 2 check (etiqueta_gap_mm between 0 and 10),
  ticket_paper_width integer not null default 42 check (ticket_paper_width in (32, 42, 48)),
  ticket_density integer not null default 2 check (ticket_density between 0 and 3),
  ticket_logo_width_dots integer not null default 384 check (ticket_logo_width_dots between 160 and 576),
  mostrar_subtotal_iva boolean not null default true,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.proveedores (
  id text primary key,
  nombre text not null,
  contacto_nombre text not null default '',
  telefono text not null default '',
  email text not null default '',
  direccion text not null default '',
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.usuarios (
  id text primary key,
  email text not null unique,
  nombre text not null,
  role text not null check (role in ('SUPERADMIN', 'ADMIN', 'USUARIO')),
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  password_hash text not null,
  activo boolean not null default true,
  email_verificado boolean not null default false,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.marcas (
  id text primary key,
  nombre text not null unique,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.categorias (
  id text primary key,
  nombre text not null unique,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.unidades (
  id text primary key,
  nombre text not null unique,
  clave_sat varchar(3) not null default '',
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.configuracion_general (
  sucursal_id text primary key references public.sucursales(id) on update cascade on delete restrict,
  mayoreo_global integer not null default 0,
  stock_minimo_default numeric(12, 3) not null default 5,
  iva_porcentaje numeric(5, 2) not null default 16,
  articulo_diverso_tope_linea numeric(12, 2) not null default 0,
  articulo_diverso_tope_venta numeric(12, 2) not null default 0,
  promociones_acumulables boolean not null default false,
  permitir_precio_manual_todos boolean not null default true,
  permitir_devolucion_usuario boolean not null default false,
  monto_max_devolucion_usuario numeric(12,2) not null default 0,
  permitir_cancelacion_usuario boolean not null default false,
  monto_max_cancelacion_usuario numeric(12,2) not null default 0,
  smtp_host text not null default '',
  smtp_port text not null default '587',
  smtp_usuario text not null default '',
  smtp_password text not null default '',
  email_origen text not null default '',
  email_nombre_remitente text not null default '',
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.productos (
  id text primary key,
  codigo_barras text unique,
  codigo_proveedor text not null default '',
  proveedor_id text not null references public.proveedores(id) on update cascade on delete restrict,
  clave_producto text not null default '',
  descripcion text not null,
  precio_costo numeric(12, 2) not null default 0,
  precio_costo_centavos bigint not null default 0,
  costo_promedio numeric(12, 4) not null default 0,
  costo_promedio_centavos bigint not null default 0,
  precio_venta numeric(12, 2) not null default 0,
  precio_venta_centavos bigint not null default 0,
  sat_clave_prod_serv varchar(8) not null default '',
  sat_clave_unidad varchar(3) not null default '',
  mayoreo_apartir numeric(12, 3) not null default 0,
  a_granel boolean not null default false,
  no_en_catalogo boolean not null default false,
  ventas_negativas boolean not null default false,
  requiere_trazabilidad boolean not null default false,
  caducidad date null,
  descripcion_catalogo text not null default '',
  unidad_compra text not null default '',
  unidad_venta text not null default '',
  factor_conversion numeric(12, 4) not null default 1,
  margen_mercado numeric(12, 2) not null default 0,
  caja_inner numeric(12, 2) not null default 0,
  caja_master numeric(12, 2) not null default 0,
  precio_base numeric(12, 2) not null default 0,
  precio_base_centavos bigint not null default 0,
  precio_minimo_venta numeric(12, 2) not null default 0,
  precio_minimo_venta_centavos bigint not null default 0,
  es_alta_rotacion boolean not null default false,
  precio_distribuidor_con_iva numeric(12, 2) not null default 0,
  precio_distribuidor_con_iva_centavos bigint not null default 0,
  precio_mayoreo_con_iva numeric(12, 2) not null default 0,
  precio_mayoreo_con_iva_centavos bigint not null default 0,
  precio_publico_con_iva numeric(12, 2) not null default 0,
  precio_publico_con_iva_centavos bigint not null default 0,
  precio_medio_mayoreo_con_iva numeric(12, 2) not null default 0,
  precio_medio_mayoreo_con_iva_centavos bigint not null default 0,
  precio_distribuidor_sin_iva numeric(12, 2) not null default 0,
  precio_distribuidor_sin_iva_centavos bigint not null default 0,
  precio_mayoreo_sin_iva numeric(12, 2) not null default 0,
  precio_mayoreo_sin_iva_centavos bigint not null default 0,
  precio_publico_sin_iva numeric(12, 2) not null default 0,
  precio_publico_sin_iva_centavos bigint not null default 0,
  precio_medio_mayoreo_sin_iva numeric(12, 2) not null default 0,
  precio_medio_mayoreo_sin_iva_centavos bigint not null default 0,
  familia_codigo text not null default '',
  familia_descripcion text not null default '',
  peso_kg numeric(12, 3) not null default 0,
  volumen_cm3 numeric(12, 2) not null default 0,
  marca_id text null references public.marcas(id) on update cascade on delete restrict,
  categoria_id text null references public.categorias(id) on update cascade on delete restrict,
  unidad_id text null references public.unidades(id) on update cascade on delete restrict,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.inventario_sucursal (
  producto_id text not null references public.productos(id) on update cascade on delete cascade,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  stock numeric(12, 3) not null default 0,
  stock_minimo numeric(12, 3) not null default 5,
  costo_promedio numeric(12, 4) not null default 0,
  costo_promedio_centavos bigint not null default 0,
  precio_venta numeric(12, 2) not null default 0,
  precio_venta_centavos bigint not null default 0,
  precio_distribuidor numeric(12, 2) not null default 0,
  precio_distribuidor_centavos bigint not null default 0,
  precio_mayoreo numeric(12, 2) not null default 0,
  precio_mayoreo_centavos bigint not null default 0,
  precio_medio_mayoreo numeric(12, 2) not null default 0,
  precio_medio_mayoreo_centavos bigint not null default 0,
  tiene_caducidad boolean not null default false,
  ultima_fecha_ingreso date null,
  fecha_caducidad date null,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (producto_id, sucursal_id)
);

create table if not exists public.promociones (
  id text primary key,
  nombre text not null,
  tipo_descuento text not null check (tipo_descuento in ('PORCENTAJE', 'MONTO_FIJO')),
  valor numeric(12, 2) not null check (valor > 0),
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  activo boolean not null default true,
  producto_id text null references public.productos(id) on update cascade on delete restrict,
  categoria_id text null,
  marca text null,
  permite_perdida boolean not null default false,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint chk_promociones_objetivo check (
    (producto_id is not null and categoria_id is null and marca is null)
    or (producto_id is null and categoria_id is not null and marca is null)
    or (producto_id is null and categoria_id is null and marca is not null)
  ),
  constraint chk_promociones_fechas check (fecha_fin >= fecha_inicio)
);

create table if not exists public.promocion_sucursales (
  promocion_id text not null references public.promociones(id) on update cascade on delete cascade,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete cascade,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (promocion_id, sucursal_id)
);

create table if not exists public.promociones_perdida_permitida (
  promocion_id text not null references public.promociones(id) on update cascade on delete cascade,
  producto_id text not null references public.productos(id) on update cascade on delete cascade,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete cascade,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (promocion_id, producto_id, sucursal_id)
);

create table if not exists public.clientes (
  id text primary key,
  nombre text not null,
  nombres text not null default '',
  apellido_paterno text not null default '',
  apellido_materno text not null default '',
  telefono text not null default '',
  direccion text not null default '',
  tipo_cliente text not null default 'CONSUMIDOR' check (tipo_cliente in ('CONSUMIDOR', 'MEDIO_MAYOREO', 'MAYOREO', 'DISTRIBUIDOR')),
  dias_credito integer not null default 0,
  limite_credito numeric(12, 2) not null default 0,
  saldo_deudor numeric(12, 2) not null default 0,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes_datos_fiscales (
  cliente_id text primary key references public.clientes(id) on update cascade on delete cascade,
  rfc varchar(13) not null unique,
  razon_social text not null,
  regimen_fiscal varchar(3) not null,
  codigo_postal varchar(5) not null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.compras (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  proveedor_id text not null references public.proveedores(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  fecha timestamptz not null check (fecha >= timestamptz '2000-01-01'),
  subtotal_sin_iva numeric(12, 2) not null default 0,
  subtotal_sin_iva_centavos bigint not null default 0,
  iva_total numeric(12, 2) not null default 0,
  iva_total_centavos bigint not null default 0,
  total_con_iva numeric(12, 2) not null default 0,
  total_con_iva_centavos bigint not null default 0,
  iva_porcentaje numeric(5, 2) not null default 16,
  total numeric(12, 2) not null default 0,
  total_centavos bigint not null default 0,
  condicion_pago text not null default 'CONTADO',
  fecha_vencimiento timestamptz null check (fecha_vencimiento is null or fecha_vencimiento >= timestamptz '2000-01-01'),
  estado_pago text not null default 'PENDIENTE',
  proyecto_id text null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.detalle_compras (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  compra_uuid uuid null references public.compras(uuid) on update cascade on delete cascade,
  compra_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  precio_costo_pactado numeric(12, 2) not null default 0,
  precio_costo_pactado_centavos bigint not null default 0,
  costo_promedio_resultante numeric(12, 4) null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.pagos_compras (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  compra_uuid uuid null references public.compras(uuid) on update cascade on delete restrict,
  compra_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  monto numeric(12, 2) not null,
  fecha timestamptz not null,
  metodo_pago text not null default 'EFECTIVO',
  afecta_caja boolean not null default true,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.cotizaciones (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  cliente_id text not null references public.clientes(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  fecha timestamptz not null check (fecha >= timestamptz '2000-01-01'),
  vigencia_dias integer not null default 15,
  fecha_vencimiento timestamptz not null check (fecha_vencimiento >= timestamptz '2000-01-01'),
  estado text not null default 'BORRADOR' check (estado in ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'VENCIDA', 'CANCELADA')),
  observaciones text not null default '',
  venta_id text null,
  folio text not null default '',
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  origen text not null default 'MODULO',
  nombre_referencia text not null default '',
  telefono_referencia text not null default '',
  motivo_cancelacion text not null default '',
  fecha_aceptacion timestamptz null,
  fecha_cancelacion timestamptz null,
  usuario_cancelo text null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

select public.touch_updated_at('cotizaciones');

create table if not exists public.cotizacion_detalles (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  cotizacion_uuid uuid null references public.cotizaciones(uuid) on update cascade on delete cascade,
  cotizacion_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  precio_unitario numeric(12, 2) not null default 0,
  tipo_precio text not null default 'MOSTRADOR',
  producto_codigo text not null default '',
  producto_descripcion text not null default '',
  producto_marca text not null default '',
  producto_unidad text not null default '',
  precio_original numeric(12, 2) not null default 0,
  descuento_unitario numeric(12, 2) not null default 0,
  descuento_total numeric(12, 2) not null default 0,
  promocion_id text not null default '',
  promocion_nombre text not null default '',
  promocion_tipo_descuento text not null default '',
  promocion_valor text not null default '0',
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, cotizacion_id)
);

select public.touch_updated_at('cotizacion_detalles');

create table if not exists public.ventas (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  fecha timestamptz not null,
  total numeric(12, 2) not null default 0,
  total_centavos bigint not null default 0,
  metodo_pago text not null check (metodo_pago in ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO', 'APARTADO')),
  efectivo_recibido numeric(12, 2) null,
  efectivo_recibido_centavos bigint null,
  cambio_entregado numeric(12, 2) null,
  cambio_entregado_centavos bigint null,
  cliente_id text null references public.clientes(id) on update cascade on delete restrict,
  cliente_rapido_nombre text null,
  cliente_rapido_telefono text null,
  cliente_rapido_domicilio text null,
  requiere_factura boolean not null default false,
  fecha_vencimiento timestamptz null,
  proyecto_id text null,
  usuario_autorizo_diverso_id text null references public.usuarios(id) on update cascade on delete restrict,
  motivo_autorizacion_diverso text null,
  usuario_autorizo_cancelacion_id text null references public.usuarios(id) on update cascade on delete restrict,
  motivo_cancelacion text null,
  fecha_cancelacion timestamptz null,
  estado text not null default 'COMPLETADA' check (estado in ('COMPLETADA', 'CANCELADA')),
  tipo_origen text not null default 'VENTA' check (tipo_origen in ('VENTA', 'APARTADO')),
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.proyectos (
  uuid uuid primary key default gen_random_uuid(),
  id text not null unique,
  cliente_id text not null references public.clientes(id) on update cascade on delete restrict,
  nombre text not null,
  descripcion text not null default '',
  ubicacion text not null default '',
  fecha_inicio timestamptz null,
  fecha_fin_estimada timestamptz null,
  presupuesto_total numeric(12, 2) not null default 0,
  estado text not null default 'ACTIVO' check (estado in ('ACTIVO', 'COMPLETADO', 'CANCELADO')),
  created_at timestamptz not null default now(),
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.presupuestos_obra (
  uuid uuid primary key default gen_random_uuid(),
  id text not null unique,
  proyecto_id text not null references public.proyectos(id) on update cascade on delete cascade,
  concepto text not null,
  categoria text not null default 'MATERIALES' check (categoria in ('MATERIALES', 'MANO_OBRA', 'EQUIPO', 'OTROS')),
  monto_presupuestado numeric(12, 2) not null default 0,
  monto_real numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.compras
  drop constraint if exists compras_proyecto_id_fkey;
alter table public.compras
  add constraint compras_proyecto_id_fkey
  foreign key (proyecto_id) references public.proyectos(id) on update cascade on delete set null;

alter table public.ventas
  drop constraint if exists ventas_proyecto_id_fkey;
alter table public.ventas
  add constraint ventas_proyecto_id_fkey
  foreign key (proyecto_id) references public.proyectos(id) on update cascade on delete set null;

create table if not exists public.detalle_ventas (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  venta_uuid uuid null references public.ventas(uuid) on update cascade on delete cascade,
  venta_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  precio_venta_pactado numeric(12, 2) not null default 0,
  precio_venta_pactado_centavos bigint not null default 0,
  costo_unitario_pactado numeric(12, 4) not null default 0,
  costo_unitario_pactado_centavos bigint not null default 0,
  tipo_precio_vendido text not null default 'MOSTRADOR',
  precio_original numeric(12, 2) not null default 0,
  precio_original_centavos bigint not null default 0,
  descuento_aplicado numeric(12, 2) not null default 0,
  descuento_aplicado_centavos bigint not null default 0,
  producto_descripcion text not null default '',
  unidad_venta text not null default '',
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.creditos_abonos (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  cliente_id text not null references public.clientes(id) on update cascade on delete restrict,
  monto numeric(12, 2) not null default 0,
  fecha timestamptz not null,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.cajas_sesiones (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  fecha_apertura timestamptz not null,
  monto_inicial numeric(12, 2) not null default 0,
  monto_inicial_centavos bigint not null default 0,
  fecha_cierre timestamptz null,
  monto_final_real numeric(12, 2) null,
  monto_final_real_centavos bigint null,
  monto_esperado numeric(12, 2) not null default 0,
  monto_esperado_centavos bigint not null default 0,
  estado text not null check (estado in ('ABIERTA', 'CERRADA')),
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.caja_movimientos (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  sesion_uuid uuid null references public.cajas_sesiones(uuid) on update cascade on delete cascade,
  sesion_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  tipo text not null check (tipo in ('INGRESO', 'EGRESO')),
  monto numeric(12, 2) not null default 0,
  monto_centavos bigint not null default 0,
  motivo text not null default '',
  afecta_efectivo boolean not null default true,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.traspasos (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  sucursal_origen_id text not null references public.sucursales(id) on update cascade on delete restrict,
  sucursal_destino_id text not null references public.sucursales(id) on update cascade on delete restrict,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  fecha timestamptz not null,
  estado text not null default 'EN_TRANSITO' check (estado in ('EN_TRANSITO', 'RECIBIDO', 'RECHAZADO', 'CANCELADO')),
  usuario_recibio_id text null references public.usuarios(id) on update cascade on delete restrict,
  fecha_recepcion timestamptz null,
  observaciones_recepcion text null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_origen_id)
);

create table if not exists public.detalle_traspasos (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  traspaso_uuid uuid null references public.traspasos(uuid) on update cascade on delete cascade,
  traspaso_id text not null,
  sucursal_origen_id text not null references public.sucursales(id) on update cascade on delete restrict,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_origen_id)
);

create table if not exists public.mermas_ajustes (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  tipo_movimiento text not null check (tipo_movimiento in ('MERMA', 'AJUSTE', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA')),
  motivo text not null,
  fecha timestamptz not null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.facturas_emitidas (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  venta_uuid uuid null references public.ventas(uuid) on update cascade on delete restrict,
  venta_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  uuid_sat text null,
  rfc_receptor varchar(13) not null,
  monto_total numeric(12, 2) not null default 0,
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'TIMBRADA', 'CANCELADA')),
  fecha_emision timestamptz not null,
  pdf_path text null,
  xml_path text null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id),
  unique (venta_id, sucursal_id)
);

create table if not exists public.devoluciones (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  venta_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  usuario_solicito_id text not null references public.usuarios(id) on update cascade on delete restrict,
  usuario_autorizo_id text not null references public.usuarios(id) on update cascade on delete restrict,
  motivo text not null,
  fecha timestamptz not null,
  total_devuelto numeric(12, 2) not null default 0,
  metodo_pago_original text not null check (metodo_pago_original in ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO')),
  estado text not null default 'REGISTRADA' check (estado in ('REGISTRADA', 'ANULADA')),
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.detalle_devoluciones (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  devolucion_id text not null,
  detalle_venta_id text not null,
  venta_id text not null,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  precio_venta_pactado numeric(12, 2) not null default 0,
  costo_unitario_pactado numeric(12, 4) not null default 0,
  reintegrar_stock boolean not null default true,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.garantias (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  venta_id text not null,
  detalle_venta_id text not null,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  cliente_id text null references public.clientes(id) on update cascade on delete restrict,
  usuario_registro_id text not null references public.usuarios(id) on update cascade on delete restrict,
  usuario_resolvio_id text null references public.usuarios(id) on update cascade on delete restrict,
  fecha_registro timestamptz not null,
  fecha_resolucion timestamptz null,
  motivo text not null,
  diagnostico text null,
  solucion text null,
  estado text not null default 'ABIERTA' check (estado in ('ABIERTA', 'RESUELTA', 'RECHAZADA')),
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.bitacora_auditoria (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  entidad_tipo text not null,
  entidad_id text not null,
  accion text not null,
  descripcion text not null,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  sucursal_id text null references public.sucursales(id) on update cascade on delete restrict,
  fecha timestamptz not null default now(),
  metadata_json text not null default '{}',
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, usuario_id)
);

create table if not exists public.producto_trazabilidad (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  tipo text not null check (tipo in ('SERIAL', 'LOTE')),
  identificador text not null,
  cantidad numeric(12, 3) not null default 1,
  estado text not null default 'DISPONIBLE' check (estado in ('DISPONIBLE', 'VENDIDO', 'DEVUELTO', 'GARANTIA', 'BAJA')),
  referencia_tipo text null,
  referencia_id text null,
  usuario_id text null references public.usuarios(id) on update cascade on delete set null,
  fecha timestamptz not null default now(),
  observaciones text not null default '',
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id),
  unique (producto_id, sucursal_id, tipo, identificador)
);

create table if not exists public.apartados (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  folio text not null default '',
  cliente_id text null references public.clientes(id) on update cascade on delete restrict,
  cliente_nombre_rapido text not null default '',
  nombre_referencia text not null default '',
  telefono_referencia text not null default '',
  observaciones text not null default '',
  tipo_precio text not null default 'MOSTRADOR',
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  fecha timestamptz not null check (fecha >= timestamptz '2000-01-01'),
  fecha_vencimiento timestamptz null check (fecha_vencimiento is null or fecha_vencimiento >= timestamptz '2000-01-01'),
  total numeric(12, 2) not null default 0,
  total_centavos bigint not null default 0,
  anticipo_total numeric(12, 2) not null default 0,
  anticipo_total_centavos bigint not null default 0,
  saldo_pendiente numeric(12, 2) not null default 0,
  saldo_pendiente_centavos bigint not null default 0,
  estado text not null default 'ABIERTO' check (estado in ('ABIERTO', 'LIQUIDADO', 'CANCELADO')),
  motivo_cancelacion text null,
  fecha_cancelacion timestamptz null,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.detalle_apartados (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  apartado_id text not null,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  cantidad numeric(12, 3) not null default 0,
  precio_venta_pactado numeric(12, 2) not null default 0,
  precio_venta_pactado_centavos bigint not null default 0,
  costo_unitario_pactado numeric(12, 4) not null default 0,
  costo_unitario_pactado_centavos bigint not null default 0,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.apartados_pagos (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  apartado_id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  fecha timestamptz not null check (fecha >= timestamptz '2000-01-01'),
  monto numeric(12, 2) not null default 0,
  monto_centavos bigint not null default 0,
  metodo_pago text not null check (metodo_pago in ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
  caja_movimiento_id text null,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.ordenes_compra_sugeridas (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  proveedor_id text not null references public.proveedores(id) on update cascade on delete restrict,
  usuario_id text not null references public.usuarios(id) on update cascade on delete restrict,
  fecha timestamptz not null,
  estado text not null default 'CONFIRMADA' check (estado in ('SUGERIDA', 'CONFIRMADA', 'RECIBIDA', 'CANCELADA')),
  observaciones text not null default '',
  total_estimado numeric(14, 2) not null default 0,
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id)
);

create table if not exists public.detalle_ordenes_compra_sugeridas (
  uuid uuid primary key default gen_random_uuid(),
  id text not null,
  orden_id text not null,
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  cantidad_sugerida numeric(12, 3) not null default 0,
  cantidad_confirmada numeric(12, 3) not null default 0,
  precio_costo_sugerido numeric(14, 2) not null default 0,
  costo_promedio_sugerido numeric(14, 2) not null default 0,
  ventas_30_dias numeric(14, 3) not null default 0,
  origen text not null default 'SISTEMA',
  eliminado boolean not null default false,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, sucursal_id),
  foreign key (orden_id, sucursal_id) references public.ordenes_compra_sugeridas(id, sucursal_id) on update cascade on delete cascade
);

create table if not exists public.catalogo_dun (
  codigo text primary key,
  dun14_inner text not null default '',
  dun14_master text not null default '',
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now(),
  eliminado boolean not null default false
);

create table if not exists public.movimientos_inventario (
  uuid uuid primary key default gen_random_uuid(),
  producto_id text not null references public.productos(id) on update cascade on delete restrict,
  sucursal_id text not null references public.sucursales(id) on update cascade on delete restrict,
  tipo text not null check (tipo in ('COMPRA', 'VENTA', 'CANCELACION_VENTA', 'TRASPASO_SALIDA', 'TRASPASO_ENTRADA', 'TRASPASO_RECHAZO', 'MERMA', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA')),
  referencia_tipo text not null,
  referencia_id text not null,
  cantidad numeric(12, 3) not null,
  costo_unitario numeric(12, 4) null,
  usuario_id text null references public.usuarios(id) on update cascade on delete restrict,
  fecha timestamptz not null,
  sincronizado boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists idx_sucursales_eliminado on public.sucursales(eliminado);
create index if not exists idx_perifericos_config_updated_at on public.perifericos_config(updated_at);
create index if not exists idx_usuarios_eliminado on public.usuarios(eliminado);
create index if not exists idx_usuarios_activo on public.usuarios(activo, eliminado);
create index if not exists idx_proveedores_eliminado on public.proveedores(eliminado);
create index if not exists idx_marcas_nombre on public.marcas(nombre);
create index if not exists idx_categorias_nombre on public.categorias(nombre);
create index if not exists idx_unidades_nombre on public.unidades(nombre);
create index if not exists idx_productos_eliminado on public.productos(eliminado);
create index if not exists idx_productos_descripcion on public.productos(descripcion);
create index if not exists idx_productos_codigo_barras on public.productos(codigo_barras);
create index if not exists idx_productos_codigo_proveedor on public.productos(codigo_proveedor);
create index if not exists idx_productos_mayoreo on public.productos(mayoreo_apartir) where mayoreo_apartir > 0;
create index if not exists idx_productos_caducidad on public.productos(caducidad) where caducidad is not null;
create index if not exists idx_inventario_sucursal_id on public.inventario_sucursal(sucursal_id);
create index if not exists idx_inventario_sucursal_eliminado on public.inventario_sucursal(eliminado);
create index if not exists idx_promociones_producto on public.promociones(producto_id);
create index if not exists idx_promociones_categoria on public.promociones(categoria_id);
create index if not exists idx_promociones_vigencia on public.promociones(activo, eliminado, fecha_inicio, fecha_fin);
create index if not exists idx_promocion_sucursales_sucursal on public.promocion_sucursales(sucursal_id, eliminado);
create index if not exists idx_promociones_perdida_permitida_lookup on public.promociones_perdida_permitida(promocion_id, producto_id, sucursal_id);
create index if not exists idx_clientes_eliminado on public.clientes(eliminado);
create index if not exists idx_clientes_nombre on public.clientes(nombre);
create index if not exists idx_clientes_updated_at on public.clientes(updated_at);
create index if not exists idx_proyectos_eliminado on public.proyectos(eliminado);
create index if not exists idx_proyectos_cliente on public.proyectos(cliente_id);
create index if not exists idx_proyectos_estado on public.proyectos(estado);
create index if not exists idx_presupuestos_obra_eliminado on public.presupuestos_obra(eliminado);
create index if not exists idx_presupuestos_obra_proyecto on public.presupuestos_obra(proyecto_id);
create index if not exists idx_ventas_sucursal_fecha on public.ventas(sucursal_id, fecha);
create index if not exists idx_ventas_updated_at on public.ventas(updated_at);
create index if not exists idx_ventas_proyecto_id on public.ventas(proyecto_id) where proyecto_id is not null;
create index if not exists idx_detalle_ventas_venta_uuid on public.detalle_ventas(venta_uuid);
create index if not exists idx_abonos_cliente_fecha on public.creditos_abonos(cliente_id, fecha);
create index if not exists idx_compras_proyecto_id on public.compras(proyecto_id) where proyecto_id is not null;
create index if not exists idx_cajas_sesiones_usuario_estado on public.cajas_sesiones(usuario_id, sucursal_id, estado);
create unique index if not exists idx_cajas_sesiones_abierta_unica
  on public.cajas_sesiones(usuario_id, sucursal_id)
  where estado = 'ABIERTA';
create index if not exists idx_caja_movimientos_sesion_uuid on public.caja_movimientos(sesion_uuid);
create index if not exists idx_traspasos_fecha on public.traspasos(fecha);
create index if not exists idx_mermas_sucursal on public.mermas_ajustes(sucursal_id);
create index if not exists idx_movimientos_inventario_producto_sucursal on public.movimientos_inventario(producto_id, sucursal_id, fecha);
create index if not exists idx_movimientos_inventario_referencia on public.movimientos_inventario(referencia_tipo, referencia_id);
create index if not exists idx_facturas_emitidas_estado_fecha on public.facturas_emitidas(estado, fecha_emision);
create index if not exists idx_devoluciones_sucursal_fecha on public.devoluciones(sucursal_id, fecha);
create index if not exists idx_devoluciones_venta on public.devoluciones(venta_id);
create index if not exists idx_detalle_devoluciones_devolucion on public.detalle_devoluciones(devolucion_id);
create index if not exists idx_detalle_devoluciones_venta_detalle on public.detalle_devoluciones(venta_id, detalle_venta_id);
create index if not exists idx_garantias_sucursal_estado on public.garantias(sucursal_id, estado, fecha_registro);
create index if not exists idx_garantias_venta on public.garantias(venta_id);
create index if not exists idx_bitacora_entidad on public.bitacora_auditoria(entidad_tipo, entidad_id);
create index if not exists idx_bitacora_sucursal_fecha on public.bitacora_auditoria(sucursal_id, fecha);
create index if not exists idx_producto_trazabilidad_sucursal_estado on public.producto_trazabilidad(sucursal_id, estado, fecha);
create index if not exists idx_producto_trazabilidad_producto on public.producto_trazabilidad(producto_id, fecha);
create index if not exists idx_apartados_sucursal_estado on public.apartados(sucursal_id, estado, fecha);
create index if not exists idx_detalle_apartados_apartado on public.detalle_apartados(apartado_id);
create index if not exists idx_apartados_pagos_apartado on public.apartados_pagos(apartado_id, fecha);
create index if not exists idx_ordenes_compra_sugeridas_sucursal_estado on public.ordenes_compra_sugeridas(sucursal_id, estado, fecha);
create index if not exists idx_ordenes_compra_sugeridas_proveedor on public.ordenes_compra_sugeridas(proveedor_id, fecha);
create index if not exists idx_detalle_ordenes_compra_sugeridas_orden on public.detalle_ordenes_compra_sugeridas(orden_id);

select public.touch_updated_at('sucursales');
select public.touch_updated_at('empresa_config_fiscal');
select public.touch_updated_at('perifericos_config');
select public.touch_updated_at('proveedores');
select public.touch_updated_at('usuarios');
select public.touch_updated_at('marcas');
select public.touch_updated_at('categorias');
select public.touch_updated_at('unidades');
select public.touch_updated_at('configuracion_general');
select public.touch_updated_at('productos');
select public.touch_updated_at('inventario_sucursal');
select public.touch_updated_at('promociones');
select public.touch_updated_at('promocion_sucursales');
select public.touch_updated_at('promociones_perdida_permitida');
select public.touch_updated_at('clientes');
select public.touch_updated_at('clientes_datos_fiscales');
select public.touch_updated_at('compras');
select public.touch_updated_at('detalle_compras');
select public.touch_updated_at('pagos_compras');
select public.touch_updated_at('ventas');
select public.touch_updated_at('detalle_ventas');
select public.touch_updated_at('creditos_abonos');
select public.touch_updated_at('cajas_sesiones');
select public.touch_updated_at('caja_movimientos');
select public.touch_updated_at('traspasos');
select public.touch_updated_at('detalle_traspasos');
select public.touch_updated_at('mermas_ajustes');
select public.touch_updated_at('facturas_emitidas');
select public.touch_updated_at('devoluciones');
select public.touch_updated_at('detalle_devoluciones');
select public.touch_updated_at('garantias');
select public.touch_updated_at('bitacora_auditoria');
select public.touch_updated_at('producto_trazabilidad');
select public.touch_updated_at('apartados');
select public.touch_updated_at('detalle_apartados');
select public.touch_updated_at('apartados_pagos');
select public.touch_updated_at('ordenes_compra_sugeridas');
select public.touch_updated_at('detalle_ordenes_compra_sugeridas');
select public.touch_updated_at('proyectos');
select public.touch_updated_at('presupuestos_obra');
select public.touch_updated_at('catalogo_dun');
select public.touch_updated_at('movimientos_inventario');

-- =============================================================
-- Row-Level Security (RLS)
-- =============================================================
-- Estas políticas asumen que la app se conecta con service_role key
-- (la cual bypassea RLS). No se requiere autenticación de Supabase.
-- Se activa RLS para bloquear accesos no autorizados desde afuera.

do $$
declare
    t text;
    tables text[] := array[
        'sucursales','empresa_config_fiscal','configuracion_general','usuarios',
        'proveedores','marcas','categorias','unidades','productos',
        'inventario_sucursal','clientes','clientes_datos_fiscales','compras',
        'detalle_compras','pagos_compras','ventas','detalle_ventas','creditos_abonos',
        'cajas_sesiones','caja_movimientos','traspasos','detalle_traspasos',
        'mermas_ajustes','movimientos_inventario','facturas_emitidas',
        'promociones','promocion_sucursales','devoluciones','detalle_devoluciones',
        'garantias','bitacora_auditoria','apartados','detalle_apartados',
        'apartados_pagos','ordenes_compra_sugeridas','detalle_ordenes_compra_sugeridas',
        'producto_trazabilidad','proyectos','presupuestos_obra','cotizaciones',
        'cotizacion_detalles','catalogo_dun'
    ];
begin
    foreach t in array tables loop
        execute format('alter table if exists public.%I enable row level security;', t);
    end loop;
end $$;

-- Política única para todas las tablas: los usuarios autenticados pueden leer
-- (la app usa service_role que bypassea RLS, esto es solo una red de seguridad)
do $$
declare
    t text;
    tables text[] := array[
        'sucursales','empresa_config_fiscal','configuracion_general','usuarios',
        'proveedores','marcas','categorias','unidades','productos',
        'inventario_sucursal','clientes','clientes_datos_fiscales','compras',
        'detalle_compras','pagos_compras','ventas','detalle_ventas','creditos_abonos',
        'cajas_sesiones','caja_movimientos','traspasos','detalle_traspasos',
        'mermas_ajustes','movimientos_inventario','facturas_emitidas',
        'promociones','promocion_sucursales','devoluciones','detalle_devoluciones',
        'garantias','bitacora_auditoria','apartados','detalle_apartados',
        'apartados_pagos','ordenes_compra_sugeridas','detalle_ordenes_compra_sugeridas',
        'producto_trazabilidad','proyectos','presupuestos_obra','cotizaciones',
        'cotizacion_detalles','catalogo_dun'
    ];
begin
    foreach t in array tables loop
        execute format(
            'drop policy if exists "trata_via_service_role_%I" on public.%I;
             create policy "trata_via_service_role_%I" on public.%I
             for all using (true) with check (true);',
            t, t, t, t
        );
    end loop;
end $$;
