import { createContext } from "react";
import { alpha, createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

// Mismo ColorModeContext del escritorio (ferre-pos/src/theme.ts:5).
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

// Port de ferre-pos/src/theme.ts → createAppTheme(mode).
// Mismo sistema de diseño del escritorio; solo ajustamos la fuente a la
// variable de next/font (Roboto self-hosted).
export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#1a73e8" },
      secondary: { main: "#ea4335" },
      error: { main: "#d32f2f", light: "#ef5350", dark: "#c62828" },
      warning: { main: "#ed6c02", light: "#ff9800", dark: "#e65100" },
      info: { main: "#0288d1", light: "#03a9f4", dark: "#01579b" },
      success: { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20" },
      background: {
        default: mode === "light" ? "#f8f9fa" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
    },
    typography: {
      fontFamily: ['var(--font-roboto)', '"Helvetica Neue"', "Arial", "sans-serif"].join(","),
      h3: { fontWeight: 800 },
      h4: { fontWeight: 900 },
      h5: { fontWeight: 700, fontSize: "1.5rem" },
      h6: { fontWeight: 600, fontSize: "1.25rem" },
      subtitle1: { fontWeight: 700 },
      subtitle2: { fontWeight: 600 },
      caption: { fontWeight: 500 },
      h1: { fontWeight: 900, fontSize: "3.75rem" },
      h2: { fontWeight: 800, fontSize: "2.5rem" },
      body1: { fontWeight: 400, fontSize: "1rem" },
      body2: { fontWeight: 400, fontSize: "0.875rem" },
      button: { fontWeight: 500, fontSize: "0.875rem" },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small" },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16 } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontWeight: 700, fontSize: "1.25rem" } },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.2) transparent",
          },
          "& *": { boxSizing: "border-box" },
        },
      },
    },
  });

export { alpha };