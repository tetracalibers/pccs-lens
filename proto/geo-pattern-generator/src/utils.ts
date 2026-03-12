// @ts-ignore - svgdom has no TypeScript types
import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow, Svg } from '@svgdotjs/svg.js'
import * as fs from 'fs'
import * as path from 'path'

const svgWindow = createSVGWindow()
registerWindow(svgWindow, svgWindow.document)

export function createCanvas(size: number): Svg {
  return SVG().size(size, size)
}

export function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${now.getUTCFullYear()}` +
    `${pad(now.getUTCMonth() + 1)}` +
    `${pad(now.getUTCDate())}` +
    `-T${pad(now.getUTCHours())}` +
    `${pad(now.getUTCMinutes())}` +
    `${pad(now.getUTCSeconds())}Z`
  )
}

export function writeGeneratedSVG(patternName: string, svgContent: string): string {
  const filename = `${formatTimestamp()}.svg`
  const dir = path.join('.generated', patternName)
  fs.mkdirSync(dir, { recursive: true })
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, svgContent, 'utf-8')
  return filepath
}

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
}

/**
 * 色の明暗を調整する。
 * factor < 1: 暗くする（黒に近づける）
 * factor > 1: 明るくする（白に近づける）
 */
export function shadeColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  if (factor <= 1) {
    return rgbToHex(r * factor, g * factor, b * factor)
  }
  const t = factor - 1
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t)
}
