"use client";

import { useRouter, usePathname } from "next/navigation";
import { RANGOS, type Rango } from "@/lib/format";

export default function DateRangePicker({ rango }: { rango: Rango }) {
  const router = useRouter();
  const pathname = usePathname();

  function select(next: Rango) {
    router.push(next === "30d" ? pathname : `${pathname}?rango=${next}`);
  }

  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {RANGOS.map((r) => {
        const active = r.value === rango;
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => select(r.value)}
            aria-pressed={active}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 8,
              border: active ? "1px solid #1d4ed8" : "1px solid #d1d5db",
              background: active ? "#1d4ed8" : "#fff",
              color: active ? "#fff" : "#111827",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}