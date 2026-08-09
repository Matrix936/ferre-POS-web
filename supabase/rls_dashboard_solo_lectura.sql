-- ============================================================================
-- FERRE-POS DASHBOARD — RLS de solo lectura + funciones de indicadores
-- ============================================================================
-- Repo: ferre-pos-dashboard (hermano de ferre-pos)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query  (NO via API)
--
-- Qué hace:
--   1) Revoca TODA escritura al rol `authenticated` (INSERT/UPDATE/DELETE/
--      TRUNCATE/REFERENCES/TRIGGER y secuencias) sobre todas las tablas.
--   2) Reemplaza la política genérica `allow_service_role_*` (que era
--      `for all using(true)` = abierta a cualquiera con privilegio) por una
--      `service_role_all` restringida SOLO a `service_role`.
--   3) Crea políticas de SOLO SELECT para `authenticated`:
--        - Tablas catálogo (globales)      → ver todo (read-only).
--        - Tablas por sucursal             → ver solo su sucursal, salvo
--          SUPERADMIN/ADMIN que ven todas.
--   4) Expone los indicadores como funciones Postgres read-only que la web
--      consume vía RPC. Son SECURITY INVOKER + SELECT únicamente, así que RLS
--      sigue filtrando por rol/sucursal aunque se llame con la anon key.
--
-- La app de escritorio usa la service_role key, que BYPASEA RLS: NO se ve
-- afectada por nada de este script. Esto es seguro de aplicar (idempotente).
--
-- Convención de moneda: las funciones usan las columnas `*_centavos` (bigint)
-- que son las canónicas en Supabase (no los `numeric`, que solo son de SQLite).
-- Zona horaria de reportes: 'America/Mexico_City' (usada en las funciones
-- ventas_por_dia; ajusta aquí y en esas dos funciones si cambia).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) (Seguridad defensiva) Asegurar RLS activo en toda tabla de public
-- ----------------------------------------------------------------------------
do $$
declare
    r record;
begin
    for r in
        select tablename from pg_tables where schemaname = 'public'
    loop
        execute format('alter table public.%I enable row level security;', r.tablename);
    end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 1) Revocar TODA escritura a `authenticated` sobre tablas y secuencias.
--    Se conserva el privilegio SELECT (necesario para leer bajo RLS).
--    REVOKE es idempotente: re-ejecutar no da error.
-- ----------------------------------------------------------------------------
do $$
declare
    r record;
begin
    for r in
        select tablename from pg_tables where schemaname = 'public'
    loop
        execute format(
            'revoke insert, update, delete, truncate, references, trigger on public.%I from authenticated;',
            r.tablename
        );
    end loop;
end $$;

do $$
declare
    r record;
begin
    for r in
        select c.relname
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'S'
    loop
        execute format('revoke all on sequence public.%I from authenticated;', r.relname);
    end loop;
end $$;

-- Revocar ejecución de TODAS las funciones (las de indicadores se vuelven a
-- conceder al final). Los triggers siguen funcionando (no requieren EXECUTE).
revoke all on all functions in schema public from authenticated;

-- ----------------------------------------------------------------------------
-- 2) Helper de alcance: ¿el usuario autenticado puede leer esta sucursal?
--    Se lee de auth.jwt().app_metadata.role / .sucursal_id (definidos por
--    scripts/seed-owner.mjs). SUPERADMIN y ADMIN ven todas las sucursales;
--    USUARIO ve únicamente la suya.
-- ----------------------------------------------------------------------------
create or replace function public.dash_puede_ver_sucursal(p_sucursal text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
    v_rol         text := auth.jwt() -> 'app_metadata' ->> 'role';
    v_sucursal    text := auth.jwt() -> 'app_metadata' ->> 'sucursal_id';
begin
    if v_rol in ('SUPERADMIN', 'ADMIN') then
        return true;
    end if;
    return v_sucursal is not null and v_sucursal = p_sucursal;
end $$;

grant execute on function public.dash_puede_ver_sucursal(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 3) Reemplazar la política abierta `allow_service_role_*` (for all using true)
--    por una restringida a `service_role`, y crear las políticas SELECT para
--    `authenticated`. service_role bypasea RLS: `service_role_all` es solo
--    formalidad/red de seguridad; lo importante es que `authenticated` ya no
--    tiene la política using(true) global que lo dejaba leer todo.
-- ----------------------------------------------------------------------------
do $$
declare
    r record;
begin
    -- 3.0 Drop de las políticas genéricas pre-existentes (idempotente). Se cubren
--     los dos nombres históricos para funcionar igual en staging (viene del
--     schema_ferre_pos_completo.sql: `trata_via_service_role_*`) y en
--     producción (viene de migracion_rls_seguridad.sql: `allow_service_role_*`)
    for r in
        select tablename from pg_tables where schemaname = 'public'
    loop
        execute format('drop policy if exists "allow_service_role_%I" on public.%I;', r.tablename, r.tablename);
        execute format('drop policy if exists "trata_via_service_role_%I" on public.%I;', r.tablename, r.tablename);
    end loop;

    -- 3.1 Política `for all` limitada a service_role (todas las tablas)
    for r in
        select tablename from pg_tables where schemaname = 'public'
    loop
        execute format(
            'drop policy if exists "service_role_all_%I" on public.%I;
             create policy "service_role_all_%I" on public.%I
             for all to service_role using (true) with check (true);',
            r.tablename, r.tablename, r.tablename, r.tablename
        );
    end loop;
end $$;

-- 3.2 Tablas catálogo (globales): `authenticated` puede LEER todas las filas.
--     Solo SELECT (ya revocamos la escritura en el paso 1).
do $$
declare
    t text;
    tables text[] := array[
        'sucursales','proveedores','marcas','categorias','unidades',
        'productos','clientes'
    ];
begin
    foreach t in array tables loop
        execute format(
            'drop policy if exists "dash_select_global_%I" on public.%I;
             create policy "dash_select_global_%I" on public.%I
             for select to authenticated using (true);',
            t, t, t, t
        );
    end loop;
end $$;

-- 3.3 Tablas por sucursal: `authenticated` solo ve su sucursal (SUPERADMIN/ADMIN
--     ven todas, vía dash_puede_ver_sucursal).
do $$
declare
    t text;
    tables text[] := array[
        'ventas','detalle_ventas','inventario_sucursal','compras',
        'detalle_compras','pagos_compras','cotizaciones','cotizacion_detalles',
        'apartados','detalle_apartados','apartados_pagos','creditos_abonos',
        'cajas_sesiones','caja_movimientos','configuracion_general',
        'mermas_ajustes','movimientos_inventario','facturas_emitidas',
        'devoluciones','detalle_devoluciones','garantias','producto_trazabilidad',
        'bitacora_auditoria',
        'ordenes_compra_sugeridas','detalle_ordenes_compra_sugeridas'
    ];
begin
    foreach t in array tables loop
        execute format(
            'drop policy if exists "dash_select_scoped_%I" on public.%I;
             create policy "dash_select_scoped_%I" on public.%I
             for select to authenticated
             using (public.dash_puede_ver_sucursal(sucursal_id));',
            t, t, t, t
        );
    end loop;
end $$;

-- ----------------------------------------------------------------------------
-- NOTA: estas tablas NO reciben política SELECT para `authenticated`
-- (siguen siendo solo service_role): usuarios (contiene password_hash),
-- empresa_config_fiscal, perifericos_config, catalogo_dun, traspasos y
-- detalle_traspasos (no tienen sucursal_id), promociones*, proyectos y
-- presupuestos_obra (no tienen sucursal_id; se aíslan por diseño).
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 3.4 Vista segura de usuarios (solo id + nombre) para los reportes que deben
--     mostrar quién operó (p. ej. cortes de caja). Se crea sin
--     security_invoker, así que se ejecuta con los privilegios de su owner
--     (equivalente a SECURITY DEFINER) y puede leer `usuarios` aunque esa tabla
--     no tenga política SELECT para `authenticated`. La vista solo proyecta
--     id/nombre: password_hash y el resto nunca se exponen.
create or replace view public.dash_v_usuarios
as
select u.id, u.nombre
from public.usuarios u;

grant select on public.dash_v_usuarios to authenticated;

-- ----------------------------------------------------------------------------
-- 4) Funciones de indicadores (read-only, SECURITY INVOKER → respetan RLS)
--    Replican 1:1 las queries del backend de escritorio (src-tauri/src/lib.rs):
--      · get_indicador_ventas_blocking      → indicador_ventas / ventas_por_metodo
--      · query_productos_mas_vendidos       → productos_mas_vendidos
--      · get_indicador_inventario_blocking  → inventario_resumen / inventario_bajo_stock
--      · (nuevas para la web)               → ventas_por_dia / ventas_por_sucursal
-- ----------------------------------------------------------------------------

-- 4.1 Resumen de ventas del período
create or replace function public.indicador_ventas(
    p_desde      timestamptz default null,
    p_hasta      timestamptz default null,
    p_sucursal_id text       default null,
    p_metodo_pago text       default null
)
returns table (
    total_vendido_centavos   bigint,
    transacciones            bigint,
    ticket_promedio_centavos bigint,
    ventas_canceladas        bigint,
    ventas_credito_centavos  bigint,
    ventas_contado_centavos  bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
    v_total    bigint;
    v_ops      bigint;
    v_cancel   bigint;
    v_credito  bigint;
begin
    select
        coalesce(sum(total_centavos) filter (where estado = 'COMPLETADA'), 0),
        count(*) filter (where estado = 'COMPLETADA'),
        count(*) filter (where estado = 'CANCELADA'),
        coalesce(sum(total_centavos) filter (where estado = 'COMPLETADA' and metodo_pago = 'CREDITO'), 0)
      into v_total, v_ops, v_cancel, v_credito
    from public.ventas v
    where (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta)
      and (p_metodo_pago is null or v.metodo_pago = p_metodo_pago);

    return query
    select
        v_total,
        v_ops,
        case when v_ops > 0 then v_total / v_ops else 0 end as ticket_promedio_centavos,
        v_cancel,
        v_credito,
        v_total - v_credito as ventas_contado_centavos;
end $$;

-- 4.2 Ventas COMPLETADAS agrupadas por método de pago
create or replace function public.ventas_por_metodo(
    p_desde       timestamptz default null,
    p_hasta       timestamptz default null,
    p_sucursal_id text        default null
)
returns table (
    metodo_pago      text,
    total_centavos   bigint,
    transacciones    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select v.metodo_pago,
           coalesce(sum(v.total_centavos), 0) as total_centavos,
           count(*) as transacciones
    from public.ventas v
    where v.estado = 'COMPLETADA'
      and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta)
    group by v.metodo_pago
    order by total_centavos desc;
$$;

-- 4.3 Top de productos más vendidos (unidades) en el período
create or replace function public.productos_mas_vendidos(
    p_desde       timestamptz default null,
    p_hasta       timestamptz default null,
    p_sucursal_id text        default null,
    p_limite      integer     default 5
)
returns table (
    producto_id       text,
    codigo_proveedor  text,
    descripcion       text,
    marca             text,
    unidades_vendidas numeric
)
language sql
stable
security invoker
set search_path = public
as $$
    select p.id,
           coalesce(p.codigo_proveedor, ''),
           p.descripcion,
           coalesce(m.nombre, ''),
           coalesce(sum(dv.cantidad), 0) as unidades
    from public.detalle_ventas dv
    inner join public.ventas v    on v.id = dv.venta_id
    inner join public.productos p on p.id = dv.producto_id
    left join public.marcas m     on m.id = p.marca_id
    where v.estado = 'COMPLETADA'
      and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta)
    group by p.id, p.codigo_proveedor, p.descripcion, p.marca_id, m.nombre
    order by unidades desc
    limit greatest(p_limite, 0);
$$;

-- 4.4 Resumen de inventario por sucursal (o todas si p_sucursal_id es null)
create or replace function public.inventario_resumen(
    p_sucursal_id text default null
)
returns table (
    productos_en_inventario bigint,
    valor_centavos          bigint,
    stock_total             numeric,
    stock_bajo              bigint,
    sin_stock               bigint,
    sobre_stock             bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        count(*) as productos_en_inventario,
        coalesce(round(sum(i.stock * coalesce(nullif(i.costo_promedio_centavos, 0), p.precio_costo_centavos, 0))), 0)::bigint as valor_centavos,
        coalesce(sum(i.stock), 0) as stock_total,
        coalesce(sum(case when i.stock_minimo > 0 and i.stock > 0 and i.stock <= i.stock_minimo then 1 else 0 end), 0) as stock_bajo,
        coalesce(sum(case when i.stock <= 0 then 1 else 0 end), 0) as sin_stock,
        coalesce(sum(case when i.stock_minimo > 0 and i.stock >= i.stock_minimo * 3 then 1 else 0 end), 0) as sobre_stock
    from public.inventario_sucursal i
    inner join public.productos p on p.id = i.producto_id
    where i.eliminado = false
      and p.eliminado = false
      and (p_sucursal_id is null or i.sucursal_id = p_sucursal_id);
$$;

-- 4.5 Listado de productos bajo/agotados (estilo query_productos_bajo_stock)
create or replace function public.inventario_bajo_stock(
    p_sucursal_id text    default null,
    p_limite      integer default 50
)
returns table (
    producto_id     text,
    codigo_proveedor text,
    descripcion     text,
    marca           text,
    sucursal_id     text,
    sucursal_nombre text,
    stock           numeric,
    stock_minimo    numeric,
    unidad          text,
    motivo          text
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        p.id,
        coalesce(p.codigo_proveedor, ''),
        p.descripcion,
        coalesce(m.nombre, ''),
        s.id,
        s.nombre,
        i.stock,
        i.stock_minimo,
        coalesce(u.nombre, ''),
        case
            when i.stock <= 0 then 'Sin stock'
            when i.stock <= i.stock_minimo then 'Bajo stock'
            else 'Bajo stock'
        end as motivo
    from public.inventario_sucursal i
    inner join public.productos p  on p.id = i.producto_id
    inner join public.sucursales s on s.id = i.sucursal_id
    left join public.marcas m      on m.id = p.marca_id
    left join public.unidades u    on u.id = p.unidad_id
    where i.stock_minimo > 0
      and i.stock <= i.stock_minimo
      and p.eliminado = false
      and i.eliminado = false
      and s.eliminado = false
      and (p_sucursal_id is null or i.sucursal_id = p_sucursal_id)
    order by (i.stock - i.stock_minimo) asc, p.descripcion
    limit greatest(p_limite, 0);
$$;

-- 4.6 Tendencia: ventas COMPLETADAS por día (zona local) y sucursal.
--     p_desde/p_hasta son fechas (date) en la zona America/Mexico_City.
create or replace function public.ventas_por_dia(
    p_desde       date default null,
    p_hasta       date default null,
    p_sucursal_id text default null
)
returns table (
    fecha            date,
    sucursal_id      text,
    sucursal_nombre  text,
    total_centavos   bigint,
    transacciones    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        (v.fecha at time zone 'America/Mexico_City')::date as fecha,
        v.sucursal_id,
        s.nombre as sucursal_nombre,
        coalesce(sum(v.total_centavos), 0) as total_centavos,
        count(*) as transacciones
    from public.ventas v
    inner join public.sucursales s on s.id = v.sucursal_id
    where v.estado = 'COMPLETADA'
      and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
      and (p_desde is null or (v.fecha at time zone 'America/Mexico_City')::date >= p_desde)
      and (p_hasta is null or (v.fecha at time zone 'America/Mexico_City')::date <= p_hasta)
    group by fecha, v.sucursal_id, s.nombre
    order by fecha asc, v.sucursal_id;
$$;

-- 4.7 Comparativa por sucursal en el rango (ventas COMPLETADAS)
create or replace function public.ventas_por_sucursal(
    p_desde date default null,
    p_hasta date default null
)
returns table (
    sucursal_id     text,
    sucursal_nombre text,
    total_centavos  bigint,
    transacciones   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        v.sucursal_id,
        s.nombre as sucursal_nombre,
        coalesce(sum(v.total_centavos), 0) as total_centavos,
        count(*) as transacciones
    from public.ventas v
    inner join public.sucursales s on s.id = v.sucursal_id
    where v.estado = 'COMPLETADA'
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta)
    group by v.sucursal_id, s.nombre
    order by total_centavos desc;
$$;

-- 4.8 Rentabilidad del período (utilidad = precio pactado − costo pactado)
--     Réplica de get_indicador_rentabilidad / get_rentabilidad del escritorio.
create or replace function public.rentabilidad_resumen(
    p_desde       timestamptz default null,
    p_hasta       timestamptz default null,
    p_sucursal_id text        default null
)
returns table (
    venta_total_centavos bigint,
    costo_total_centavos bigint,
    utilidad_centavos    bigint,
    margen_porcentaje    numeric
)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
    return query
    with agg as (
        select
            coalesce(sum(dv.cantidad * dv.precio_venta_pactado_centavos), 0)   as venta,
            coalesce(sum(dv.cantidad * dv.costo_unitario_pactado_centavos), 0) as costo
        from public.detalle_ventas dv
        inner join public.ventas v on v.id = dv.venta_id
        where v.estado = 'COMPLETADA'
          and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
          and (p_desde is null or v.fecha >= p_desde)
          and (p_hasta is null or v.fecha <= p_hasta)
    )
    select
        venta,
        costo,
        venta - costo as utilidad,
        case when venta > 0 then round((venta - costo) * 100.0 / venta, 2) else 0 end as margen
    from agg;
end $$;

-- 4.9 Rentabilidad por producto (top N por utilidad) en el período
create or replace function public.rentabilidad_productos(
    p_desde       timestamptz default null,
    p_hasta       timestamptz default null,
    p_sucursal_id text        default null,
    p_limite      integer     default 50
)
returns table (
    producto_id       text,
    codigo_proveedor  text,
    descripcion       text,
    marca             text,
    unidades_vendidas numeric,
    venta_centavos    bigint,
    costo_centavos    bigint,
    utilidad_centavos bigint,
    margen_porcentaje numeric
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        p.id,
        coalesce(p.codigo_proveedor, ''),
        p.descripcion,
        coalesce(m.nombre, ''),
        coalesce(sum(dv.cantidad), 0) as unidades,
        coalesce(sum(dv.cantidad * dv.precio_venta_pactado_centavos), 0)   as venta,
        coalesce(sum(dv.cantidad * dv.costo_unitario_pactado_centavos), 0) as costo,
        coalesce(
            sum(dv.cantidad * dv.precio_venta_pactado_centavos)
          - sum(dv.cantidad * dv.costo_unitario_pactado_centavos), 0
        ) as utilidad,
        case
            when sum(dv.cantidad * dv.precio_venta_pactado_centavos) > 0
            then round(
                (sum(dv.cantidad * dv.precio_venta_pactado_centavos)
                 - sum(dv.cantidad * dv.costo_unitario_pactado_centavos))
                * 100.0
                / sum(dv.cantidad * dv.precio_venta_pactado_centavos), 2
            )
            else 0
        end as margen
    from public.detalle_ventas dv
    inner join public.ventas v    on v.id = dv.venta_id
    inner join public.productos p on p.id = dv.producto_id
    left join public.marcas m     on m.id = p.marca_id
    where v.estado = 'COMPLETADA'
      and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta)
    group by p.id, p.codigo_proveedor, p.descripcion, p.marca_id, m.nombre
    order by utilidad desc
    limit greatest(p_limite, 0);
$$;

-- 4.10 Resumen financiero: caja, ventas por método, compras, CxC, CxP y flujo.
--      Réplica de get_indicador_financiero (5 SETs) del escritorio.
create or replace function public.financiero_resumen(
    p_desde       timestamptz default null,
    p_hasta       timestamptz default null,
    p_sucursal_id text        default null
)
returns table (
    ingresos_caja_centavos       bigint,
    egresos_caja_centavos        bigint,
    ventas_efectivo_centavos     bigint,
    ventas_tarjeta_centavos      bigint,
    ventas_transferencia_centavos bigint,
    ventas_credito_centavos      bigint,
    compras_centavos             bigint,
    cuentas_por_cobrar_centavos  bigint,
    cuentas_por_pagar_centavos   bigint,
    flujo_neto_estimado_centavos bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
    v_ingresos     bigint;
    v_egresos      bigint;
    v_efectivo     bigint;
    v_tarjeta      bigint;
    v_transferencia bigint;
    v_credito      bigint;
    v_compras      bigint;
    v_cxc          bigint;
    v_cxp          bigint;
begin
    -- Caja: movimientos que afectan efectivo, cortados por updated_at.
    select
        coalesce(sum(case when cm.tipo = 'INGRESO' and coalesce(cm.afecta_efectivo, true) then cm.monto_centavos else 0 end), 0),
        coalesce(sum(case when cm.tipo = 'EGRESO'  and coalesce(cm.afecta_efectivo, true) then cm.monto_centavos else 0 end), 0)
      into v_ingresos, v_egresos
    from public.caja_movimientos cm
    inner join public.cajas_sesiones cs on cs.id = cm.sesion_id
    where (p_sucursal_id is null or cs.sucursal_id = p_sucursal_id)
      and (p_desde is null or cm.updated_at >= p_desde)
      and (p_hasta is null or cm.updated_at <= p_hasta);

    -- Ventas por método de pago (COMPLETADAS) en el rango.
    select
        coalesce(sum(total_centavos) filter (where metodo_pago = 'EFECTIVO'), 0),
        coalesce(sum(total_centavos) filter (where metodo_pago = 'TARJETA'), 0),
        coalesce(sum(total_centavos) filter (where metodo_pago = 'TRANSFERENCIA'), 0),
        coalesce(sum(total_centavos) filter (where metodo_pago = 'CREDITO'), 0)
      into v_efectivo, v_tarjeta, v_transferencia, v_credito
    from public.ventas v
    where v.estado = 'COMPLETADA'
      and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta);

    -- Compras del período (excluye cotizaciones).
    select coalesce(sum(total_centavos), 0)
      into v_compras
    from public.compras c
    where c.estado_pago <> 'COTIZACION'
      and (p_sucursal_id is null or c.sucursal_id = p_sucursal_id)
      and (p_desde is null or c.fecha >= p_desde)
      and (p_hasta is null or c.fecha <= p_hasta);

    -- Cuentas por cobrar: saldo deudor acumulado.
    select coalesce(round(sum(c.saldo_deudor * 100)), 0)::bigint
      into v_cxc
    from public.clientes c
    where c.eliminado = false;

    -- Cuentas por pagar: compras pendientes.
    select coalesce(sum(total_centavos), 0)
      into v_cxp
    from public.compras c
    where c.estado_pago = 'PENDIENTE'
      and (p_sucursal_id is null or c.sucursal_id = p_sucursal_id);

    return query
    select
        v_ingresos,
        v_egresos,
        v_efectivo,
        v_tarjeta,
        v_transferencia,
        v_credito,
        v_compras,
        v_cxc,
        v_cxp,
        (v_efectivo + v_tarjeta + v_transferencia + v_ingresos - v_egresos - v_compras) as flujo_neto_estimado_centavos;
end $$;

-- 4.11 Cuentas por cobrar — aging (réplica get_ar_aging del escritorio).
--      Buckets: Vigente (sin vencer), 1-30, 31-60 y 60+ días de atraso.
create or replace function public.cuentas_por_cobrar_aging(
    p_sucursal_id text default null
)
returns table (
    cliente_id          text,
    cliente_nombre      text,
    total_deuda_centavos    bigint,
    deuda_vigente_centavos  bigint,
    deuda_1_30_centavos     bigint,
    deuda_31_60_centavos    bigint,
    deuda_60_mas_centavos   bigint,
    limite_credito_centavos bigint,
    uso_credito_porcentaje  numeric
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        c.id,
        c.nombre,
        coalesce(sum(v.total_centavos), 0) as total_deuda,
        coalesce(sum(case
            when v.fecha_vencimiento is null or v.fecha_vencimiento >= now()
            then v.total_centavos else 0 end), 0) as deuda_vigente,
        coalesce(sum(case
            when v.fecha_vencimiento < now() and v.fecha_vencimiento >= now() - interval '30 days'
            then v.total_centavos else 0 end), 0) as deuda_1_30,
        coalesce(sum(case
            when v.fecha_vencimiento < now() - interval '30 days' and v.fecha_vencimiento >= now() - interval '60 days'
            then v.total_centavos else 0 end), 0) as deuda_31_60,
        coalesce(sum(case
            when v.fecha_vencimiento < now() - interval '60 days'
            then v.total_centavos else 0 end), 0) as deuda_60_mas,
        coalesce(round(c.limite_credito * 100), 0)::bigint as limite_credito,
        case
            when coalesce(c.limite_credito, 0) > 0
            then round(
                (coalesce(sum(v.total_centavos), 0) / (c.limite_credito * 100)) * 100, 1
            )
            else 100
        end as uso_credito
    from public.clientes c
    inner join public.ventas v on v.cliente_id = c.id
    where v.estado = 'COMPLETADA'
      and v.metodo_pago = 'CREDITO'
      and c.eliminado = false
      and c.saldo_deudor > 0
      and (p_sucursal_id is null or v.sucursal_id = p_sucursal_id)
    group by c.id, c.nombre, c.limite_credito
    order by total_deuda desc;
$$;

-- 4.12 Cuentas por pagar — aging (réplica get_cxp_aging del escritorio).
create or replace function public.cuentas_por_pagar_aging(
    p_sucursal_id text default null
)
returns table (
    proveedor_id         text,
    proveedor_nombre     text,
    total_deuda_centavos     bigint,
    deuda_vigente_centavos   bigint,
    deuda_1_30_centavos      bigint,
    deuda_31_60_centavos     bigint,
    deuda_60_mas_centavos    bigint,
    compras_pendientes       bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        pr.id,
        pr.nombre,
        coalesce(sum(c.total_centavos), 0) as total_deuda,
        coalesce(sum(case
            when c.fecha_vencimiento is null or c.fecha_vencimiento >= now()
            then c.total_centavos else 0 end), 0) as deuda_vigente,
        coalesce(sum(case
            when c.fecha_vencimiento < now() and c.fecha_vencimiento >= now() - interval '30 days'
            then c.total_centavos else 0 end), 0) as deuda_1_30,
        coalesce(sum(case
            when c.fecha_vencimiento < now() - interval '30 days' and c.fecha_vencimiento >= now() - interval '60 days'
            then c.total_centavos else 0 end), 0) as deuda_31_60,
        coalesce(sum(case
            when c.fecha_vencimiento < now() - interval '60 days'
            then c.total_centavos else 0 end), 0) as deuda_60_mas,
        count(distinct c.id) as compras_pendientes
    from public.proveedores pr
    inner join public.compras c on c.proveedor_id = pr.id
    where c.estado_pago = 'PENDIENTE'
      and pr.eliminado = false
      and (p_sucursal_id is null or c.sucursal_id = p_sucursal_id)
    group by pr.id, pr.nombre
    order by total_deuda desc;
$$;

-- 4.13 Cortes de caja / turnos (réplica get_turnos_page del escritorio).
create or replace function public.turnos_resumen(
    p_desde       timestamptz default null,
    p_hasta       timestamptz default null,
    p_sucursal_id text        default null,
    p_limite      integer     default 100
)
returns table (
    sesion_id                  text,
    usuario_nombre             text,
    sucursal_id                text,
    sucursal_nombre            text,
    fecha_apertura             timestamptz,
    fecha_cierre               timestamptz,
    monto_inicial_centavos     bigint,
    ventas_efectivo_centavos   bigint,
    ingresos_centavos          bigint,
    egresos_centavos           bigint,
    monto_esperado_centavos    bigint,
    monto_final_real_centavos  bigint,
    diferencia_centavos        bigint,
    estado                     text
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        cs.id,
        coalesce(uv.nombre, ''),
        cs.sucursal_id,
        coalesce(s.nombre, ''),
        cs.fecha_apertura,
        cs.fecha_cierre,
        cs.monto_inicial_centavos,
        coalesce((
            select sum(v.total_centavos)
            from public.ventas v
            where v.usuario_id = cs.usuario_id
              and v.sucursal_id = cs.sucursal_id
              and v.metodo_pago = 'EFECTIVO'
              and v.estado = 'COMPLETADA'
              and v.fecha >= cs.fecha_apertura
              and (cs.fecha_cierre is null or v.fecha <= cs.fecha_cierre)
        ), 0) as ventas_efectivo,
        coalesce((
            select sum(cm.monto_centavos)
            from public.caja_movimientos cm
            where cm.sesion_id = cs.id
              and cm.tipo = 'INGRESO'
              and coalesce(cm.afecta_efectivo, true)
        ), 0) as ingresos,
        coalesce((
            select sum(cm.monto_centavos)
            from public.caja_movimientos cm
            where cm.sesion_id = cs.id
              and cm.tipo = 'EGRESO'
              and coalesce(cm.afecta_efectivo, true)
        ), 0) as egresos,
        cs.monto_esperado_centavos,
        cs.monto_final_real_centavos,
        case
            when cs.monto_final_real_centavos is not null
            then cs.monto_final_real_centavos - cs.monto_esperado_centavos
            else null
        end as diferencia,
        cs.estado
    from public.cajas_sesiones cs
    inner join public.dash_v_usuarios uv on uv.id = cs.usuario_id
    inner join public.sucursales s on s.id = cs.sucursal_id
    where (p_sucursal_id is null or cs.sucursal_id = p_sucursal_id)
      and (p_desde is null or cs.fecha_apertura >= p_desde)
      and (p_hasta is null or cs.fecha_apertura <= p_hasta)
    order by cs.fecha_apertura desc
    limit greatest(p_limite, 0);
$$;

-- ----------------------------------------------------------------------------
-- 5) Conceder a `authenticated` la ejecución de las funciones read-only.
--    (Después del revoke global del paso 1.)
-- ----------------------------------------------------------------------------
grant execute on function public.indicador_ventas(timestamptz, timestamptz, text, text) to authenticated;
grant execute on function public.ventas_por_metodo(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.productos_mas_vendidos(timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.inventario_resumen(text) to authenticated;
grant execute on function public.inventario_bajo_stock(text, integer) to authenticated;
grant execute on function public.ventas_por_dia(date, date, text) to authenticated;
grant execute on function public.ventas_por_sucursal(date, date) to authenticated;
grant execute on function public.rentabilidad_resumen(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.rentabilidad_productos(timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.financiero_resumen(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.cuentas_por_cobrar_aging(text) to authenticated;
grant execute on function public.cuentas_por_pagar_aging(text) to authenticated;
grant execute on function public.turnos_resumen(timestamptz, timestamptz, text, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 6) Verificación (opcional)
-- ----------------------------------------------------------------------------
-- Políticas por rol en public:
-- select tablename, policyname, permissive, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- Privilegios actuales de `authenticated` sobre una tabla clave (debe decir
-- SELECT; NO debe decir INSERT/UPDATE/DELETE):
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'ventas' and grantee = 'authenticated'
-- order by privilege_type;