import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR Studio — Custom QR Code Generator',
  description: 'Generate fully customizable QR codes with live preview. Control colors, size, margin, error correction and download as PNG or SVG.',
  keywords: 'qr code generator, custom qr code, free qr generator',
  openGraph: {
    title: 'QR Studio',
    description: 'Generate beautiful, customizable QR codes instantly.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
