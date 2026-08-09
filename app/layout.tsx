import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ferre Dashboard",
  description: "Panel de indicadores de solo lectura de la ferretería",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}