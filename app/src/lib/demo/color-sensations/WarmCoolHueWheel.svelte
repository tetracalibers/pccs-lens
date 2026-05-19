<script lang="ts">
  import { arc } from "d3-shape"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"
  import { ankiMode } from "$lib/state/anki.svelte"

  // ===== セグメント仕様 =====
  // 24 セグメント、各 15°。num k のセグメントは [(k-1)·SA, k·SA]。
  const HUE_COUNT = 24
  const SEGMENT_ANGLE_DEG = 360 / HUE_COUNT
  const SEGMENT_ANGLE = (2 * Math.PI) / HUE_COUNT

  // ===== 角度オフセット =====
  // num=8 の中心を 12 時に揃える。
  const TOP_HUE_NUM = 8
  const ANGLE_OFFSET_DEG = -(TOP_HUE_NUM - 0.5) * SEGMENT_ANGLE_DEG
  const ANGLE_OFFSET = (ANGLE_OFFSET_DEG * Math.PI) / 180

  // ===== 半径 =====
  const R_OUTER = 220 // 色相環外周
  const SWATCH_HEIGHT = 55 // 外周から内周までの距離
  const R_INNER = R_OUTER - SWATCH_HEIGHT
  const ARC_GAP = 26 // 色相環外周から円弧矢印までの距離
  const ARC_RADIUS = R_OUTER + ARC_GAP
  const LABEL_GAP = 24 // 円弧矢印からラベル中心までの距離
  const LABEL_RADIUS = ARC_RADIUS + LABEL_GAP

  // ===== ViewBox =====
  const VIEWBOX_PADDING = 24
  const VB_R = LABEL_RADIUS + VIEWBOX_PADDING
  const viewBox = `${-VB_R} ${-VB_R} ${2 * VB_R} ${2 * VB_R}`

  // ===== フォント =====
  const FONT_SIZE_HUE_LABEL = 14
  const FONT_SIZE_ARC_LABEL = 16

  // ===== 線幅 =====
  const ARC_STROKE_WIDTH = 3

  // ===== 矢の形状（タイプA）=====
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 18
  const ARROW_HEAD_STROKE = (ARC_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 円弧の端詰め =====
  // セグメント境界から円弧の端を内側に詰める角度。
  // 隣接する円弧矢印同士の間に視覚的な隙間を作る。
  const ARC_END_PAD_DEG = 2

  // ===== 色 =====
  const COL_WARM = "var(--canvas-pen-pink)"
  const COL_COOL = "var(--canvas-pen-water)"
  const COL_NEUTRAL = "var(--canvas-pen-gray)"

  // ===== スウォッチ間の隙間 =====
  const gap = Math.max(2, R_OUTER * 0.018)
  const midRadius = (R_OUTER + R_INNER) / 2
  const padAngle = gap / midRadius

  type Segment = {
    key: number
    symbol: string
    color: string
    textColor: string
    path: string
    midAngleDeg: number
  }

  // 12 時 = 0、CW 正の角度を SVG 座標へ変換（原点中心）
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [r * Math.cos(t), r * Math.sin(t)]
  }

  const arcGen = arc<{ x0: number; x1: number }>()
    .startAngle((d) => d.x0 + ANGLE_OFFSET)
    .endAngle((d) => d.x1 + ANGLE_OFFSET)
    .innerRadius(R_INNER)
    .outerRadius(R_OUTER)
    .padAngle(padAngle)
    .padRadius(midRadius)

  const segments: Segment[] = Array.from(PCCS_HUE_MAP.entries()).map(([num, data]) => {
    const x0 = (num - 1) * SEGMENT_ANGLE
    const x1 = num * SEGMENT_ANGLE
    const midAngleDeg = (((x0 + x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
    return {
      key: num,
      symbol: data.symbol,
      color: data.color,
      textColor: isLightColor(data.color) ? "#222" : "#fff",
      path: arcGen({ x0, x1 }) ?? "",
      midAngleDeg
    }
  })

  // セグメント num k の境界角度（12 時 = 0、CW 正、度）
  function segStartDeg(num: number) {
    return (num - 1) * SEGMENT_ANGLE_DEG + ANGLE_OFFSET_DEG
  }
  function segEndDeg(num: number) {
    return num * SEGMENT_ANGLE_DEG + ANGLE_OFFSET_DEG
  }

  type ArcGroup = {
    id: string
    label: string
    startDeg: number
    endDeg: number
    color: string
  }

  const arcGroups: ArcGroup[] = [
    {
      id: "warm",
      label: "暖色 warm",
      startDeg: segStartDeg(1) + ARC_END_PAD_DEG,
      endDeg: segEndDeg(8) - ARC_END_PAD_DEG,
      color: COL_WARM
    },
    {
      id: "neutral-green",
      label: "中性色 neutral",
      startDeg: segStartDeg(9) + ARC_END_PAD_DEG,
      endDeg: segEndDeg(12) - ARC_END_PAD_DEG,
      color: COL_NEUTRAL
    },
    {
      id: "cool",
      label: "寒色 cool",
      startDeg: segStartDeg(13) + ARC_END_PAD_DEG,
      endDeg: segEndDeg(19) - ARC_END_PAD_DEG,
      color: COL_COOL
    },
    {
      id: "neutral-purple",
      label: "中性色 neutral",
      startDeg: segStartDeg(20) + ARC_END_PAD_DEG,
      endDeg: segEndDeg(24) - ARC_END_PAD_DEG,
      color: COL_NEUTRAL
    }
  ]

  function normalizeDeg(deg: number) {
    return ((deg % 360) + 360) % 360
  }

  // 円弧の中点が下半分（時計の 6 時側）にあるか
  function isBottomArc(startDeg: number, endDeg: number) {
    const mid = normalizeDeg((startDeg + endDeg) / 2)
    return mid > 90 && mid < 270
  }

  // SVG 円弧パス（reverse=true で逆向きに描画）
  function arcPath(startDeg: number, endDeg: number, r: number, reverse: boolean): string {
    const a = reverse ? endDeg : startDeg
    const b = reverse ? startDeg : endDeg
    const [sx, sy] = pointAt(a, r)
    const [ex, ey] = pointAt(b, r)
    const delta = Math.abs(endDeg - startDeg)
    const large = delta > 180 ? 1 : 0
    const sweep = reverse ? 0 : 1
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`
  }

  const renderedArcs = arcGroups.map((g) => ({
    ...g,
    visualPath: arcPath(g.startDeg, g.endDeg, ARC_RADIUS, false),
    labelPath: arcPath(g.startDeg, g.endDeg, LABEL_RADIUS, isBottomArc(g.startDeg, g.endDeg))
  }))

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {viewBox}
  role="img"
  aria-label="PCCS色相環における暖色・寒色・中性色"
>
  <defs>
    {#each renderedArcs as group (group.id)}
      <marker
        id="warm-cool-arrow-{group.id}"
        viewBox="0 0 {ARROW_HEAD_VIEWBOX} {ARROW_HEAD_VIEWBOX}"
        refX={ARROW_HEAD_VIEWBOX / 2}
        refY={ARROW_HEAD_VIEWBOX / 2}
        markerWidth={ARROW_HEAD_SIZE}
        markerHeight={ARROW_HEAD_SIZE}
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <polyline
          points="0,3.5 3.5,1.75 0,0"
          fill="none"
          stroke={group.color}
          stroke-width={ARROW_HEAD_STROKE}
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="translate(1.1667 1.75)"
        />
      </marker>
      <path id="warm-cool-label-path-{group.id}" d={group.labelPath} fill="none" />
    {/each}
  </defs>

  <!-- 24 色相のスウォッチ -->
  {#each segments as seg (seg.key)}
    <path d={seg.path} fill={seg.color} />
  {/each}

  <!-- 色相番号ラベル（回転なし、扇形の中央に配置） -->
  {#each segments as seg (seg.key)}
    {@const [lx, ly] = pointAt(seg.midAngleDeg, midRadius)}
    <text
      class="hue-symbol"
      x={lx}
      y={ly}
      font-size={FONT_SIZE_HUE_LABEL}
      fill={seg.textColor}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {isAnki ? "" : seg.symbol}
    </text>
  {/each}

  <!-- 円弧矢印 -->
  {#each renderedArcs as group (group.id)}
    <path
      d={group.visualPath}
      fill="none"
      stroke={group.color}
      stroke-width={ARC_STROKE_WIDTH}
      stroke-linecap="round"
      marker-start="url(#warm-cool-arrow-{group.id})"
      marker-end="url(#warm-cool-arrow-{group.id})"
    />
  {/each}

  <!-- 円弧に沿うラベル -->
  {#each renderedArcs as group (group.id)}
    <text
      class="arc-label"
      font-size={FONT_SIZE_ARC_LABEL}
      fill={group.color}
      dominant-baseline="middle"
    >
      <textPath
        href="#warm-cool-label-path-{group.id}"
        startOffset="50%"
        text-anchor="middle"
      >
        {isAnki ? "" : group.label}
      </textPath>
    </text>
  {/each}
</svg>

<style>
  svg {
    display: block;
  }

  .hue-symbol,
  .arc-label {
    font-family: var(--font-mono);
  }
</style>
