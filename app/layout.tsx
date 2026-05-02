import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BarberOS — Gestión de Barbería',
  description: 'Sistema de gestión profesional para barberías',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
