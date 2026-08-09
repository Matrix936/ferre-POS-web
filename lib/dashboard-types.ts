export type IndicadorVentas = {
  total_vendido_centavos: number;
  transacciones: number;
  ticket_promedio_centavos: number;
  ventas_canceladas: number;
  ventas_credito_centavos: number;
  ventas_contado_centavos: number;
};

export type VentaPorMetodo = {
  metodo_pago: string;
  total_centavos: number;
  transacciones: number;
};

export type ProductoMasVendido = {
  producto_id: string;
  codigo_proveedor: string;
  descripcion: string;
  marca: string;
  unidades_vendidas: number;
};

export type InventarioResumen = {
  productos_en_inventario: number;
  valor_centavos: number;
  stock_total: number;
  stock_bajo: number;
  sin_stock: number;
  sobre_stock: number;
};

export type ProductoBajoStock = {
  producto_id: string;
  codigo_proveedor: string;
  descripcion: string;
  marca: string;
  sucursal_id: string;
  sucursal_nombre: string;
  stock: number;
  stock_minimo: number;
  unidad: string;
  motivo: string;
};

export type VentaPorDia = {
  fecha: string;
  sucursal_id: string;
  sucursal_nombre: string;
  total_centavos: number;
  transacciones: number;
};

export type VentaPorSucursal = {
  sucursal_id: string;
  sucursal_nombre: string;
  total_centavos: number;
  transacciones: number;
};

export type RentabilidadResumen = {
  venta_total_centavos: number;
  costo_total_centavos: number;
  utilidad_centavos: number;
  margen_porcentaje: number;
};

export type ProductoRentabilidad = {
  producto_id: string;
  codigo_proveedor: string;
  descripcion: string;
  marca: string;
  unidades_vendidas: number;
  venta_centavos: number;
  costo_centavos: number;
  utilidad_centavos: number;
  margen_porcentaje: number;
};

export type FinancieroResumen = {
  ingresos_caja_centavos: number;
  egresos_caja_centavos: number;
  ventas_efectivo_centavos: number;
  ventas_tarjeta_centavos: number;
  ventas_transferencia_centavos: number;
  ventas_credito_centavos: number;
  compras_centavos: number;
  cuentas_por_cobrar_centavos: number;
  cuentas_por_pagar_centavos: number;
  flujo_neto_estimado_centavos: number;
};

export type AgingRow = {
  cliente_id: string;
  cliente_nombre: string;
  total_deuda_centavos: number;
  deuda_vigente_centavos: number;
  deuda_1_30_centavos: number;
  deuda_31_60_centavos: number;
  deuda_60_mas_centavos: number;
  limite_credito_centavos: number;
  uso_credito_porcentaje: number;
};

export type CxPAgingRow = {
  proveedor_id: string;
  proveedor_nombre: string;
  total_deuda_centavos: number;
  deuda_vigente_centavos: number;
  deuda_1_30_centavos: number;
  deuda_31_60_centavos: number;
  deuda_60_mas_centavos: number;
  compras_pendientes: number;
};

export type TurnoResumen = {
  sesion_id: string;
  usuario_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial_centavos: number;
  ventas_efectivo_centavos: number;
  ingresos_centavos: number;
  egresos_centavos: number;
  monto_esperado_centavos: number;
  monto_final_real_centavos: number | null;
  diferencia_centavos: number | null;
  estado: string;
};

export type HistorialVentaRow = {
  id: string;
  folio: string;
  fecha: string;
  total_centavos: number;
  metodo_pago: string;
  efectivo_recibido_centavos: number | null;
  cambio_entregado_centavos: number | null;
  estado: string;
  tipo_origen: string;
  fecha_vencimiento: string | null;
  anticipo_total_centavos: number;
  saldo_pendiente_centavos: number;
  sucursal_id: string;
  sucursal_nombre: string;
  usuario_id: string;
  usuario_nombre: string;
  cliente_id: string | null;
  cliente_nombre: string;
  total: number;
};

export type HistorialVentaDetalle = {
  id: string;
  venta_id: string;
  producto_id: string;
  descripcion: string;
  marca: string;
  unidad: string;
  cantidad: number;
  precio_venta_pactado_centavos: number;
  descuento_aplicado_centavos: number;
  costo_unitario_pactado_centavos: number;
  cantidad_devuelta: number;
};

// Convierte el array de una `returns table(...)` a su fila única (o null).
export function fila<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data.length ? data[0] : null;
  return (data ?? null) as T | null;
}