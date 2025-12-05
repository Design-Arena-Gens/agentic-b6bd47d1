import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3D Math Racer',
  description: 'Endless driving math game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
