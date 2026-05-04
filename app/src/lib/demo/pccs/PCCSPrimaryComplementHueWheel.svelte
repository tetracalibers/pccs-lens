<script lang="ts">
  import { arc } from "d3-shape"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"
  import { ankiMode } from "$lib/state/anki.svelte"

  // ===== SVG 中心 =====
  const CX = 360
  const CY = 360

  // ===== 半径（PCCSHueWheel のデフォルト値と同じ）=====
  const R_OUTER = 220
  const R_INNER = R_OUTER - 55

  // ===== セグメント間ギャップ（PCCSHueWheel と同じ算出式）=====
  const MID_RADIUS = (R_OUTER + R_INNER) / 2
  const GAP = Math.max(2, R_OUTER * 0.018)
  const PAD_ANGLE = GAP / MID_RADIUS

  // ===== セグメント仕様（PCCSHueWheel と同じ）=====
  // 24 セグメント、各 15°。num k のセグメントは [(k-1)·SA, k·SA]。
  const HUE_COUNT = 24
  const SEGMENT_ANGLE = (2 * Math.PI) / HUE_COUNT

  // ===== 角度オフセット =====
  // num=8（Y）の中心を 12 時に揃える。
  const TOP_HUE_NUM = 8
  const ANGLE_OFFSET = -(TOP_HUE_NUM - 0.5) * SEGMENT_ANGLE

  // ===== フォント =====
  const FONT_SIZE_LABEL = 15

  // ===== ストローク（ダークモードでも輪郭が見えるように）=====
  const STROKE_WIDTH = 1
  const STROKE_COLOR = "var(--color-body)"

  // ===== 中心円の破線（dash, gap の長さ）=====
  const CENTER_CIRCLE_DASH = 4
  const CENTER_CIRCLE_GAP = 4

  // ===== 矢印（心理四原色 → 心理補色）=====
  const ARROW_STROKE_WIDTH = 1.6
  const ARROW_COLOR = "var(--color-body)"
  // 内周からさらに内側にどれだけ余白を取るか（始点・終点の両方に適用）
  const ARROW_END_INSET = 22

  // ===== 矢の形状（タイプA）=====
  const ARROW_HEAD_VIEWBOX = 7
  const ARROW_HEAD_SIZE = 20
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ガモット外などで未登録の場合のフォールバック色
  const FALLBACK_HEX = "#888"

  // ===== 心理四原色 → 心理補色（に近い色相）=====
  // PCCS 色相番号: 2(R)→14(BG), 8(Y)→20(V), 12(G)→24(RP), 18(B)→6(yO)
  const COMPLEMENT_PAIRS = [
    { from: 2, to: 14 },
    { from: 8, to: 20 },
    { from: 12, to: 24 },
    { from: 18, to: 6 }
  ] as const

  // 表示するすべての色相番号（原色 + 補色）
  const DISPLAY_HUE_NUMS = [
    ...COMPLEMENT_PAIRS.map((p) => p.from),
    ...COMPLEMENT_PAIRS.map((p) => p.to)
  ]

  type Segment = {
    key: string
    label: string
    color: string
    textColor: string
    path: string
    /** 12 時 = 0、CW を正とする中心角度（度） */
    midAngleDeg: number
    midRadius: number
  }

  const arcGen = arc<{ x0: number; x1: number }>()
    .startAngle((d) => d.x0 + ANGLE_OFFSET)
    .endAngle((d) => d.x1 + ANGLE_OFFSET)
    .innerRadius(R_INNER)
    .outerRadius(R_OUTER)
    .padAngle(PAD_ANGLE)
    .padRadius(MID_RADIUS)

  const segments: Segment[] = DISPLAY_HUE_NUMS.map((num) => {
    const data = PCCS_HUE_MAP.get(num)
    const color = data?.color ?? FALLBACK_HEX
    const x0 = (num - 1) * SEGMENT_ANGLE
    const x1 = num * SEGMENT_ANGLE
    const midAng = (((x0 + x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
    return {
      key: `seg-${num}`,
      label: data?.symbol ?? String(num),
      color,
      textColor: isLightColor(color) ? "#222" : "#fff",
      path: arcGen({ x0, x1 }) ?? "",
      midAngleDeg: midAng,
      midRadius: MID_RADIUS
    }
  })

  // 12 時 = 0、CW 正の角度を SVG 座標へ変換（中心 (CX, CY) 基準）
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [CX + r * Math.cos(t), CY + r * Math.sin(t)]
  }

  // ローカル座標（translate({CX} {CY}) 内、原点中心）での座標
  function localPointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [r * Math.cos(t), r * Math.sin(t)]
  }

  function midAngleDegOfHue(num: number): number {
    return (((num - 0.5) * SEGMENT_ANGLE + ANGLE_OFFSET) * 180) / Math.PI
  }

  type Arrow = {
    key: string
    x1: number
    y1: number
    x2: number
    y2: number
  }

  // 各補色ペアの矢印（始点 from の内側、終点 to の内側）
  const arrows: Arrow[] = COMPLEMENT_PAIRS.map(({ from, to }) => {
    const angFrom = midAngleDegOfHue(from)
    const angTo = midAngleDegOfHue(to)
    const r = R_INNER - ARROW_END_INSET
    const [x1, y1] = localPointAt(angFrom, r)
    const [x2, y2] = localPointAt(angTo, r)
    return { key: `arrow-${from}-${to}`, x1, y1, x2, y2 }
  })

  // ===== ViewBox =====
  const PADDING = 16
  const VB_R = R_OUTER + PADDING
  const viewBox = `${CX - VB_R} ${CY - VB_R} ${2 * VB_R} ${2 * VB_R}`

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <defs>
    <marker
      id="primary-complement-arrow"
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
        stroke={ARROW_COLOR}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 心理四原色とその心理補色のセグメント -->
  <!-- d3.arc は原点中心にパスを生成するので translate で中心を揃える -->
  <g transform="translate({CX} {CY})">
    <!-- 各色相セグメントの中心を通る円（破線）-->
    <circle
      cx="0"
      cy="0"
      r={MID_RADIUS}
      fill="none"
      stroke={STROKE_COLOR}
      stroke-width={STROKE_WIDTH}
      stroke-dasharray="{CENTER_CIRCLE_DASH} {CENTER_CIRCLE_GAP}"
    />
    {#each segments as seg (seg.key)}
      <path d={seg.path} fill={seg.color} stroke={STROKE_COLOR} stroke-width={STROKE_WIDTH} />
    {/each}

    <!-- 心理四原色 → 心理補色の矢印 -->
    {#each arrows as ar (ar.key)}
      <line
        x1={ar.x1}
        y1={ar.y1}
        x2={ar.x2}
        y2={ar.y2}
        stroke={ARROW_COLOR}
        stroke-width={ARROW_STROKE_WIDTH}
        stroke-linecap="round"
        marker-end="url(#primary-complement-arrow)"
      />
    {/each}
  </g>

  <!-- ラベル（回転なし、扇形の中央に配置）-->
  {#each segments as seg (seg.key)}
    {@const [lx, ly] = pointAt(seg.midAngleDeg, seg.midRadius)}
    <text
      x={lx}
      y={ly}
      font-size={FONT_SIZE_LABEL}
      font-weight="600"
      fill={seg.textColor}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {isAnki ? "" : seg.label}
    </text>
  {/each}
</svg>
