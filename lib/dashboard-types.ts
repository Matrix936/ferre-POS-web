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

// Convierte el array de una `returns table(...)` a su fila única (o null).
export function fila<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data.length ? data[0] : null;
  return (data ?? null) as T | null;
}