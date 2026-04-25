<script lang="ts">
  // ===== 型定義 =====
  interface GradientStop {
    nm: number
    color: string
  }

  interface GapCircle {
    label: string
    /** 中心角度 (deg, SVG y-down 座標系). 0=東, 90=南, 270=北 */
    angleDeg: number
    fill: string
  }

  // ===== Spectrum parameters =====
  const NM_MIN = 380
  const NM_MAX = 780

  // ===== グラデーションストップ (SpectrumGradient.svelte と同一) =====
  const gradientStops: GradientStop[] = [
    { nm: 380, color: "#4b0082" },
    { nm: 430, color: "#0000ff" },
    { nm: 480, color: "#00bfff" },
    { nm: 510, color: "#00ff80" },
    { nm: 550, color: "#00ff00" },
    { nm: 600, color: "#ffff00" },
    { nm: 640, color: "#ffb000" },
    { nm: 670, color: "#ff7f00" },
    { nm: 700, color: "#ff0000" },
    { nm: 780, color: "#7a0000" }
  ]

  // ===== SVG dimensions =====
  const SIZE = 600
  const CX = SIZE / 2
  const CY = SIZE / 2

  // ===== 色相環の幾何学パラメータ =====
  const BAND_THICKNESS = 70
  const R_OUTER = 270
  const R_INNER = R_OUTER - BAND_THICKNESS
  const R_MEAN = (R_OUTER + R_INNER) / 2
  const CIRCLE_RADIUS = BAND_THICKNESS / 2

  // 開口部 (gap) は左下 (SVG y-down 座標で 135°)
  const GAP_CENTER_DEG = 135
  const GAP_DEG = 50
  const GAP_HALF = GAP_DEG / 2

  // 帯の掃引: 赤端 (780nm) → gap の上側 (西寄り), 青紫端 (380nm) → gap の下側 (南寄り)
  // CW (角度増加) で (360 - GAP_DEG)° 掃引する
  const SWEEP_START = GAP_CENTER_DEG + GAP_HALF
  const SWEEP_END = SWEEP_START + (360 - GAP_DEG)
  const SWEEP_RANGE = SWEEP_END - SWEEP_START

  // ===== 色補間 (グラデーションストップ間を線形補間) =====
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace("#", "")
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    }
  }
  function toHex(v: number): string {
    return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")
  }
  function colorAt(nm: number): string {
    if (nm <= gradientStops[0].nm) return gradientStops[0].color
    const last = gradientStops.length - 1
    if (nm >= gradientStops[last].nm) return gradientStops[last].color
    for (let i = 0; i < last; i++) {
      if (nm <= gradientStops[i + 1].nm) {
        const t = (nm - gradientStops[i].nm) / (gradientStops[i + 1].nm - gradientStops[i].nm)
        const a = hexToRgb(gradientStops[i].color)
        const b = hexToRgb(gradientStops[i + 1].color)
        return `#${toHex(a.r + (b.r - a.r) * t)}${toHex(a.g + (b.g - a.g) * t)}${toHex(a.b + (b.b - a.b) * t)}`
      }
    }
    return gradientStops[last].color
  }

  // ===== 角度・座標計算 =====
  function deg2rad(d: number): number {
    return (d * Math.PI) / 180
  }
  function pointOnCircle(angleDeg: number, radius: number): [number, number] {
    const r = deg2rad(angleDeg)
    return [CX + radius * Math.cos(r), CY + radius * Math.sin(r)]
  }

  // ===== 環状ウェッジの生成 (細セクター連結で円弧グラデーションを近似) =====
  const SEGMENT_COUNT = 360
  // 隣接セクター間にレンダリングの隙間 (アンチエイリアス由来) を出さないための微小重ね幅
  const OVERLAP_DEG = 0.1

  function wedgePath(a1: number, a2: number): string {
    const [oStartX, oStartY] = pointOnCircle(a1, R_OUTER)
    const [oEndX, oEndY] = pointOnCircle(a2, R_OUTER)
    const [iEndX, iEndY] = pointOnCircle(a2, R_INNER)
    const [iStartX, iStartY] = pointOnCircle(a1, R_INNER)
    return `M ${oStartX} ${oStartY} A ${R_OUTER} ${R_OUTER} 0 0 1 ${oEndX} ${oEndY} L ${iEndX} ${iEndY} A ${R_INNER} ${R_INNER} 0 0 0 ${iStartX} ${iStartY} Z`
  }

  const wedges = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    const a1Base = SWEEP_START + (i / SEGMENT_COUNT) * SWEEP_RANGE
    const a2Base = SWEEP_START + ((i + 1) / SEGMENT_COUNT) * SWEEP_RANGE
    const a1 = i === 0 ? a1Base : a1Base - OVERLAP_DEG
    const a2 = i === SEGMENT_COUNT - 1 ? a2Base : a2Base + OVERLAP_DEG
    // SWEEP_START 側 = 780nm, SWEEP_END 側 = 380nm にマップ
    const tMid = (i + 0.5) / SEGMENT_COUNT
    const nmMid = NM_MAX - tMid * (NM_MAX - NM_MIN)
    return { d: wedgePath(a1, a2), color: colorAt(nmMid) }
  })

  // ===== 開口部を埋める円 =====
  // 赤紫 (赤端=780nm 寄り) → gap の上側, 紫 (青紫端=380nm 寄り) → gap の下側
  const gapCircles: GapCircle[] = [
    { label: "赤紫", angleDeg: GAP_CENTER_DEG + GAP_HALF / 2, fill: "#C71585" },
    { label: "紫", angleDeg: GAP_CENTER_DEG - GAP_HALF / 2, fill: "#800080" }
  ]

  // ===== ラベル =====
  const LABEL_FONT_SIZE = 22
  const GAP_CIRCLE_TO_LABEL = 12

  // ===== ViewBox =====
  const PADDING = 16
  const viewBox = `${-PADDING} ${-PADDING} ${SIZE + 2 * PADDING} ${SIZE + 2 * PADDING}`
</script>

<div class="wrapper">
  <svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
    <!-- 円形に折り曲げたスペクトル帯 (両端に隙間あり) -->
    {#each wedges as wedge, i (i)}
      <path d={wedge.d} fill={wedge.color} />
    {/each}

    <!-- 開口部の円 (赤紫 / 紫) と ラベル -->
    {#each gapCircles as circle (circle.label)}
      {@const center = pointOnCircle(circle.angleDeg, R_MEAN)}
      <circle cx={center[0]} cy={center[1]} r={CIRCLE_RADIUS} fill={circle.fill} />
      <text
        x={center[0]}
        y={center[1] + CIRCLE_RADIUS + GAP_CIRCLE_TO_LABEL}
        font-size={LABEL_FONT_SIZE}
        fill="var(--color-body)"
        text-anchor="middle"
        dominant-baseline="hanging"
      >
        {circle.label}
      </text>
    {/each}
  </svg>
</div>

<style>
  .wrapper {
    width: 100%;
  }

  .wrapper svg {
    display: block;
    width: 100%;
    height: auto;
    padding-block: 1rem;
    box-sizing: border-box;
  }
</style>
