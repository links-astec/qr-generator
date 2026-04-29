'use client'

import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'
import QRCode from 'qrcode'
import {
  Download, Copy, Check, RefreshCw, Link2, Mail, Phone,
  Wifi, MessageSquare, QrCode, AlertCircle, Sun, Moon,
  Upload, Image as ImageIcon, Type, Layers, Square, Circle,
  Grid, Palette, LayoutTemplate,
} from 'lucide-react'

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

interface ColorPreset { name: string; fg: string; bg: string; frame: string; label: string }
interface LogoOption { id: string; name: string; emoji: string; svg: string }
interface FrameDef { id: FrameId; name: string; hasText: boolean; preview: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Classic', fg: '#000000', bg: '#ffffff', frame: '#000000', label: '⬛ Classic' },
  { name: 'Ocean', fg: '#0a2463', bg: '#e8f4fd', frame: '#1565c0', label: '🌊 Ocean' },
  { name: 'Forest', fg: '#1b4332', bg: '#d8f3dc', frame: '#2d6a4f', label: '🌲 Forest' },
  { name: 'Sunset', fg: '#7b2d00', bg: '#fff3e0', frame: '#e65100', label: '🌅 Sunset' },
  { name: 'Grape', fg: '#4a0072', bg: '#f3e5f5', frame: '#6a1b9a', label: '🍇 Grape' },
  { name: 'Rose', fg: '#880e4f', bg: '#fce4ec', frame: '#c2185b', label: '🌹 Rose' },
  { name: 'Midnight', fg: '#e8ff3c', bg: '#0a0a14', frame: '#e8ff3c', label: '🌙 Midnight' },
  { name: 'Slate', fg: '#1e293b', bg: '#f1f5f9', frame: '#334155', label: '🪨 Slate' },
  { name: 'Coral', fg: '#7c2d12', bg: '#fff7ed', frame: '#ea580c', label: '🪸 Coral' },
]

const DOT_STYLES: { id: DotStyle; label: string; preview: string }[] = [
  { id: 'square', label: 'Square', preview: '▪' },
  { id: 'rounded', label: 'Rounded', preview: '▫' },
  { id: 'dots', label: 'Dots', preview: '●' },
  { id: 'classy', label: 'Classy', preview: '◆' },
  { id: 'classy-rounded', label: 'Classy+', preview: '◇' },
  { id: 'extra-rounded', label: 'Soft', preview: '○' },
]

const CORNER_SQUARE_STYLES: { id: CornerSquareStyle; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'extra-rounded', label: 'Rounded' },
  { id: 'dot', label: 'Circle' },
]

const CORNER_DOT_STYLES: { id: CornerDotStyle; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'dot', label: 'Dot' },
]

const FRAMES: FrameDef[] = [
  { id: 'none', name: 'No Frame', hasText: false, preview: '◻' },
  { id: 'simple', name: 'Simple Border', hasText: false, preview: '▭' },
  { id: 'rounded', name: 'Rounded', hasText: false, preview: '▢' },
  { id: 'double', name: 'Double Border', hasText: false, preview: '⊡' },
  { id: 'dashed', name: 'Dashed', hasText: false, preview: '┅' },
  { id: 'shadow', name: 'Drop Shadow', hasText: false, preview: '▪' },
  { id: 'banner-bottom', name: 'Label Below', hasText: true, preview: '⬇' },
  { id: 'banner-top', name: 'Label Above', hasText: true, preview: '⬆' },
  { id: 'speech-bubble', name: 'Speech Bubble', hasText: true, preview: '💬' },
  { id: 'polaroid', name: 'Polaroid', hasText: true, preview: '📷' },
  { id: 'ticket', name: 'Ticket', hasText: true, preview: '🎟' },
  { id: 'badge', name: 'Badge', hasText: true, preview: '🏷' },
  { id: 'stamp', name: 'Stamp', hasText: true, preview: '📮' },
  { id: 'neon', name: 'Neon Glow', hasText: true, preview: '✨' },
  { id: 'circuit', name: 'Circuit', hasText: false, preview: '⚡' },
]

const LOGO_OPTIONS: LogoOption[] = [
  { id: 'none', name: 'None', emoji: '✕', svg: '' },
  {
    id: 'wifi', name: 'WiFi', emoji: '📶',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c5.1-5.1 13.4-5.1 18.5 0l2-2C16.6 2.1 7.4 2.1 1 9zm8 8l3 3 3-3c-1.7-1.7-4.3-1.7-6 0zm-4-4l2 2c2.8-2.8 7.2-2.8 10 0l2-2C15.4 9.4 8.6 9.4 5 13z"/></svg>`
  },
  {
    id: 'heart', name: 'Heart', emoji: '❤️',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
  },
  {
    id: 'star', name: 'Star', emoji: '⭐',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },
  {
    id: 'location', name: 'Location', emoji: '📍',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
  },
  {
    id: 'link', name: 'Link', emoji: '🔗',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`
  },
  {
    id: 'mail', name: 'Email', emoji: '✉️',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
  },
  {
    id: 'phone', name: 'Phone', emoji: '📱',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`
  },
  {
    id: 'instagram', name: 'Instagram', emoji: '📸',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildContent(mode: QRMode, text: string, wifi: { ssid: string; password: string; security: WifiSecurity; hidden: boolean }): string {
  switch (mode) {
    case 'url':    return text.startsWith('http') ? text : `https://${text}`
    case 'email':  return `mailto:${text}`
    case 'phone':  return `tel:${text}`
    case 'sms':    return `sms:${text}`
    case 'wifi':   return `WIFI:T:${wifi.security};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden};;`
    default:       return text
  }
}

// ─── Custom QR Canvas renderer ─────────────────────────────────────────────────

interface RenderOptions {
  data: string
  size: number
  margin: number
  errorLevel: ErrorLevel
  dotStyle: DotStyle
  cornerSquareStyle: CornerSquareStyle
  cornerDotStyle: CornerDotStyle
  fgColor: string
  bgColor: string
  transparent: boolean
  logoSrc?: string | null
  logoSize: number
  frame: FrameDef
  frameColor: string
  frameText: string
  frameFontSize: number
  frameFontFamily: string
}

async function getQRMatrix(data: string, errorLevel: ErrorLevel): Promise<boolean[][] | null> {
  try {
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, data, { errorCorrectionLevel: errorLevel, margin: 0, scale: 1 })
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const size = canvas.width
    const matrix: boolean[][] = []
    for (let y = 0; y < size; y++) {
      matrix[y] = []
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        matrix[y][x] = imgData.data[i] < 128
      }
    }
    return matrix
  } catch { return null }
}

function isCornerSquare(x: number, y: number, size: number): boolean {
  return (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)
}
function isCornerDot(x: number, y: number, size: number): boolean {
  return (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
    (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4) ||
    (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3)
}

function drawDot(ctx: CanvasRenderingContext2D, px: number, py: number, cellSize: number, style: DotStyle, color: string) {
  ctx.fillStyle = color
  const s = cellSize * 0.85
  const offset = (cellSize - s) / 2
  const cx = px + cellSize / 2
  const cy = py + cellSize / 2
  const r = s / 2

  switch (style) {
    case 'dots':
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2); ctx.fill(); break
    case 'rounded':
      roundRect(ctx, px + offset, py + offset, s, s, s * 0.35); ctx.fill(); break
    case 'extra-rounded':
      roundRect(ctx, px + offset, py + offset, s, s, s * 0.5); ctx.fill(); break
    case 'classy':
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4)
      ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); ctx.restore(); break
    case 'classy-rounded':
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4)
      roundRect(ctx, -r * 0.75, -r * 0.75, r * 1.5, r * 1.5, r * 0.4); ctx.fill(); ctx.restore(); break
    default:
      ctx.fillRect(px + offset, py + offset, s, s)
  }
}

function drawCornerSquare(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, style: CornerSquareStyle, color: string) {
  ctx.fillStyle = color
  const size = cellSize * 7
  const px = x * cellSize, py = y * cellSize
  switch (style) {
    case 'dot':
      ctx.beginPath()
      ctx.arc(px + size / 2, py + size / 2, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'transparent'
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(px + size / 2, py + size / 2, size / 2 - cellSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      break
    case 'extra-rounded':
      roundRect(ctx, px, py, size, size, size * 0.3); ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,0)'
      break
    default:
      ctx.fillRect(px, py, size, size)
  }
}

function drawCornerDot(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, style: CornerDotStyle, color: string) {
  ctx.fillStyle = color
  const size = cellSize * 3
  const px = x * cellSize, py = y * cellSize
  if (style === 'dot') {
    ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, size / 2, 0, Math.PI * 2); ctx.fill()
  } else {
    ctx.fillRect(px, py, size, size)
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function renderQRToCanvas(canvas: HTMLCanvasElement, opts: RenderOptions) {
  const matrix = await getQRMatrix(opts.data, opts.errorLevel)
  if (!matrix) throw new Error('Failed to generate QR matrix')
  const qrSize = matrix.length

  const FRAME_PADDING = opts.frame.id === 'none' ? 0 : 24
  const LABEL_HEIGHT = (opts.frame.hasText && opts.frame.id !== 'none') ? 48 : 0
  const TOP_LABEL = (opts.frame.id === 'banner-top' || opts.frame.id === 'polaroid') ? LABEL_HEIGHT : 0
  const BOTTOM_LABEL = (opts.frame.hasText && opts.frame.id !== 'banner-top' && opts.frame.id !== 'polaroid') ? LABEL_HEIGHT : 0

  const cellSize = Math.floor((opts.size - opts.margin * 2) / qrSize)
  const qrPx = cellSize * qrSize
  const totalW = qrPx + (opts.margin * 2) + (FRAME_PADDING * 2)
  const totalH = qrPx + (opts.margin * 2) + (FRAME_PADDING * 2) + TOP_LABEL + BOTTOM_LABEL

  canvas.width = totalW
  canvas.height = totalH

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, totalW, totalH)

  // ── Draw frame background ──
  drawFrame(ctx, opts, totalW, totalH, FRAME_PADDING, TOP_LABEL, BOTTOM_LABEL)

  // ── Draw QR ──
  const qrOffsetX = FRAME_PADDING + opts.margin
  const qrOffsetY = FRAME_PADDING + opts.margin + TOP_LABEL

  if (!opts.transparent) {
    ctx.fillStyle = opts.bgColor
    ctx.fillRect(qrOffsetX, qrOffsetY, qrPx, qrPx)
  }

  for (let y = 0; y < qrSize; y++) {
    for (let x = 0; x < qrSize; x++) {
      if (!matrix[y][x]) continue
      const px = qrOffsetX + x * cellSize
      const py = qrOffsetY + y * cellSize

      if (isCornerSquare(x, y, qrSize)) continue
      if (isCornerDot(x, y, qrSize)) continue
      drawDot(ctx, px, py, cellSize, opts.dotStyle, opts.fgColor)
    }
  }

  // Corner squares (3 outer rings)
  const csPositions = [[0, 0], [qrSize - 7, 0], [0, qrSize - 7]]
  for (const [cx, cy] of csPositions) {
    const offX = qrOffsetX + cx * cellSize
    const offY = qrOffsetY + cy * cellSize
    // Outer
    const outerCtx = document.createElement('canvas')
    outerCtx.width = canvas.width; outerCtx.height = canvas.height
    const octx = outerCtx.getContext('2d')!
    drawCornerSquare(octx, offX / cellSize, offY / cellSize, cellSize, opts.cornerSquareStyle, opts.fgColor)
    // Clear inner
    ctx.drawImage(outerCtx, 0, 0)
    ctx.fillStyle = opts.transparent ? 'rgba(0,0,0,0)' : opts.bgColor
    const innerSize = cellSize * 5
    const innerOff = cellSize
    if (opts.cornerSquareStyle === 'dot') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(offX + cellSize * 3.5, offY + cellSize * 3.5, cellSize * 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = opts.transparent ? 'rgba(0,0,0,0)' : opts.bgColor
      ctx.beginPath()
      ctx.arc(offX + cellSize * 3.5, offY + cellSize * 3.5, cellSize * 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (opts.cornerSquareStyle === 'extra-rounded') {
      roundRect(ctx, offX + innerOff, offY + innerOff, innerSize, innerSize, innerSize * 0.25)
      ctx.fill()
    } else {
      ctx.fillRect(offX + innerOff, offY + innerOff, innerSize, innerSize)
    }
  }

  // Corner dots (inner 3x3)
  const cdPositions: [number, number][] = [[2, 2], [qrSize - 5, 2], [2, qrSize - 5]]
  for (const [cx, cy] of cdPositions) {
    drawCornerDot(ctx, qrOffsetX + cx * cellSize, qrOffsetY + cy * cellSize, cellSize, opts.cornerDotStyle, opts.fgColor)
  }

  // ── Logo ──
  if (opts.logoSrc) {
    const logoArea = qrPx * (opts.logoSize / 100)
    const logoX = qrOffsetX + (qrPx - logoArea) / 2
    const logoY = qrOffsetY + (qrPx - logoArea) / 2
    const padding = logoArea * 0.15
    ctx.fillStyle = opts.bgColor || '#ffffff'
    roundRect(ctx, logoX - padding, logoY - padding, logoArea + padding * 2, logoArea + padding * 2, (logoArea + padding * 2) * 0.15)
    ctx.fill()
    await new Promise<void>(resolve => {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, logoX, logoY, logoArea, logoArea)
        resolve()
      }
      img.onerror = resolve
      img.src = opts.logoSrc!
    })
  }

  // ── Frame text ──
  if (opts.frame.hasText && opts.frame.id !== 'none' && opts.frameText) {
    ctx.fillStyle = opts.frameColor
    ctx.font = `bold ${opts.frameFontSize}px ${opts.frameFontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (opts.frame.id === 'banner-top' || opts.frame.id === 'polaroid') {
      ctx.fillText(opts.frameText, totalW / 2, TOP_LABEL / 2 + FRAME_PADDING / 2)
    } else {
      ctx.fillText(opts.frameText, totalW / 2, totalH - BOTTOM_LABEL / 2 - FRAME_PADDING / 2)
    }
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, opts: RenderOptions, w: number, h: number, pad: number, topLabel: number, bottomLabel: number) {
  const fc = opts.frameColor
  if (opts.frame.id === 'none') {
    if (!opts.transparent) { ctx.fillStyle = opts.bgColor; ctx.fillRect(0, 0, w, h) }
    return
  }

  ctx.fillStyle = opts.bgColor
  roundRect(ctx, 0, 0, w, h, 16); ctx.fill()

  switch (opts.frame.id) {
    case 'simple':
      ctx.strokeStyle = fc; ctx.lineWidth = 4
      roundRect(ctx, 2, 2, w - 4, h - 4, 8); ctx.stroke(); break

    case 'rounded':
      ctx.strokeStyle = fc; ctx.lineWidth = 5
      roundRect(ctx, 2, 2, w - 4, h - 4, 24); ctx.stroke(); break

    case 'double':
      ctx.strokeStyle = fc; ctx.lineWidth = 3
      roundRect(ctx, 2, 2, w - 4, h - 4, 10); ctx.stroke()
      roundRect(ctx, 8, 8, w - 16, h - 16, 6); ctx.stroke(); break

    case 'dashed':
      ctx.strokeStyle = fc; ctx.lineWidth = 3; ctx.setLineDash([8, 6])
      roundRect(ctx, 2, 2, w - 4, h - 4, 12); ctx.stroke()
      ctx.setLineDash([]); break

    case 'shadow':
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      roundRect(ctx, 6, 6, w - 4, h - 4, 12); ctx.fill()
      ctx.fillStyle = opts.bgColor
      roundRect(ctx, 0, 0, w - 4, h - 4, 12); ctx.fill()
      ctx.strokeStyle = fc; ctx.lineWidth = 2
      roundRect(ctx, 0, 0, w - 4, h - 4, 12); ctx.stroke(); break

    case 'banner-bottom':
    case 'banner-top':
      ctx.strokeStyle = fc; ctx.lineWidth = 4
      roundRect(ctx, 2, 2, w - 4, h - 4, 16); ctx.stroke()
      ctx.fillStyle = fc
      if (opts.frame.id === 'banner-top') {
        roundRect(ctx, 0, 0, w, topLabel + pad, 16)
      } else {
        roundRect(ctx, 0, h - bottomLabel - pad, w, bottomLabel + pad, 16)
      }
      ctx.fill(); break

    case 'speech-bubble':
      ctx.strokeStyle = fc; ctx.lineWidth = 4
      roundRect(ctx, 2, 2, w - 4, h - bottomLabel - pad - 2, 20); ctx.stroke()
      ctx.fillStyle = fc
      const bx = w / 2
      const by = h - bottomLabel - pad
      ctx.beginPath(); ctx.moveTo(bx - 12, by); ctx.lineTo(bx + 12, by); ctx.lineTo(bx, by + 16); ctx.closePath(); ctx.fill()
      break

    case 'polaroid':
      ctx.strokeStyle = fc; ctx.lineWidth = 3
      roundRect(ctx, 2, 2, w - 4, h - 4, 4); ctx.stroke()
      ctx.fillStyle = fc; ctx.fillRect(0, 0, w, topLabel + pad); break

    case 'ticket':
      ctx.strokeStyle = fc; ctx.lineWidth = 3; ctx.setLineDash([])
      ctx.beginPath(); ctx.rect(2, 2, w - 4, h - bottomLabel - pad - 2); ctx.stroke()
      ctx.setLineDash([6, 4]); ctx.beginPath()
      ctx.moveTo(0, h - bottomLabel - pad); ctx.lineTo(w, h - bottomLabel - pad)
      ctx.stroke(); ctx.setLineDash([]); break

    case 'badge':
      ctx.strokeStyle = fc; ctx.lineWidth = 5
      ctx.beginPath()
      const bw = w, bh = h
      ctx.moveTo(bw * 0.5, 4)
      ctx.lineTo(bw - 4, bh * 0.25)
      ctx.lineTo(bw - 4, bh - bottomLabel - pad - 2)
      ctx.lineTo(bw * 0.5, bh - bottomLabel - pad + 8)
      ctx.lineTo(4, bh - bottomLabel - pad - 2)
      ctx.lineTo(4, bh * 0.25)
      ctx.closePath(); ctx.stroke()
      ctx.fillStyle = fc; ctx.fillRect(0, h - bottomLabel - pad, w, bottomLabel + pad); break

    case 'stamp':
      ctx.strokeStyle = fc; ctx.lineWidth = 3; ctx.setLineDash([4, 3])
      roundRect(ctx, 4, 4, w - 8, h - 8, 4); ctx.stroke(); ctx.setLineDash([])
      ctx.lineWidth = 6; roundRect(ctx, 10, 10, w - 20, h - 20, 2); ctx.stroke(); break

    case 'neon':
      const glowColor = fc
      ctx.shadowColor = glowColor; ctx.shadowBlur = 20
      ctx.strokeStyle = glowColor; ctx.lineWidth = 3
      roundRect(ctx, 4, 4, w - 8, h - 8, 20); ctx.stroke()
      ctx.shadowBlur = 40; roundRect(ctx, 4, 4, w - 8, h - 8, 20); ctx.stroke()
      ctx.shadowBlur = 0; break

    case 'circuit':
      ctx.strokeStyle = fc; ctx.lineWidth = 2
      ctx.strokeRect(4, 4, w - 8, h - 8)
      // Draw circuit corner decorations
      const corners = [[4, 4], [w - 4, 4], [4, h - 4], [w - 4, h - 4]]
      for (const [cx, cy] of corners) {
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
      }
      // Circuit lines
      ctx.strokeStyle = fc + '66'; ctx.lineWidth = 1
      for (let i = 20; i < w - 20; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 4); ctx.lineTo(i, 12); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(i, h - 4); ctx.lineTo(i, h - 12); ctx.stroke()
      }
      break
  }
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

const s = (base: Record<string, unknown>) => base as React.CSSProperties

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>{children}</span>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Label>{label}</Label>{children}</div>
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, ...style }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
}

function StyledInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.15s' }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{value.toUpperCase()}</span>
        <div style={{ border: '2px solid var(--border)', borderRadius: 8, overflow: 'hidden', width: 34, height: 34 }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 38, height: 38, marginLeft: -2, marginTop: -2 }} />
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, onChange, unit = '', step = 1 }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string; step?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: value ? '#000' : 'var(--text-dim)', transition: 'left 0.2s, background 0.2s' }} />
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

// Tab button
function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 12px', border: 'none', background: active ? 'var(--accent-dim)' : 'transparent', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, color: active ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: 'inherit', flex: 1, transition: 'all 0.15s', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {icon}
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QRGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Theme
  const [theme, setTheme] = useState<ThemeMode>('dark')
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  // Active tab
  const [tab, setTab] = useState<ActiveTab>('content')

  // Content
  const [mode, setMode] = useState<QRMode>('url')
  const [text, setText] = useState('https://example.com')
  const [wifi, setWifi] = useState({ ssid: '', password: '', security: 'WPA' as WifiSecurity, hidden: false })

  // Style
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(false)
  const [size, setSize] = useState(400)
  const [margin, setMargin] = useState(4)
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M')
  const [dotStyle, setDotStyle] = useState<DotStyle>('square')
  const [cornerSquareStyle, setCornerSquareStyle] = useState<CornerSquareStyle>('square')
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotStyle>('square')

  // Frame
  const [frameId, setFrameId] = useState<FrameId>('none')
  const [frameColor, setFrameColor] = useState('#000000')
  const [frameText, setFrameText] = useState('SCAN ME')
  const [frameFontSize, setFrameFontSize] = useState(18)
  const [frameFontFamily, setFrameFontFamily] = useState('Syne, sans-serif')

  // Logo
  const [logoId, setLogoId] = useState('none')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [logoSize, setLogoSize] = useState(20)

  // UI state
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [rendering, setRendering] = useState(false)

  const frame = FRAMES.find(f => f.id === frameId) || FRAMES[0]
  const content = buildContent(mode, text, wifi)
  const isValid = mode === 'wifi' ? !!wifi.ssid.trim() : !!text.trim()

  // Logo src resolution
  useEffect(() => {
    if (logoId === 'none') { setLogoSrc(null); return }
    if (logoId === 'custom') return // set by file upload
    const logo = LOGO_OPTIONS.find(l => l.id === logoId)
    if (!logo?.svg) { setLogoSrc(null); return }
    const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${logo.svg}</svg>`], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    setLogoSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [logoId])

  // Render
  const render = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!isValid) { const c = canvas.getContext('2d'); if (c) c.clearRect(0, 0, canvas.width, canvas.height); return }
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
    const canvas = canvasRef.current; if (!canvas) return
    const link = document.createElement('a'); link.download = 'qr-code.png'; link.href = canvas.toDataURL(); link.click()
  }

  const copyImage = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.toBlob(async blob => {
      if (!blob) return
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]) }
      catch { await navigator.clipboard.writeText(canvas.toDataURL()) }
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setLogoSrc(ev.target?.result as string); setLogoId('custom') }
    reader.readAsDataURL(file)
  }

  const MODES_LIST = [
    { id: 'url' as QRMode, icon: <Link2 size={13} />, label: 'URL' },
    { id: 'text' as QRMode, icon: <MessageSquare size={13} />, label: 'Text' },
    { id: 'email' as QRMode, icon: <Mail size={13} />, label: 'Email' },
    { id: 'phone' as QRMode, icon: <Phone size={13} />, label: 'Phone' },
    { id: 'sms' as QRMode, icon: <MessageSquare size={13} />, label: 'SMS' },
    { id: 'wifi' as QRMode, icon: <Wifi size={13} />, label: 'WiFi' },
  ]

  const FONT_OPTIONS = [
    { value: 'Syne, sans-serif', label: 'Syne' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Impact, sans-serif', label: 'Impact' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60, transition: 'background 0.2s' }}>
      {/* ── Header ── */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 20, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={18} color={theme === 'dark' ? '#000' : '#fff'} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>QR Studio</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Custom QR Code Generator</div>
          </div>
        </div>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', transition: 'all 0.15s' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* ── Main Grid ── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 28 }} className="qr-layout">

        {/* ── Left: Tabs + Panels ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', borderBottom: 'none', overflow: 'hidden' }}>
            <TabBtn active={tab === 'content'} onClick={() => setTab('content')} icon={<QrCode size={16} />} label="Content" />
            <TabBtn active={tab === 'style'} onClick={() => setTab('style')} icon={<Palette size={16} />} label="Style" />
            <TabBtn active={tab === 'frame'} onClick={() => setTab('frame')} icon={<LayoutTemplate size={16} />} label="Frame" />
            <TabBtn active={tab === 'logo'} onClick={() => setTab('logo')} icon={<ImageIcon size={16} />} label="Logo" />
          </div>

          {/* Tab panels */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 0 16px 16px', padding: 20, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 400 }}>

            {/* ── CONTENT TAB ── */}
            {tab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
                <Field label="Content Type">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {MODES_LIST.map(m => (
                      <button key={m.id} onClick={() => setMode(m.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid', borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)', background: mode === m.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: mode === m.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 13, fontWeight: mode === m.id ? 700 : 400, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                {mode !== 'wifi' ? (
                  <Field label="Content">
                    <textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder={mode === 'url' ? 'https://example.com' : mode === 'email' ? 'hello@example.com' : mode === 'phone' ? '+1 555 000 0000' : 'Enter text…'}
                      rows={mode === 'text' ? 5 : 2}
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', resize: 'vertical', transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: 'monospace' }}>
                      → {content.length > 60 ? content.slice(0, 60) + '…' : content}
                    </div>
                  </Field>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Network Name (SSID)"><StyledInput value={wifi.ssid} onChange={v => setWifi(w => ({ ...w, ssid: v }))} placeholder="My WiFi" /></Field>
                    <Field label="Password"><StyledInput type="password" value={wifi.password} onChange={v => setWifi(w => ({ ...w, password: v }))} placeholder="••••••••" /></Field>
                    <Field label="Security"><StyledSelect value={wifi.security} onChange={v => setWifi(w => ({ ...w, security: v as WifiSecurity }))} options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None' }]} /></Field>
                    <Toggle label="Hidden Network" value={wifi.hidden} onChange={v => setWifi(w => ({ ...w, hidden: v }))} />
                  </div>
                )}
                <Divider />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SliderRow label="Size" value={size} min={128} max={1024} onChange={setSize} unit="px" step={8} />
                  <SliderRow label="Margin" value={margin} min={0} max={10} onChange={setMargin} />
                </div>
                <Field label="Error Correction">
                  <ChipPicker options={[{ id: 'L' as ErrorLevel, label: 'L · 7%' }, { id: 'M' as ErrorLevel, label: 'M · 15%' }, { id: 'Q' as ErrorLevel, label: 'Q · 25%' }, { id: 'H' as ErrorLevel, label: 'H · 30%' }]} value={errorLevel} onChange={setErrorLevel} />
                </Field>
              </div>
            )}

            {/* ── STYLE TAB ── */}
            {tab === 'style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
                {/* Color presets */}
                <Field label="Color Presets">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {COLOR_PRESETS.map(p => (
                      <button key={p.name} onClick={() => applyPreset(p)} title={p.name}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <span style={{ display: 'flex', gap: 2 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.fg, border: '1px solid var(--border)', display: 'inline-block' }} />
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.bg, border: '1px solid var(--border)', display: 'inline-block' }} />
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                <ColorRow label="QR Foreground" value={fgColor} onChange={setFgColor} />
                <ColorRow label="QR Background" value={bgColor} onChange={setBgColor} />
                <Toggle label="Transparent Background" value={transparent} onChange={setTransparent} />
                <Divider />
                {/* Dot style */}
                <Field label="QR Dot Shape">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {DOT_STYLES.map(d => (
                      <button key={d.id} onClick={() => setDotStyle(d.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 8px', borderRadius: 10, border: '1px solid', borderColor: dotStyle === d.id ? 'var(--accent)' : 'var(--border)', background: dotStyle === d.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: dotStyle === d.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 22 }}>{d.preview}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                <Field label="Corner Square Style">
                  <ChipPicker options={CORNER_SQUARE_STYLES} value={cornerSquareStyle} onChange={setCornerSquareStyle} />
                </Field>
                <Field label="Corner Dot Style">
                  <ChipPicker options={CORNER_DOT_STYLES} value={cornerDotStyle} onChange={setCornerDotStyle} />
                </Field>
              </div>
            )}

            {/* ── FRAME TAB ── */}
            {tab === 'frame' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
                <Field label="Frame Style">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                    {FRAMES.map(f => (
                      <button key={f.id} onClick={() => setFrameId(f.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 10, border: '1px solid', borderColor: frameId === f.id ? 'var(--accent)' : 'var(--border)', background: frameId === f.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: frameId === f.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 20 }}>{f.preview}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{f.name}</span>
                        {f.hasText && <span style={{ fontSize: 9, opacity: 0.6 }}>+ text</span>}
                      </button>
                    ))}
                  </div>
                </Field>
                <Divider />
                <ColorRow label="Frame Color" value={frameColor} onChange={setFrameColor} />
                {frame.hasText && frameId !== 'none' && (
                  <>
                    <Field label="Frame Text">
                      <StyledInput value={frameText} onChange={setFrameText} placeholder="SCAN ME" />
                    </Field>
                    <SliderRow label="Font Size" value={frameFontSize} min={10} max={36} onChange={setFrameFontSize} unit="px" />
                    <Field label="Font Family">
                      <StyledSelect value={frameFontFamily} onChange={setFrameFontFamily} options={FONT_OPTIONS} />
                    </Field>
                  </>
                )}
              </div>
            )}

            {/* ── LOGO TAB ── */}
            {tab === 'logo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
                <div style={{ background: 'var(--accent-dim2)', border: '1px solid var(--accent-dim)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  💡 Use <strong>H (30%)</strong> error correction for best logo scanning reliability.
                </div>
                <Field label="Choose a Logo">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {LOGO_OPTIONS.map(l => (
                      <button key={l.id} onClick={() => setLogoId(l.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 10, border: '1px solid', borderColor: logoId === l.id ? 'var(--accent)' : 'var(--border)', background: logoId === l.id ? 'var(--accent-dim)' : 'var(--surface-2)', color: logoId === l.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 22 }}>{l.emoji}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{l.name}</span>
                      </button>
                    ))}
                    {/* Upload custom */}
                    <button onClick={() => fileRef.current?.click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 10, border: '1px dashed', borderColor: logoId === 'custom' ? 'var(--accent)' : 'var(--border)', background: logoId === 'custom' ? 'var(--accent-dim)' : 'var(--surface-2)', color: logoId === 'custom' ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      <Upload size={20} />
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Upload</span>
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

        {/* ── Right: Preview + Download ── */}
        <div style={{ position: 'sticky', top: 76, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Canvas container */}
            <div style={{ background: transparent ? 'transparent' : bgColor, backgroundImage: transparent ? 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)' : 'none', backgroundSize: '14px 14px', backgroundPosition: '0 0,0 7px,7px -7px,-7px 0', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260, position: 'relative', border: '1px solid var(--border)' }}>
              {!isValid && (
                <div style={{ textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13, padding: 40 }}>
                  <QrCode size={36} style={{ marginBottom: 10, opacity: 0.15 }} />
                  <div>Enter content to preview</div>
                </div>
              )}
              {rendering && isValid && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <RefreshCw size={22} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
              <canvas ref={canvasRef} style={{ maxWidth: '100%', display: isValid ? 'block' : 'none', borderRadius: 6 }} />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '9px 12px', color: 'var(--danger)', fontSize: 13 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Download buttons */}
            <button onClick={downloadPNG} disabled={!isValid}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, background: 'var(--accent)', color: theme === 'dark' ? '#000' : '#fff', border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', opacity: isValid ? 1 : 0.4, transition: 'opacity 0.15s, transform 0.1s', letterSpacing: '0.04em' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}>
              <Download size={15} /> Download PNG
            </button>

            <button onClick={copyImage} disabled={!isValid}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: copied ? 'var(--accent-dim)' : 'var(--surface-2)', color: copied ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${copied ? 'var(--accent-dim)' : 'var(--border)'}`, cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 13, fontFamily: 'inherit', opacity: isValid ? 1 : 0.4, transition: 'all 0.2s' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy image'}
            </button>

            {/* Meta */}
            {isValid && !error && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  ['Dots', dotStyle], ['Corner', cornerSquareStyle],
                  ['Frame', frame.name], ['Logo', logoId === 'none' ? 'None' : LOGO_OPTIONS.find(l => l.id === logoId)?.name || 'Custom'],
                  ['Error', errorLevel], ['Content', `${content.length}ch`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .qr-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
