import type { Metadata } from "next";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import AppThemeProvider from "@/components/theme-provider";
import "./theme.css";

export const metadata: Metadata = {
  title: "Ferre Dashboard",
  description: "Panel de indicadores de solo lectura de la ferretería",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}