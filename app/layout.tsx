import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import AppThemeProvider from "@/components/theme-provider";
import "./theme.css";

export const metadata: Metadata = {
  title: "Ferre Dashboard",
  description: "Panel de indicadores de solo lectura de la ferretería",
};

// Self-hosted en build time (next/font) — sin llamadas runtime a fonts.googleapis.com
const roboto = Roboto({
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={roboto.variable}>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}