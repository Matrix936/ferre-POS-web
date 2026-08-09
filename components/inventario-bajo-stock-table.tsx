import { cantidad } from "@/lib/format";
import type { ProductoBajoStock } from "@/lib/dashboard-types";

export default function InventarioBajoStockTable({ data }: { data: ProductoBajoStock[] }) {
  if (!data.length) {
    return <p style={{ color: "#059669" }}>Sin productos en situación de bajo stock o agotados.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ padding: "0.5rem" }}>Producto</th>
            <th style={{ padding: "0.5rem" }}>Marca</th>
            <th style={{ padding: "0.5rem" }}>Sucursal</th>
            <th style={{ padding: "0.5rem", textAlign: "right" }}>Stock</th>
            <th style={{ padding: "0.5rem", textAlign: "right" }}>Mínimo</th>
            <th style={{ padding: "0.5rem" }}>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={`${p.producto_id}-${p.sucursal_id}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem" }}>
                {p.descripcion}
                {p.codigo_proveedor ? (
                  <span style={{ color: "#9ca3af", marginLeft: "0.5rem", fontSize: "0.8rem" }}>{p.codigo_proveedor}</span>
                ) : null}
              </td>
              <td style={{ padding: "0.5rem" }}>{p.marca || "—"}</td>
              <td style={{ padding: "0.5rem" }}>{p.sucursal_nombre}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>
                {cantidad(p.stock)} <span style={{ color: "#9ca3af" }}>{p.unidad}</span>
              </td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>{cantidad(p.stock_minimo)}</td>
              <td style={{ padding: "0.5rem" }}>
                <span
                  style={{
                    background: p.stock <= 0 ? "#fef2f2" : "#fef3c7",
                    color: p.stock <= 0 ? "#b91c1c" : "#92400e",
                    padding: "0.15rem 0.5rem",
                    borderRadius: 999,
                    fontSize: "0.75rem",
                  }}
                >
                  {p.stock <= 0 ? "Sin stock" : p.motivo}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}