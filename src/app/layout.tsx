import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AeroSim - 3D Aerodynamic Simulation',
  description: 'Interactive 3D aerodynamic simulation workspace with real-time flow visualization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#08080c] text-white antialiased">{children}</body>
    </html>
  )
}
