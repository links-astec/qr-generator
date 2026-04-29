'use client'

import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'
import QRCode from 'qrcode'
import {
  Download, Copy, Check, RefreshCw, Link2, Mail, Phone,
  Wifi, MessageSquare, QrCode, AlertCircle, Sun, Moon,
  Upload, Image as ImageIcon, Palette, LayoutTemplate,
} from 'lucide-react'


// ─── Responsive hook ─────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ErrorLevel = 'L' | 'M' | 'Q' | 'H'
type QRMode = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi'
type WifiSecurity = 'WPA' | 'WEP' | 'nopass'
type DotStyle = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'
type CornerSquareStyle = 'square' | 'extra-rounded' | 'dot'
type CornerDotStyle = 'square' | 'dot'
type FrameId = 'none' | 'simple' | 'rounded' | 'banner-bottom' | 'banner-top' | 'speech-bubble' | 'ticket' | 'polaroid' | 'badge' | 'neon' | 'dashed' | 'double' | 'shadow' | 'stamp' | 'circuit'
type ThemeMode = 'dark' | 'light'
type ActiveTab = 'content' | 'style' | 'frame' | 'logo'

interface ColorPreset { name: string; fg: string; bg: string; frame: string }
interface LogoOption { id: string; name: string; emoji: string; svgPath: string }
interface FrameDef { id: FrameId; name: string; hasText: boolean; preview: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Classic',  fg: '#000000', bg: '#ffffff', frame: '#000000' },
  { name: 'Ocean',    fg: '#0a2463', bg: '#e8f4fd', frame: '#1565c0' },
  { name: 'Forest',   fg: '#1b4332', bg: '#d8f3dc', frame: '#2d6a4f' },
  { name: 'Sunset',   fg: '#7b2d00', bg: '#fff3e0', frame: '#e65100' },
  { name: 'Grape',    fg: '#4a0072', bg: '#f3e5f5', frame: '#6a1b9a' },
  { name: 'Rose',     fg: '#880e4f', bg: '#fce4ec', frame: '#c2185b' },
  { name: 'Midnight', fg: '#e8ff3c', bg: '#0a0a14', frame: '#e8ff3c' },
  { name: 'Slate',    fg: '#1e293b', bg: '#f1f5f9', frame: '#334155' },
  { name: 'Coral',    fg: '#7c2d12', bg: '#fff7ed', frame: '#ea580c' },
]

const DOT_STYLES: { id: DotStyle; label: string; preview: string }[] = [
  { id: 'square',        label: 'Square',   preview: '■' },
  { id: 'rounded',       label: 'Rounded',  preview: '▣' },
  { id: 'dots',          label: 'Dots',     preview: '●' },
  { id: 'classy',        label: 'Classy',   preview: '◆' },
  { id: 'classy-rounded',label: 'Classy+',  preview: '◈' },
  { id: 'extra-rounded', label: 'Soft',     preview: '○' },
]

const CORNER_SQUARE_STYLES: { id: CornerSquareStyle; label: string }[] = [
  { id: 'square',        label: 'Square'  },
  { id: 'extra-rounded', label: 'Rounded' },
  { id: 'dot',           label: 'Circle'  },
]

const CORNER_DOT_STYLES: { id: CornerDotStyle; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'dot',    label: 'Dot'    },
]

const FRAMES: FrameDef[] = [
  { id: 'none',          name: 'No Frame',      hasText: false, preview: '◻' },
  { id: 'simple',        name: 'Simple',        hasText: false, preview: '▭' },
  { id: 'rounded',       name: 'Rounded',       hasText: false, preview: '▢' },
  { id: 'double',        name: 'Double',        hasText: false, preview: '⊡' },
  { id: 'dashed',        name: 'Dashed',        hasText: false, preview: '┅' },
  { id: 'shadow',        name: 'Shadow',        hasText: false, preview: '▪' },
  { id: 'circuit',       name: 'Circuit',       hasText: false, preview: '⚡' },
  { id: 'banner-bottom', name: 'Label Below',   hasText: true,  preview: '⬇' },
  { id: 'banner-top',    name: 'Label Above',   hasText: true,  preview: '⬆' },
  { id: 'speech-bubble', name: 'Speech',        hasText: true,  preview: '💬' },
  { id: 'polaroid',      name: 'Polaroid',      hasText: true,  preview: '📷' },
  { id: 'ticket',        name: 'Ticket',        hasText: true,  preview: '🎟' },
  { id: 'badge',         name: 'Badge',         hasText: true,  preview: '🏷' },
  { id: 'stamp',         name: 'Stamp',         hasText: true,  preview: '📮' },
  { id: 'neon',          name: 'Neon Glow',     hasText: true,  preview: '✨' },
]

const LOGO_OPTIONS: LogoOption[] = [
  { id: 'none',      name: 'None',      emoji: '✕',  svgPath: '' },
  { id: 'wifi',      name: 'WiFi',      emoji: '📶', svgPath: 'M1 9l2 2c5.1-5.1 13.4-5.1 18.5 0l2-2C16.6 2.1 7.4 2.1 1 9zm8 8l3 3 3-3c-1.7-1.7-4.3-1.7-6 0zm-4-4l2 2c2.8-2.8 7.2-2.8 10 0l2-2C15.4 9.4 8.6 9.4 5 13z' },
  { id: 'heart',     name: 'Heart',     emoji: '❤️', svgPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { id: 'star',      name: 'Star',      emoji: '⭐', svgPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'location',  name: 'Location',  emoji: '📍', svgPath: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { id: 'link',      name: 'Link',      emoji: '🔗', svgPath: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z' },
  { id: 'mail',      name: 'Email',     emoji: '✉️', svgPath: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
  { id: 'phone',     name: 'Phone',     emoji: '📱', svgPath: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' },
  { id: 'instagram', name: 'Insta',     emoji: '📸', svgPath: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
]

// ─── Build content string ─────────────────────────────────────────────────────

function buildContent(mode: QRMode, text: string, wifi: { ssid: string; password: string; security: WifiSecurity; hidden: boolean }): string {
  switch (mode) {
    case 'url':   return text.startsWith('http') ? text : `https://${text}`
    case 'email': return `mailto:${text}`
    case 'phone': return `tel:${text}`
    case 'sms':   return `sms:${text}`
    case 'wifi':  return `WIFI:T:${wifi.security};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden};;`
    default:      return text
  }
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const clampedR = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + clampedR, y)
  ctx.lineTo(x + w - clampedR, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR)
  ctx.lineTo(x + w, y + h - clampedR)
  ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h)
  ctx.lineTo(x + clampedR, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR)
  ctx.lineTo(x, y + clampedR)
  ctx.quadraticCurveTo(x, y, x + clampedR, y)
  ctx.closePath()
}

function drawDot(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number, style: DotStyle, color: string) {
  ctx.fillStyle = color
  const pad = cs * 0.1
  const x = px + pad, y = py + pad, s = cs - pad * 2
  const cx = px + cs / 2, cy = py + cs / 2, r = s / 2
  switch (style) {
    case 'dots':
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); break
    case 'rounded':
      roundRect(ctx, x, y, s, s, s * 0.3); ctx.fill(); break
    case 'extra-rounded':
      roundRect(ctx, x, y, s, s, r); ctx.fill(); break
    case 'classy':
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4)
      ctx.fillRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44); ctx.restore(); break
    case 'classy-rounded':
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4)
      roundRect(ctx, -r * 0.72, -r * 0.72, r * 1.44, r * 1.44, r * 0.35)
      ctx.fill(); ctx.restore(); break
    default:
      ctx.fillRect(x, y, s, s)
  }
}

// Draw the outer 7×7 corner finder ring, then punch a 5×5 hole to show background
function drawCornerOuter(ctx: CanvasRenderingContext2D, ox: number, oy: number, cs: number, style: CornerSquareStyle, fg: string, bg: string, transparent: boolean) {
  const full = cs * 7
  const inner = cs * 5
  const innerOffset = cs

  ctx.fillStyle = fg
  // Draw outer shape
  switch (style) {
    case 'dot':
      ctx.beginPath(); ctx.arc(ox + full / 2, oy + full / 2, full / 2, 0, Math.PI * 2); ctx.fill(); break
    case 'extra-rounded':
      roundRect(ctx, ox, oy, full, full, full * 0.22); ctx.fill(); break
    default:
      ctx.fillRect(ox, oy, full, full)
  }

  // Punch 5×5 hole using destination-out
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0,0,0,1)'
  switch (style) {
    case 'dot':
      ctx.beginPath(); ctx.arc(ox + full / 2, oy + full / 2, inner / 2, 0, Math.PI * 2); ctx.fill(); break
    case 'extra-rounded':
      roundRect(ctx, ox + innerOffset, oy + innerOffset, inner, inner, inner * 0.18); ctx.fill(); break
    default:
      ctx.fillRect(ox + innerOffset, oy + innerOffset, inner, inner)
  }
  ctx.globalCompositeOperation = 'source-over'

  // Refill hole with background color
  if (!transparent) {
    ctx.fillStyle = bg
    switch (style) {
      case 'dot':
        ctx.beginPath(); ctx.arc(ox + full / 2, oy + full / 2, inner / 2, 0, Math.PI * 2); ctx.fill(); break
      case 'extra-rounded':
        roundRect(ctx, ox + innerOffset, oy + innerOffset, inner, inner, inner * 0.18); ctx.fill(); break
      default:
        ctx.fillRect(ox + innerOffset, oy + innerOffset, inner, inner)
    }
  }
}

// Draw inner 3×3 corner dot
function drawCornerInner(ctx: CanvasRenderingContext2D, ox: number, oy: number, cs: number, style: CornerDotStyle, fg: string) {
  const size = cs * 3
  ctx.fillStyle = fg
  if (style === 'dot') {
    ctx.beginPath(); ctx.arc(ox + size / 2, oy + size / 2, size / 2, 0, Math.PI * 2); ctx.fill()
  } else {
    ctx.fillRect(ox, oy, size, size)
  }
}

// ─── QR Matrix extraction ─────────────────────────────────────────────────────

async function getQRMatrix(data: string, errorLevel: ErrorLevel): Promise<boolean[][] | null> {
  try {
    const tmp = document.createElement('canvas')
    await QRCode.toCanvas(tmp, data, { errorCorrectionLevel: errorLevel, margin: 0, scale: 1 })
    const ctx = tmp.getContext('2d')!
    const d = ctx.getImageData(0, 0, tmp.width, tmp.height)
    const n = tmp.width
    const matrix: boolean[][] = []
    for (let y = 0; y < n; y++) {
      matrix[y] = []
      for (let x = 0; x < n; x++) {
        matrix[y][x] = d.data[(y * n + x) * 4] < 128
      }
    }
    return matrix
  } catch { return null }
}

// ─── Frame drawing ────────────────────────────────────────────────────────────

interface RenderOptions {
  data: string; size: number; margin: number; errorLevel: ErrorLevel
  dotStyle: DotStyle; cornerSquareStyle: CornerSquareStyle; cornerDotStyle: CornerDotStyle
  fgColor: string; bgColor: string; transparent: boolean
  logoSrc: string | null; logoSize: number
  frame: FrameDef; frameColor: string; frameText: string; frameFontSize: number; frameFontFamily: string
}

function drawFrame(ctx: CanvasRenderingContext2D, opts: RenderOptions, w: number, h: number, topLabel: number, bottomLabel: number, pad: number) {
  const fc = opts.frameColor
  if (opts.frame.id === 'none') {
    if (!opts.transparent) { ctx.fillStyle = opts.bgColor; ctx.fillRect(0, 0, w, h) }
    return
  }
  // Base fill
  ctx.fillStyle = opts.bgColor; roundRect(ctx, 0, 0, w, h, 18); ctx.fill()

  switch (opts.frame.id) {
    case 'simple':
      ctx.strokeStyle = fc; ctx.lineWidth = 4; roundRect(ctx, 2, 2, w - 4, h - 4, 10); ctx.stroke(); break
    case 'rounded':
      ctx.strokeStyle = fc; ctx.lineWidth = 5; roundRect(ctx, 3, 3, w - 6, h - 6, 26); ctx.stroke(); break
    case 'double':
      ctx.strokeStyle = fc; ctx.lineWidth = 3
      roundRect(ctx, 2, 2, w - 4, h - 4, 10); ctx.stroke()
      roundRect(ctx, 8, 8, w - 16, h - 16, 6); ctx.stroke(); break
    case 'dashed':
      ctx.strokeStyle = fc; ctx.lineWidth = 3; ctx.setLineDash([10, 7])
      roundRect(ctx, 2, 2, w - 4, h - 4, 12); ctx.stroke(); ctx.setLineDash([]); break
    case 'shadow':
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; roundRect(ctx, 7, 7, w, h, 14); ctx.fill()
      ctx.fillStyle = opts.bgColor; roundRect(ctx, 0, 0, w - 2, h - 2, 14); ctx.fill()
      ctx.strokeStyle = fc; ctx.lineWidth = 2; roundRect(ctx, 1, 1, w - 3, h - 3, 14); ctx.stroke(); break
    case 'circuit':
      ctx.strokeStyle = fc; ctx.lineWidth = 2; ctx.strokeRect(4, 4, w - 8, h - 8)
      const corners2 = [[4,4],[w-4,4],[4,h-4],[w-4,h-4]]
      for (const [cx2,cy2] of corners2) {
        ctx.strokeStyle = fc; ctx.beginPath(); ctx.arc(cx2, cy2, 9, 0, Math.PI*2); ctx.stroke()
        ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(cx2, cy2, 4, 0, Math.PI*2); ctx.fill()
      }
      ctx.strokeStyle = fc + '55'; ctx.lineWidth = 1
      for (let i = 24; i < w - 24; i += 28) {
        ctx.beginPath(); ctx.moveTo(i, 4); ctx.lineTo(i, 13); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(i, h-4); ctx.lineTo(i, h-13); ctx.stroke()
      }; break
    case 'banner-bottom':
    case 'banner-top':
      ctx.strokeStyle = fc; ctx.lineWidth = 4; roundRect(ctx, 2, 2, w-4, h-4, 18); ctx.stroke()
      ctx.fillStyle = fc
      if (opts.frame.id === 'banner-top') { roundRect(ctx, 0, 0, w, topLabel + pad, 18) }
      else { roundRect(ctx, 0, h - bottomLabel - pad, w, bottomLabel + pad, 18) }
      ctx.fill(); break
    case 'polaroid':
      ctx.strokeStyle = fc; ctx.lineWidth = 3; roundRect(ctx, 2, 2, w-4, h-4, 6); ctx.stroke()
      ctx.fillStyle = fc; ctx.fillRect(0, 0, w, topLabel + pad); break
    case 'speech-bubble':
      ctx.strokeStyle = fc; ctx.lineWidth = 4
      roundRect(ctx, 2, 2, w-4, h - bottomLabel - pad - 2, 20); ctx.stroke()
      ctx.fillStyle = fc; ctx.beginPath()
      ctx.moveTo(w/2 - 14, h - bottomLabel - pad)
      ctx.lineTo(w/2 + 14, h - bottomLabel - pad)
      ctx.lineTo(w/2, h - bottomLabel - pad + 18)
      ctx.closePath(); ctx.fill(); break
    case 'ticket':
      ctx.strokeStyle = fc; ctx.lineWidth = 3; ctx.beginPath()
      ctx.rect(2, 2, w-4, h - bottomLabel - pad - 4); ctx.stroke()
      ctx.setLineDash([7, 5]); ctx.beginPath()
      ctx.moveTo(0, h - bottomLabel - pad); ctx.lineTo(w, h - bottomLabel - pad); ctx.stroke()
      ctx.setLineDash([]); break
    case 'badge':
      ctx.strokeStyle = fc; ctx.lineWidth = 5; ctx.beginPath()
      ctx.moveTo(w*0.5, 4); ctx.lineTo(w-4, h*0.22)
      ctx.lineTo(w-4, h - bottomLabel - pad - 2)
      ctx.lineTo(w*0.5, h - bottomLabel - pad + 10)
      ctx.lineTo(4, h - bottomLabel - pad - 2)
      ctx.lineTo(4, h*0.22); ctx.closePath(); ctx.stroke()
      ctx.fillStyle = fc; ctx.fillRect(0, h - bottomLabel - pad, w, bottomLabel + pad); break
    case 'stamp':
      ctx.strokeStyle = fc; ctx.lineWidth = 4; ctx.setLineDash([5, 4])
      roundRect(ctx, 5, 5, w-10, h-10, 6); ctx.stroke(); ctx.setLineDash([])
      ctx.lineWidth = 7; roundRect(ctx, 12, 12, w-24, h-24, 3); ctx.stroke(); break
    case 'neon':
      ctx.shadowColor = fc; ctx.shadowBlur = 22
      ctx.strokeStyle = fc; ctx.lineWidth = 3
      roundRect(ctx, 4, 4, w-8, h-8, 22); ctx.stroke()
      ctx.shadowBlur = 44; roundRect(ctx, 4, 4, w-8, h-8, 22); ctx.stroke()
      ctx.shadowBlur = 0; break
  }
}

// ─── Main render function ─────────────────────────────────────────────────────

async function renderQRToCanvas(canvas: HTMLCanvasElement, opts: RenderOptions) {
  const matrix = await getQRMatrix(opts.data, opts.errorLevel)
  if (!matrix) throw new Error('Failed to generate QR matrix')
  const n = matrix.length  // number of modules (e.g. 25, 29, …)

  const PAD  = opts.frame.id === 'none' ? 0 : 20
  const LH   = (opts.frame.hasText && opts.frame.id !== 'none') ? 46 : 0
  const isTop = opts.frame.id === 'banner-top' || opts.frame.id === 'polaroid'
  const TOP  = isTop ? LH : 0
  const BOT  = (!isTop && LH > 0) ? LH : 0

  // Cell size derived from requested size minus margins
  const cellSize = Math.floor((opts.size - opts.margin * 2) / n)
  const qrPx = cellSize * n
  const totalW = qrPx + opts.margin * 2 + PAD * 2
  const totalH = qrPx + opts.margin * 2 + PAD * 2 + TOP + BOT

  canvas.width  = totalW
  canvas.height = totalH

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, totalW, totalH)

  // 1. Frame background
  drawFrame(ctx, opts, totalW, totalH, TOP, BOT, PAD)

  // 2. QR background (the quiet zone area)
  const qx = PAD + opts.margin        // pixel x of QR top-left
  const qy = PAD + opts.margin + TOP  // pixel y of QR top-left
  if (!opts.transparent) {
    ctx.fillStyle = opts.bgColor
    ctx.fillRect(qx, qy, qrPx, qrPx)
  }

  // Which cells belong to the 3 corner finder patterns?
  // Each finder = 7×7 at corners: (0..6,0..6), (n-7..n-1,0..6), (0..6,n-7..n-1)
  const inFinderOuter = (x: number, y: number) =>
    (x < 7 && y < 7) ||
    (x >= n - 7 && y < 7) ||
    (x < 7 && y >= n - 7)

  // Inner 3×3 dots within each finder (centered at module 3, cols/rows 2-4)
  const inFinderInner = (x: number, y: number) =>
    (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
    (x >= n-5 && x <= n-3 && y >= 2 && y <= 4) ||
    (x >= 2 && x <= 4 && y >= n-5 && y <= n-3)

  // 3. Draw data modules (skip finder areas)
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!matrix[row][col]) continue
      if (inFinderOuter(col, row)) continue
      drawDot(ctx, qx + col * cellSize, qy + row * cellSize, cellSize, opts.dotStyle, opts.fgColor)
    }
  }

  // 4. Draw corner finder outer rings — 3 corners
  const finderPositions: [number, number][] = [
    [0,     0    ],   // top-left
    [n - 7, 0    ],   // top-right
    [0,     n - 7],   // bottom-left
  ]
  for (const [gx, gy] of finderPositions) {
    const ox = qx + gx * cellSize  // pixel origin of this finder
    const oy = qy + gy * cellSize
    drawCornerOuter(ctx, ox, oy, cellSize, opts.cornerSquareStyle, opts.fgColor, opts.bgColor, opts.transparent)
  }

  // 5. Draw corner finder inner dots — centers of each finder's 3×3 block
  // Center of 3×3 is at grid offset +2 from finder origin (cols 2..4)
  const innerPositions: [number, number][] = [
    [2,     2    ],
    [n - 5, 2    ],
    [2,     n - 5],
  ]
  for (const [gx, gy] of innerPositions) {
    const ox = qx + gx * cellSize
    const oy = qy + gy * cellSize
    drawCornerInner(ctx, ox, oy, cellSize, opts.cornerDotStyle, opts.fgColor)
  }

  // 6. Logo overlay
  if (opts.logoSrc) {
    const logoArea = qrPx * (opts.logoSize / 100)
    const lx = qx + (qrPx - logoArea) / 2
    const ly = qy + (qrPx - logoArea) / 2

    await new Promise<void>(resolve => {
      const img = new window.Image()
      img.onload = () => {
        // Probe 16x16 downsample to detect transparent pixels
        const probe = document.createElement('canvas')
        probe.width = 16; probe.height = 16
        const pc = probe.getContext('2d')!
        pc.drawImage(img, 0, 0, 16, 16)
        const pd = pc.getImageData(0, 0, 16, 16).data
        let hasTransparency = false
        for (let pi = 3; pi < pd.length; pi += 4) {
          if (pd[pi] < 200) { hasTransparency = true; break }
        }
        if (hasTransparency) {
          // Transparent image — draw directly, no backing rect needed
          ctx.drawImage(img, lx, ly, logoArea, logoArea)
        } else {
          // Opaque image — draw a clean backing rect matched to QR bg
          const bgPad = logoArea * 0.15
          ctx.fillStyle = opts.bgColor
          roundRect(ctx, lx - bgPad, ly - bgPad, logoArea + bgPad * 2, logoArea + bgPad * 2, (logoArea + bgPad * 2) * 0.2)
          ctx.fill()
          ctx.drawImage(img, lx, ly, logoArea, logoArea)
        }
        resolve()
      }
      img.onerror = () => resolve()
      img.src = opts.logoSrc!
    })
  }

  // 7. Frame label text
  if (opts.frame.hasText && opts.frame.id !== 'none' && opts.frameText) {
    ctx.fillStyle = ['banner-top','banner-bottom','polaroid','badge','neon'].includes(opts.frame.id)
      ? (opts.frame.id === 'banner-top' || opts.frame.id === 'polaroid' ? opts.bgColor : opts.bgColor)
      : opts.frameColor
    // For banner frames, text sits in the colored band (bg contrasts with frame color)
    const isBannerFrame = ['banner-top','banner-bottom','polaroid','badge'].includes(opts.frame.id)
    ctx.fillStyle = isBannerFrame ? opts.bgColor : opts.frameColor
    ctx.font = `bold ${opts.frameFontSize}px ${opts.frameFontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (isTop) {
      ctx.fillText(opts.frameText, totalW / 2, (TOP + PAD) / 2)
    } else {
      ctx.fillText(opts.frameText, totalW / 2, totalH - (BOT + PAD) / 2)
    }
  }
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>{children}</span>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Label>{label}</Label>{children}</div>
}
function Divider() {
  return <div style={{ height: 1, background: 'var(--border)' }} />
}

function StyledInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.15s' }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
  )
}

function StyledSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', cursor: 'pointer', appearance: 'none' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{value.toUpperCase()}</span>
        <div style={{ border: '2px solid var(--border)', borderRadius: 7, overflow: 'hidden', width: 32, height: 32 }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 36, marginLeft: -2, marginTop: -2, cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, onChange, unit = '', step = 1 }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string; step?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Label>{label}</Label>
        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} step={step} onChange={e => onChange(Number(e.target.value))} />
    </div>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{label}</Label>
      <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: value ? '#000' : 'var(--text-dim)', transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

function ChipPicker<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: value === o.id ? 'var(--accent)' : 'var(--border)', background: value === o.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: value === o.id ? 'var(--accent)' : 'var(--text-dim)', fontSize: 12, fontWeight: value === o.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px', border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, background: active ? 'var(--accent-dim)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: 'inherit', flex: 1, transition: 'all 0.15s', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {icon}
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QRGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  const [theme, setTheme] = useState<ThemeMode>('dark')
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  const isMobile = useIsMobile(640)

  const [tab, setTab] = useState<ActiveTab>('content')

  // Content
  const [mode, setMode]   = useState<QRMode>('url')
  const [text, setText]   = useState('https://example.com')
  const [wifi, setWifi]   = useState({ ssid: '', password: '', security: 'WPA' as WifiSecurity, hidden: false })

  // Style
  const [fgColor, setFgColor]                 = useState('#000000')
  const [bgColor, setBgColor]                 = useState('#ffffff')
  const [transparent, setTransparent]         = useState(false)
  const [size, setSize]                       = useState(380)
  const [margin, setMargin]                   = useState(4)
  const [errorLevel, setErrorLevel]           = useState<ErrorLevel>('M')
  const [dotStyle, setDotStyle]               = useState<DotStyle>('square')
  const [cornerSquareStyle, setCSStyle]       = useState<CornerSquareStyle>('square')
  const [cornerDotStyle, setCDStyle]          = useState<CornerDotStyle>('square')

  // Frame
  const [frameId, setFrameId]               = useState<FrameId>('none')
  const [frameColor, setFrameColor]         = useState('#000000')
  const [frameText, setFrameText]           = useState('SCAN ME')
  const [frameFontSize, setFrameFontSize]   = useState(18)
  const [frameFontFamily, setFontFamily]    = useState('Syne, sans-serif')

  // Logo
  const [logoId, setLogoId]   = useState('none')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [logoSize, setLogoSize] = useState(22)

  // UI
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState('')
  const [rendering, setRendering] = useState(false)

  // Background removal modal
  const [bgRemoveModal, setBgRemoveModal] = useState<{ rawSrc: string; fileName: string } | null>(null)
  const [removingBg, setRemovingBg]       = useState(false)

  const frame    = FRAMES.find(f => f.id === frameId)!
  const content  = buildContent(mode, text, wifi)
  const isValid  = mode === 'wifi' ? !!wifi.ssid.trim() : !!text.trim()

  // Resolve logo src from built-in options
  useEffect(() => {
    if (logoId === 'none')   { setLogoSrc(null); return }
    if (logoId === 'custom') return
    const logo = LOGO_OPTIONS.find(l => l.id === logoId)
    if (!logo?.svgPath) { setLogoSrc(null); return }
    const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fgColor}"><path d="${logo.svgPath}"/></svg>`
    const blob = new Blob([svgFull], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    setLogoSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [logoId, fgColor])

  const render = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!isValid) { canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); return }
    setRendering(true); setError('')
    try {
      await renderQRToCanvas(canvas, {
        data: content, size, margin, errorLevel,
        dotStyle, cornerSquareStyle, cornerDotStyle,
        fgColor, bgColor, transparent,
        logoSrc: logoId !== 'none' ? logoSrc : null, logoSize,
        frame, frameColor, frameText, frameFontSize, frameFontFamily,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Render error')
    } finally { setRendering(false) }
  }, [content, size, margin, errorLevel, dotStyle, cornerSquareStyle, cornerDotStyle, fgColor, bgColor, transparent, logoSrc, logoId, logoSize, frame, frameColor, frameText, frameFontSize, frameFontFamily, isValid])

  useEffect(() => { render() }, [render])

  const applyPreset = (p: ColorPreset) => { setFgColor(p.fg); setBgColor(p.bg); setFrameColor(p.frame) }

  const downloadPNG = () => {
    const c = canvasRef.current; if (!c) return
    const a = document.createElement('a'); a.download = 'qr-code.png'; a.href = c.toDataURL(); a.click()
  }

  const copyImage = async () => {
    const c = canvasRef.current; if (!c) return
    c.toBlob(async blob => {
      if (!blob) return
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]) }
      catch { await navigator.clipboard.writeText(c.toDataURL()) }
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    // Reset input so the same file can be re-selected
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      setBgRemoveModal({ rawSrc: src, fileName: file.name })
    }
    reader.readAsDataURL(file)
  }

  // Canvas-based background removal using BFS flood-fill from all 4 edges
  const removeBackground = (src: string): Promise<string> => {
    return new Promise(resolve => {
      const img = new window.Image()
      img.onload = () => {
        const W = img.naturalWidth  || img.width
        const H = img.naturalHeight || img.height
        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = W; tmpCanvas.height = H
        const ctx = tmpCanvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, W, H)
        const imgData = ctx.getImageData(0, 0, W, H)
        const data = imgData.data
        const tolerance = 50

        // Sample target color from the top-left corner
        const tr = data[0], tg = data[1], tb = data[2]

        function colorDist(i: number) {
          const dr = data[i] - tr, dg = data[i+1] - tg, db = data[i+2] - tb
          return Math.sqrt(dr*dr + dg*dg + db*db)
        }

        const visited = new Uint8Array(W * H)

        // BFS queue — seed every pixel on all 4 edges that matches the target
        const queue: number[] = []
        for (let x = 0; x < W; x++) {
          for (const y of [0, H - 1]) {
            const pos = y * W + x
            if (!visited[pos] && colorDist(pos * 4) < tolerance) {
              visited[pos] = 1; queue.push(pos)
            }
          }
        }
        for (let y = 1; y < H - 1; y++) {
          for (const x of [0, W - 1]) {
            const pos = y * W + x
            if (!visited[pos] && colorDist(pos * 4) < tolerance) {
              visited[pos] = 1; queue.push(pos)
            }
          }
        }

        let head = 0
        while (head < queue.length) {
          const pos = queue[head++]
          const pi = pos * 4
          data[pi + 3] = 0  // erase
          const x = pos % W, y = Math.floor(pos / W)
          const neighbors = [
            x > 0     ? pos - 1 : -1,
            x < W - 1 ? pos + 1 : -1,
            y > 0     ? pos - W : -1,
            y < H - 1 ? pos + W : -1,
          ]
          for (const nb of neighbors) {
            if (nb >= 0 && !visited[nb] && colorDist(nb * 4) < tolerance) {
              visited[nb] = 1; queue.push(nb)
            }
          }
        }

        // Second pass: also erase near-white fringe pixels adjacent to transparent ones
        for (let pos = 0; pos < W * H; pos++) {
          if (data[pos * 4 + 3] > 0) {
            // Check if any 4-neighbor is transparent
            const x = pos % W, y = Math.floor(pos / W)
            const hasTransNeighbor =
              (x > 0     && data[(pos-1)*4+3] === 0) ||
              (x < W-1   && data[(pos+1)*4+3] === 0) ||
              (y > 0     && data[(pos-W)*4+3] === 0) ||
              (y < H-1   && data[(pos+W)*4+3] === 0)
            if (hasTransNeighbor && colorDist(pos * 4) < tolerance * 1.4) {
              data[pos * 4 + 3] = 0
            }
          }
        }

        ctx.putImageData(imgData, 0, 0)
        resolve(tmpCanvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(src)
      img.src = src
    })
  }

  const confirmBgRemoval = async (remove: boolean) => {
    if (!bgRemoveModal) return
    setRemovingBg(true)
    const src = remove
      ? await removeBackground(bgRemoveModal.rawSrc)
      : bgRemoveModal.rawSrc
    setLogoSrc(src)
    setLogoId('custom')
    setBgRemoveModal(null)
    setRemovingBg(false)
  }

  const MODES_LIST = [
    { id: 'url'   as QRMode, icon: <Link2 size={13} />,        label: 'URL'   },
    { id: 'text'  as QRMode, icon: <MessageSquare size={13} />, label: 'Text'  },
    { id: 'email' as QRMode, icon: <Mail size={13} />,          label: 'Email' },
    { id: 'phone' as QRMode, icon: <Phone size={13} />,         label: 'Phone' },
    { id: 'sms'   as QRMode, icon: <MessageSquare size={13} />, label: 'SMS'   },
    { id: 'wifi'  as QRMode, icon: <Wifi size={13} />,          label: 'WiFi'  },
  ]

  const FONT_OPTIONS = [
    { value: 'Syne, sans-serif',      label: 'Syne'      },
    { value: 'Georgia, serif',        label: 'Georgia'   },
    { value: 'monospace',             label: 'Monospace' },
    { value: 'Arial, sans-serif',     label: 'Arial'     },
    { value: 'Impact, sans-serif',    label: 'Impact'    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: isMobile ? 80 : 60 }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: isMobile ? '12px 14px' : '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 20, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <QrCode size={17} color={theme === 'dark' ? '#000' : '#fff'} />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>QR Studio</div>
            {!isMobile && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Custom QR Generator</div>}
          </div>
        </div>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0 }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: isMobile ? '14px 12px' : '24px 16px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
        gap: isMobile ? 12 : 20,
        alignItems: 'start',
      }}>

        {/* ── PREVIEW — shown first on mobile ── */}
        {isMobile && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: transparent ? 'repeating-conic-gradient(#aaa 0% 25%, transparent 0% 50%) 0 0 / 14px 14px' : bgColor,
              borderRadius: 10, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 200, position: 'relative', border: '1px solid var(--border)',
            }}>
              {!isValid && (
                <div style={{ textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 12, padding: 24 }}>
                  <QrCode size={28} style={{ marginBottom: 6, opacity: 0.15, display: 'block', margin: '0 auto 6px' }} />
                  Enter content to preview
                </div>
              )}
              {rendering && isValid && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <RefreshCw size={20} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
              <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: 280, display: isValid ? 'block' : 'none' }} />
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '9px 12px', color: 'var(--danger)', fontSize: 13 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={downloadPNG} disabled={!isValid}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 8px', borderRadius: 10, background: 'var(--accent)', color: theme === 'dark' ? '#000' : '#fff', border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', opacity: isValid ? 1 : 0.4 }}>
                <Download size={14} /> Download
              </button>
              <button onClick={copyImage} disabled={!isValid}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 8px', borderRadius: 10, background: copied ? 'var(--accent-dim)' : 'var(--surface-2)', color: copied ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${copied ? 'var(--accent-dim)' : 'var(--border)'}`, cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 13, fontFamily: 'inherit', opacity: isValid ? 1 : 0.4 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* ── LEFT: Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
            {([
              { id: 'content' as ActiveTab, icon: <QrCode size={15} />, label: 'Content' },
              { id: 'style'   as ActiveTab, icon: <Palette size={15} />, label: 'Style' },
              { id: 'frame'   as ActiveTab, icon: <LayoutTemplate size={15} />, label: 'Frame' },
              { id: 'logo'    as ActiveTab, icon: <ImageIcon size={15} />, label: 'Logo' },
            ] as {id: ActiveTab; icon: React.ReactNode; label: string}[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: isMobile ? '12px 4px' : '10px 4px',
                border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                background: tab === t.id ? 'var(--accent-dim)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-dim)',
                cursor: 'pointer', fontSize: 10, fontWeight: tab === t.id ? 700 : 500,
                fontFamily: 'inherit', flex: 1, transition: 'all 0.15s',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                minHeight: 52,
              }}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 0 14px 14px', padding: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>

            {/* ── CONTENT TAB ── */}
            {tab === 'content' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>
                <Field label="Type">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {MODES_LIST.map(m => (
                      <button key={m.id} onClick={() => setMode(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '10px 6px', borderRadius: 8, border: '1px solid',
                          borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)',
                          background: mode === m.id ? 'var(--accent-dim)' : 'var(--surface-2)',
                          color: mode === m.id ? 'var(--accent)' : 'var(--text-dim)',
                          cursor: 'pointer', fontSize: 12, fontWeight: mode === m.id ? 700 : 400,
                          fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 40,
                        }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                {mode !== 'wifi' ? (
                  <Field label="Content">
                    <textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder={mode === 'url' ? 'https://example.com' : mode === 'email' ? 'hello@example.com' : mode === 'phone' ? '+1 555 000 0000' : 'Your text here…'}
                      rows={mode === 'text' ? 4 : 2}
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', resize: 'vertical', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      → {content.length > 60 ? content.slice(0, 60) + '…' : content}
                    </div>
                  </Field>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label="Network (SSID)"><StyledInput value={wifi.ssid} onChange={v => setWifi(w => ({ ...w, ssid: v }))} placeholder="My WiFi Network" /></Field>
                    <Field label="Password"><StyledInput type="password" value={wifi.password} onChange={v => setWifi(w => ({ ...w, password: v }))} placeholder="••••••••" /></Field>
                    <Field label="Security"><StyledSelect value={wifi.security} onChange={v => setWifi(w => ({ ...w, security: v as WifiSecurity }))} options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None' }]} /></Field>
                    <Toggle label="Hidden Network" value={wifi.hidden} onChange={v => setWifi(w => ({ ...w, hidden: v }))} />
                  </div>
                )}
                <Divider />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SliderRow label="Size" value={size} min={128} max={800} onChange={setSize} unit="px" step={8} />
                  <SliderRow label="Margin" value={margin} min={0} max={10} onChange={setMargin} />
                </div>
                <Field label="Error Correction">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {(['L','M','Q','H'] as ErrorLevel[]).map(lv => (
                      <button key={lv} onClick={() => setErrorLevel(lv)}
                        style={{ padding: '9px 4px', borderRadius: 8, border: '1px solid', borderColor: errorLevel === lv ? 'var(--accent)' : 'var(--border)', background: errorLevel === lv ? 'var(--accent-dim)' : 'var(--surface-2)', color: errorLevel === lv ? 'var(--accent)' : 'var(--text-dim)', fontSize: 12, fontWeight: errorLevel === lv ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'center', minHeight: 40 }}>
                        {lv}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── STYLE TAB ── */}
            {tab === 'style' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>
                <Field label="Color Presets">
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: 6 }}>
                    {COLOR_PRESETS.map(p => (
                      <button key={p.name} onClick={() => applyPreset(p)} title={p.name}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 6px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s', minHeight: 40 }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                        <span style={{ display: 'flex', flexShrink: 0 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.fg, border: '1px solid var(--border)', display: 'inline-block' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.bg, border: '1px solid var(--border)', display: 'inline-block', marginLeft: -3 }} />
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                <ColorRow label="QR Foreground" value={fgColor} onChange={setFgColor} />
                <ColorRow label="QR Background" value={bgColor} onChange={setBgColor} />
                <Toggle label="Transparent Background" value={transparent} onChange={setTransparent} />
                <Divider />
                <Field label="QR Dot Shape">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {DOT_STYLES.map(d => (
                      <button key={d.id} onClick={() => setDotStyle(d.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, border: '1px solid', borderColor: dotStyle === d.id ? 'var(--accent)' : 'var(--border)', background: dotStyle === d.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: dotStyle === d.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: isMobile ? 60 : 70 }}>
                        <span style={{ fontSize: isMobile ? 20 : 22, lineHeight: 1 }}>{d.preview}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                <Field label="Corner Square">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {CORNER_SQUARE_STYLES.map(o => (
                      <button key={o.id} onClick={() => setCSStyle(o.id)}
                        style={{ padding: '10px 6px', borderRadius: 8, border: '1px solid', borderColor: cornerSquareStyle === o.id ? 'var(--accent)' : 'var(--border)', background: cornerSquareStyle === o.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: cornerSquareStyle === o.id ? 'var(--accent)' : 'var(--text-dim)', fontSize: 12, fontWeight: cornerSquareStyle === o.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'center', minHeight: 40 }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Corner Dot">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {CORNER_DOT_STYLES.map(o => (
                      <button key={o.id} onClick={() => setCDStyle(o.id)}
                        style={{ padding: '10px 6px', borderRadius: 8, border: '1px solid', borderColor: cornerDotStyle === o.id ? 'var(--accent)' : 'var(--border)', background: cornerDotStyle === o.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: cornerDotStyle === o.id ? 'var(--accent)' : 'var(--text-dim)', fontSize: 12, fontWeight: cornerDotStyle === o.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'center', minHeight: 40 }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── FRAME TAB ── */}
            {tab === 'frame' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>
                <Field label="Frame Style">
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 6 }}>
                    {FRAMES.map(f => (
                      <button key={f.id} onClick={() => setFrameId(f.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px', borderRadius: 10, border: '1px solid', borderColor: frameId === f.id ? 'var(--accent)' : 'var(--border)', background: frameId === f.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: frameId === f.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 60 }}>
                        <span style={{ fontSize: 18 }}>{f.preview}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.2 }}>{f.name}</span>
                        {f.hasText && <span style={{ fontSize: 8, opacity: 0.5 }}>text</span>}
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                <ColorRow label="Frame Color" value={frameColor} onChange={setFrameColor} />
                {frame.hasText && frameId !== 'none' && (
                  <>
                    <Field label="Frame Text"><StyledInput value={frameText} onChange={setFrameText} placeholder="SCAN ME" /></Field>
                    <SliderRow label="Font Size" value={frameFontSize} min={10} max={36} onChange={setFrameFontSize} unit="px" />
                    <Field label="Font"><StyledSelect value={frameFontFamily} onChange={setFontFamily} options={FONT_OPTIONS} /></Field>
                  </>
                )}
              </div>
            )}

            {/* ── LOGO TAB ── */}
            {tab === 'logo' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>
                <div style={{ background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  💡 Use <strong>H (30%)</strong> error correction for best scanning with logos.
                </div>
                <Field label="Choose a Logo">
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)', gap: 6 }}>
                    {LOGO_OPTIONS.map(l => (
                      <button key={l.id} onClick={() => setLogoId(l.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, border: '1px solid', borderColor: logoId === l.id ? 'var(--accent)' : 'var(--border)', background: logoId === l.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: logoId === l.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 60 }}>
                        <span style={{ fontSize: 22 }}>{l.emoji}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{l.name}</span>
                      </button>
                    ))}
                    <button onClick={() => fileRef.current?.click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, border: '1px dashed', borderColor: logoId === 'custom' ? 'var(--accent)' : 'var(--border)', background: logoId === 'custom' ? 'var(--accent-dim)' : 'var(--surface-2)', color: logoId === 'custom' ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 60 }}>
                      <Upload size={20} />
                      <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Upload</span>
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </Field>
                {logoId !== 'none' && (
                  <>
                    <Divider />
                    <SliderRow label="Logo Size" value={logoSize} min={10} max={40} onChange={setLogoSize} unit="%" />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Preview (desktop only) ── */}
        {!isMobile && (
          <div style={{ position: 'sticky', top: 70, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: transparent ? 'repeating-conic-gradient(#aaa 0% 25%, transparent 0% 50%) 0 0 / 14px 14px' : bgColor,
                borderRadius: 10, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 240, position: 'relative', border: '1px solid var(--border)',
              }}>
                {!isValid && (
                  <div style={{ textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13, padding: 32 }}>
                    <QrCode size={32} style={{ marginBottom: 8, opacity: 0.15, display: 'block', margin: '0 auto 8px' }} />
                    Enter content to preview
                  </div>
                )}
                {rendering && isValid && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    <RefreshCw size={20} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
                <canvas ref={canvasRef} style={{ maxWidth: '100%', display: isValid ? 'block' : 'none' }} />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '9px 12px', color: 'var(--danger)', fontSize: 13 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button onClick={downloadPNG} disabled={!isValid}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: 'var(--accent)', color: theme === 'dark' ? '#000' : '#fff', border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', opacity: isValid ? 1 : 0.4, transition: 'opacity 0.15s, transform 0.1s', letterSpacing: '0.04em' }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                <Download size={15} /> Download PNG
              </button>

              <button onClick={copyImage} disabled={!isValid}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: copied ? 'var(--accent-dim)' : 'var(--surface-2)', color: copied ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${copied ? 'var(--accent-dim)' : 'var(--border)'}`, cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 13, fontFamily: 'inherit', opacity: isValid ? 1 : 0.4, transition: 'all 0.2s' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy image'}
              </button>

              {isValid && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    ['Dots', dotStyle],
                    ['Corners', cornerSquareStyle],
                    ['Frame', frame.name],
                    ['Logo', logoId === 'none' ? 'None' : LOGO_OPTIONS.find(l => l.id === logoId)?.name || 'Custom'],
                    ['Error', errorLevel],
                    ['Chars', `${content.length}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '6px 8px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Background Removal Modal ── */}
      {bgRemoveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: isMobile ? 0 : 20,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: isMobile ? '20px 20px 0 0' : 20,
            padding: isMobile ? '24px 18px 32px' : 28,
            maxWidth: 420, width: '100%',
            display: 'flex', flexDirection: 'column', gap: 18,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          }}>
            {/* Drag handle on mobile */}
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '-8px auto 0' }} />}

            <div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Remove background?</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Automatically remove the background from your logo so it blends cleanly into the QR code.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgRemoveModal.rawSrc} alt="original" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Original</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgRemoveModal.rawSrc} alt="preview" style={{ width: '75%', height: '75%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                  <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'var(--accent)', color: '#000', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 3, letterSpacing: '0.05em' }}>BG REMOVED</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No BG</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => confirmBgRemoval(true)} disabled={removingBg}
                style={{ padding: '14px', borderRadius: 10, background: 'var(--accent)', color: theme === 'dark' ? '#000' : '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: removingBg ? 0.6 : 1 }}>
                {removingBg
                  ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Removing…</>
                  : '✨ Yes, remove background'}
              </button>
              <button onClick={() => confirmBgRemoval(false)} disabled={removingBg}
                style={{ padding: '13px', borderRadius: 10, background: 'var(--surface-2)', color: 'var(--text-dim)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', opacity: removingBg ? 0.6 : 1 }}>
                Keep original
              </button>
              <button onClick={() => setBgRemoveModal(null)} disabled={removingBg}
                style={{ padding: '11px', borderRadius: 10, background: 'none', color: 'var(--text-dimmer)', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .fade-in { animation: fadeIn 0.25s ease forwards; }

        /* Tablet */
        @media (min-width: 641px) and (max-width: 960px) {
          .qr-layout { grid-template-columns: 1fr 300px !important; }
        }

        /* Ensure canvas scales on narrow screens */
        canvas { max-width: 100% !important; height: auto !important; }

        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-size: 16px !important; } /* prevent iOS zoom */
      `}</style>
    </div>
  )
}