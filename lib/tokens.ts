import type { CSSProperties } from "react";

// Tokens del sistema de diseño (src/theme.ts del escritorio + 07-diseno-ui.md).
// Colores como var() para que el modo oscuro automático (prefers-color-scheme
// en app/theme.css) aplique sin JS extra.

export const tokens = {
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  primaryLight: "var(--color-primary-light)",
  error: "var(--color-error)",
  errorDark: "var(--color-error-dark)",
  bgPage: "var(--bg-page)",
  bgPaper: "var(--bg-paper)",
  divider: "var(--divider)",
  borderInput: "var(--border-input)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textDisabled: "var(--text-disabled)",
};

// Jerarquía tipográfica (07-diseno-ui.md §2)
export const fontFamily =
  "var(--font-roboto), 'Helvetica Neue', Arial, sans-serif";

/** Página centrada con fondo del theme (bg default). */
export const pageSx: CSSProperties = {
  fontFamily,
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  backgroundColor: tokens.bgPage,
  padding: "clamp(1rem, 4vw, 2.5rem)",
};

/** Tarjeta (papel) con radius 12px y sombra de MuiCard (theme.ts). */
export const cardSx: CSSProperties = {
  width: "100%",
  maxWidth: 380,
  backgroundColor: tokens.bgPaper,
  borderRadius: 12,
  border: `1px solid ${tokens.divider}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
  padding: "clamp(1.5rem, 4vw, 2rem)",
};

/** Título de tarjeta — h6 (1.25rem, 600). */
export const titleSx: CSSProperties = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: 600,
};

/** Subtítulo — body2 (0.875rem, 400) texto secundario. */
export const subtitleSx: CSSProperties = {
  margin: "0.25rem 0 0",
  fontSize: "0.875rem",
  fontWeight: 400,
  color: tokens.textSecondary,
};

export const formSx: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  width: "100%",
  marginTop: "1.5rem",
};

export const fieldSx: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.375rem",
};

/** Label — caption (500). */
export const labelSx: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 500,
  color: tokens.textPrimary,
};

/**
 * Input — patrón MuiTextField outlined/small: borde 1px, radius 8,
 * focus ring del color primario.
 */
export const inputSx: CSSProperties = {
  padding: "0.625rem 0.75rem",
  fontSize: "0.875rem",
  color: tokens.textPrimary,
  backgroundColor: tokens.bgPaper,
  border: `1px solid ${tokens.borderInput}`,
  borderRadius: 8,
  outline: "none",
  transition: "border-color 200ms ease-in-out, box-shadow 200ms ease-in-out",
};

/** Estilos de focus para aplicar junto a inputSx (via :focus en el input). */
export const inputFocusSx: CSSProperties = {
  borderColor: tokens.primary,
  boxShadow: `0 0 0 3px ${tokens.primaryLight}`,
};

/** Botón primario — MuiButton: radius 8, disableElevation, button 0.875rem/500. */
export const buttonSx: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  minHeight: 42,
  padding: "0.625rem 1.25rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  textTransform: "none",
  color: "#fff",
  backgroundColor: tokens.primary,
  border: "none",
  borderRadius: 8,
  boxShadow: "none",
  cursor: "pointer",
  transition: "background-color 200ms ease-in-out",
};

/** Alerta de error — MuiAlert-standardError (fondo alpha + borde alpha). */
export const errorAlertSx: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.5rem",
  margin: 0,
  padding: "0.625rem 0.75rem",
  borderRadius: 12,
  fontSize: "0.875rem",
  lineHeight: 1.45,
  color: tokens.errorDark,
  backgroundColor: "rgba(211,47,47,0.1)",
  border: "1px solid rgba(211,47,47,0.26)",
};

export const errorIconSx: CSSProperties = {
  flex: "0 0 auto",
  marginTop: "0.15em",
};