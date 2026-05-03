import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarberPro",
  description: "Gestión para barberías modernas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: "#0D0D0D" }}>
        {children}
      </body>
    </html>
  );
}
