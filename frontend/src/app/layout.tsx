import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Writer - Script & Content Enhancement',
  description: 'Intelligent writing assistant for narrative consistency and style transformation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
