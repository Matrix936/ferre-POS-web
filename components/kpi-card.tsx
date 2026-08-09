import { dineroCentavos, cantidad } from "@/lib/format";

export default function KpiCard({
  label,
  value,
  moneda = false,
}: {
  label: string;
  value: number | bigint | null | undefined;
  moneda?: boolean;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "0.9rem 1rem",
      }}
    >
      <p style={{ margin: "0 0 0.3rem", color: "#6b7280", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: ".02em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontWeight: 600, fontSize: "1.15rem", color: "#111827" }}>
        {moneda ? dineroCentavos(value) : cantidad(value)}
      </p>
    </div>
  );
}