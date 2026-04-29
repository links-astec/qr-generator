# QR Studio 🔲

A fully customizable QR Code Generator built with Next.js, deployable to Vercel in seconds.

## Features

### Content Types
- URL, Plain Text, Email, Phone, SMS, WiFi

### Style Customization
- **9 Color Presets** (Classic, Ocean, Forest, Sunset, Grape, Rose, Midnight, Slate, Coral)
- Custom foreground & background colors
- Transparent background support
- **6 QR dot shapes**: Square, Rounded, Dots, Classy, Classy+, Soft
- **3 Corner Square styles**: Square, Rounded, Circle
- **2 Corner Dot styles**: Square, Dot

### Frame Options (15 frames)
- No Frame, Simple Border, Rounded, Double Border, Dashed, Drop Shadow
- Label Below/Above, Speech Bubble, Polaroid, Ticket, Badge, Stamp, Neon Glow, Circuit
- Frames with text support: customize label, font size, font family, color

### Logo Center
- 9 built-in logos (WiFi, Heart, Star, Location, Link, Email, Phone, Instagram)
- Upload your own image (PNG, JPG, SVG)
- Adjustable logo size (10–40% of QR)

### Export
- Download PNG
- Copy to clipboard
- Live preview

### Other
- Light / Dark mode toggle
- Error correction: L / M / Q / H
- QR size 128–1024px
- Responsive (mobile-friendly)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repo at vercel.com/new.

## Stack

- Next.js 14 (App Router)
- qrcode — matrix generation
- Canvas API — custom rendering (dot shapes, corners, frames, logos)
- Lucide React — icons
- TypeScript
