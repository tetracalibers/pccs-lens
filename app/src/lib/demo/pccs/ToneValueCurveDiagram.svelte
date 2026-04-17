<script lang="ts">
  import { PCCS_ALL, PCCS_HEX_MAP } from "$lib/data/pccs"
  import { parseMunsell } from "$lib/color/munsell"
  import { isLightColor } from "$lib/color/utils"
  import type { PCCSColor } from "$lib/data/types"

  // 横軸の色相番号（左から 24, 2, 4, ..., 22）
  const HUE_ORDER = [24, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

  // sトーンを除く全トーン（偶数色相を持つもの）
  const TONES = ["p", "lt", "b", "v", "sf", "ltg", "d", "dp", "g", "dk", "dkg"]

  // --- レイアウト定数 ---
  const COL_W = 64
  const X_PAD = 40
  const CIRCLE_R = 22
  const VALUE_MIN = 1
  const VALUE_MAX = 9.5
  const PLOT_H = 600
  const PLOT_TOP_PAD = 24
  const AXIS_GAP = 12
  const LABEL_GAP = 18
  const LABEL_FONT = 13

  const SVG_W = X_PAD * 2 + COL_W * HUE_ORDER.length
  const H_AXIS_Y = PLOT_TOP_PAD + PLOT_H
  const SVG_H = H_AXIS_Y + AXIS_GAP + LABEL_GAP + LABEL_FONT

  function xOf(hue: number): number {
    return X_PAD + COL_W * HUE_ORDER.indexOf(hue) + COL_W / 2
  }

  function yOf(value: number): number {
    const t = (value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)
    return PLOT_TOP_PAD + PLOT_H * (1 - t)
  }

  type SwatchPoint = { x: number; y: number; color: PCCSColor }
  type ToneSeries = { tone: string; points: SwatchPoint[]; curveColor: string }

  const SERIES: ToneSeries[] = TONES.map((tone) => {
    const points: SwatchPoint[] = []
    for (const hue of HUE_ORDER) {
      const c = PCCS_ALL.find((x) => x.toneSymbol === tone && x.hueNumber === hue)
      if (!c || !c.munsell) continue
      const m = parseMunsell(c.munsell)
      if (!m) continue
      points.push({ x: xOf(hue), y: yOf(m.value), color: c })
    }
    return {
      tone,
      points,
      curveColor: PCCS_HEX_MAP.get(`${tone}24`) ?? "#888"
    }
  })

  // Catmull-Rom → 三次ベジェ変換で滑らかな曲線を生成
  function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return ""
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2] ?? p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
    }
    return d
  }
</script>

<div class="scroll-wrapper">
  <svg
    viewBox="0 0 {SVG_W} {SVG_H}"
    width={SVG_W}
    height={SVG_H}
    role="img"
    aria-label="PCCSトーンごとの明度カーブ図"
  >
    <!-- 横軸（色相） -->
    <line
      x1={X_PAD}
      y1={H_AXIS_Y}
      x2={SVG_W - X_PAD}
      y2={H_AXIS_Y}
      stroke="#aaa"
      stroke-width="1.5"
    />

    <!-- 横軸ラベル（色相番号） -->
    {#each HUE_ORDER as hue (hue)}
      <text
        x={xOf(hue)}
        y={H_AXIS_Y + AXIS_GAP + LABEL_GAP}
        text-anchor="middle"
        font-size={LABEL_FONT}
        font-family="var(--font-mono)"
        style="fill: light-dark(#555, #aaa);"
      >
        {hue}
      </text>
    {/each}

    <!-- 各トーンの滑らかな曲線（スウォッチの背面に描画） -->
    {#each SERIES as series (series.tone)}
      <path
        d={smoothPath(series.points)}
        fill="none"
        stroke={series.curveColor}
        stroke-width="1.5"
        stroke-opacity="0.55"
        stroke-linecap="round"
      />
    {/each}

    <!-- 色スウォッチ -->
    {#each SERIES as series (series.tone)}
      {#each series.points as p (p.color.notation)}
        {@const textColor = isLightColor(p.color.hex) ? "#222" : "#fff"}
        {@const strokeColor = `oklch(from ${p.color.hex} calc(l * 0.85) c h)`}
        <g>
          <circle
            cx={p.x}
            cy={p.y}
            r={CIRCLE_R}
            fill={p.color.hex}
            stroke={strokeColor}
            stroke-width="1"
          />
          <text
            x={p.x}
            y={p.y}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-size="11"
            font-weight="bold"
            fill={textColor}
            style="pointer-events: none; user-select: none;"
          >
            {p.color.notation}
          </text>
        </g>
      {/each}
    {/each}
  </svg>
</div>

<style>
  .scroll-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  svg {
    display: block;
  }
</style>
