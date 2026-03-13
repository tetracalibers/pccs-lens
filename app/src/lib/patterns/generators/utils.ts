import { SVG, type Svg } from '@svgdotjs/svg.js'

export function createCanvas(size: number): Svg {
  return SVG().size(size, size).viewbox(0, 0, size, size)
}

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * SVG 文字列内の hex カラーコードを単一パスで置換する。
 * 単一パス処理のため、交差置換（c0 → c1 の色が c1 → c2 でさらに置換される等）は起きない。
 */
export function updateSvgColors(
  svg: string,
  oldColors: [string, string, string],
  newColors: [string, string, string],
): string {
  const map = new Map(oldColors.map((c, i) => [c.toLowerCase(), newColors[i].toLowerCase()]))
  return svg.replace(/#[0-9a-f]{6}/gi, (m) => map.get(m.toLowerCase()) ?? m)
}
