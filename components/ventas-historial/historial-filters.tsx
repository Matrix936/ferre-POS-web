"use client";

import { Box, MenuItem, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export interface HistorialFilterValue {
  sucursal: string;
  usuario: string;
  estado: string;
  folio: string;
}

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "COMPLETADA", label: "Completada" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "ABIERTO", label: "Abierto" },
  { value: "LIQUIDADO", label: "Liquidado" },
];

export default function HistorialFilters({
  value,
  sucursales,
  usuarios,
  showSucursal,
  showUsuario,
}: {
  value: HistorialFilterValue;
  sucursales: { id: string; nombre: string }[];
  usuarios: { id: string; nombre: string }[];
  showSucursal: boolean;
  showUsuario: boolean;
}) {
  const router = useRouter();
  // Estado local para edición fluida del folio; la búsqueda real se dispara
  // cuando el valor debounceado cambia (mismo patrón que el escritorio).
  const [folioLocal, setFolioLocal] = useState(value.folio);
  const debouncedFolio = useDebouncedValue(folioLocal, 300);

  const commit = (next: HistorialFilterValue) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("pagina");
    (["sucursal", "usuario", "estado", "folio"] as const).forEach((key) => {
      if (next[key]) {
        params.set(key, next[key]);
      } else {
        params.delete(key);
      }
    });
    const qs = params.toString();
    router.push(qs ? `/ventas?${qs}` : "/ventas");
  };

  const setField = (field: keyof HistorialFilterValue, v: string) => {
    const next = { ...value, [field]: v };
    if (field === "folio") {
      setFolioLocal(v);
    } else {
      commit(next);
    }
  };

  // Al cambiar el folio debounceado (o al entrar con ?folio= en la URL) se
  // dispara la búsqueda.
  useEffect(() => {
    const nextFolio = debouncedFolio.trim();
    if (nextFolio === value.folio) return;
    const next = { ...value, folio: nextFolio };
    commit(next);
  }, [debouncedFolio]);

  // Sincroniza el input con la URL cuando llega un ?folio= distinto (navegación
  // externa o botón atrás).
  useEffect(() => {
    if (value.folio !== folioLocal) setFolioLocal(value.folio);
  }, [value.folio]);

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {showSucursal && (
        <TextField
          select
          label="Sucursal"
          value={value.sucursal}
          onChange={(e) => setField("sucursal", e.target.value)}
          sx={{ flex: "1 1 180px", minWidth: { xs: "100%", sm: 200, md: 180 } }}
        >
          <MenuItem value="">Todas</MenuItem>
          {sucursales.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
          ))}
        </TextField>
      )}
      {showUsuario && (
        <TextField
          select
          label="Usuario"
          value={value.usuario}
          onChange={(e) => setField("usuario", e.target.value)}
          sx={{ flex: "1 1 180px", minWidth: { xs: "100%", sm: 200, md: 180 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {usuarios.map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.nombre}</MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        select
        label="Estado"
        value={value.estado}
        onChange={(e) => setField("estado", e.target.value)}
        sx={{ flex: "1 1 180px", minWidth: { xs: "100%", sm: 200, md: 180 } }}
      >
        {ESTADOS.map((e) => (
          <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Buscar por folio"
        value={folioLocal}
        onChange={(e) => setField("folio", e.target.value)}
        placeholder="Ej: A1B2C3D4"
        sx={{ flex: "1 1 220px", minWidth: { xs: "100%", sm: 220, md: 200 } }}
      />
    </Box>
  );
}