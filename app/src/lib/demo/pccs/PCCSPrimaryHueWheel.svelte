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
  // num=8 のセグメント中心は 7.5·SA なので、これを 0 にする。
  const TOP_HUE_NUM = 8
  const ANGLE_OFFSET = -(TOP_HUE_NUM - 0.5) * SEGMENT_ANGLE

  // ===== フォント =====
  const FONT_SIZE_LABEL = 15

  // ===== ストローク（ダークモードでも輪郭が見えるように）=====
  const STROKE_WIDTH = 1
  const STROKE_COLOR = "var(--color-body)"

  // ガモット外などで未登録の場合のフォールバック色
  const FALLBACK_HEX = "#888"

  // ===== 心理四原色（赤・黄・緑・青）=====
  // PCCS 色相番号 2, 8, 12, 18 がそれぞれ R, Y, G, B に対応する。
  const PRIMARY_HUE_NUMS = [2, 8, 12, 18] as const

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

  const segments: Segment[] = PRIMARY_HUE_NUMS.map((num) => {
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

  // 12 時 = 0、CW 正の角度を SVG 座標へ変換
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [CX + r * Math.cos(t), CY + r * Math.sin(t)]
  }

  // ===== ViewBox =====
  const PADDING = 16
  const VB_R = R_OUTER + PADDING
  const viewBox = `${CX - VB_R} ${CY - VB_R} ${2 * VB_R} ${2 * VB_R}`

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <!-- 心理四原色のセグメント（その他の色相位置は空欄）-->
  <!-- d3.arc は原点中心にパスを生成するので translate で中心を揃える -->
  <g transform="translate({CX} {CY})">
    <!-- セグメントの外周に沿う円 -->
    <circle
      cx="0"
      cy="0"
      r={R_OUTER}
      fill="none"
      stroke={STROKE_COLOR}
      stroke-width={STROKE_WIDTH}
    />
    {#each segments as seg (seg.key)}
      <path d={seg.path} fill={seg.color} stroke={STROKE_COLOR} stroke-width={STROKE_WIDTH} />
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
