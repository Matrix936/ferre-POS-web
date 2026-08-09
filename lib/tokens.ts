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

/** Página centrada con fondo del bg default (LoginForm.tsx del escritorio). */
export const pageSx: CSSProperties = {
  fontFamily,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: tokens.bgPage,
  padding: "1rem",
};

/**
 * Tarjeta (Paper) del login real: elevation 0, borde divider,
 * borderRadius 16 (MUI ratio 2), centrado en columna, p 32px/40px.
 */
export const cardSx: CSSProperties = {
  width: "100%",
  maxWidth: 444,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: tokens.bgPaper,
  borderRadius: 16,
  border: `1px solid ${tokens.divider}`,
  padding: "clamp(2rem, 4vw, 2.5rem)",
};

export const logoWrapSx: CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

export const logoSx: CSSProperties = {
  width: "auto",
  maxWidth: "100%",
  maxHeight: 128,
  height: "auto",
  objectFit: "contain",
  marginBottom: "0.75rem",
};

/** Tagline — "Gestión de Inventario y Ventas" (body1, text.secondary). */
export const taglineSx: CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 400,
  color: tokens.textSecondary,
  textAlign: "center",
  marginBottom: "1.5rem",
};

export const formSx: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  width: "100%",
  marginTop: "0.5rem",
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

/** Botón primario — MuiButton: radius 8, disableElevation, button 0.875rem/500, py:1 px:3. */
export const buttonSx: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  padding: "0.5rem 1.5rem",
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

/** Fila del botón de submit — alineado a la derecha (LoginForm escritorio). */
export const buttonRowSx: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "0.5rem",
};

/**
 * Snackbar de error — replica FeedbackSnackbar (abajo-centro, blur,
 * borde izquierdo de 4px de severidad, sombra flotante).
 */
export const snackbarSx: CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  bottom: 24,
  zIndex: 1500,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  maxWidth: "calc(100vw - 24px)",
  padding: "0.75rem 1rem",
  borderRadius: 12,
  fontSize: "0.875rem",
  color: tokens.errorDark,
  backgroundColor: tokens.bgPaper,
  border: "1px solid rgba(211,47,47,0.24)",
  borderLeft: "4px solid rgba(211,47,47,0.72)",
  boxShadow: "0 16px 36px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};