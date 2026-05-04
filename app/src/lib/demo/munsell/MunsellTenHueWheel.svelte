<script lang="ts">
  import { arc } from "d3-shape"
  import { MUNSELL_HUE_FAMILIES, getMunsellHueHex, munsellHueLabelAt } from "$lib/data/munsell-hue"
  import { ankiMode } from "$lib/state/anki.svelte"

  // ===== SVG 中心 =====
  const CX = 360
  const CY = 360

  // ===== 半径（MunsellHueWheel の内側リングと同じ）=====
  const R_INNER = 100
  const R_OUTER = 145

  // ===== 内側リングのセグメント仕様（MunsellHueWheel と同じ）=====
  // 20 セグメント、各 18°。先頭（5R）が [0°, 18°] を占める。
  const SEGMENT_ANGLE = (2 * Math.PI) / 20

  // ===== 角度オフセット =====
  // ANGLE_OFFSET = -9° により、5R 中心を 12 時に揃える。
  const ANGLE_OFFSET = -Math.PI / 20

  // ===== フォント =====
  const FONT_SIZE_LABEL = 18

  // ガモット外などで未登録の場合のフォールバック色
  const FALLBACK_HEX = "#888"

  function colorFor(idx: number): string {
    return getMunsellHueHex(munsellHueLabelAt(idx)) ?? FALLBACK_HEX
  }

  type Segment = {
    key: string
    label: string
    color: string
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

  // 10 色相（5R, 5YR, 5Y, 5GY, 5G, 5BG, 5B, 5PB, 5P, 5RP）
  // MunsellHueWheel の buildInnerSegments では i=2k → 5X_k（k=0..9）。
  const segments: Segment[] = MUNSELL_HUE_FAMILIES.map((fam, k) => {
    const i = 2 * k
    const x0 = i * SEGMENT_ANGLE
    const x1 = (i + 1) * SEGMENT_ANGLE
    const hueIdx = 4 + 10 * k
    const midAng = (((x0 + x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
    return {
      key: `seg-${fam}`,
      label: fam,
      color: colorFor(hueIdx),
      path: arcGen({ x0, x1 }) ?? "",
      midAngleDeg: midAng,
      midRadius: (R_INNER + R_OUTER) / 2
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
  <!-- 10 色相のセグメント（その他の色相位置は空欄）-->
  <!-- d3.arc は原点中心にパスを生成するので translate で中心を揃える -->
  <g transform="translate({CX} {CY})">
    {#each segments as seg (seg.key)}
      <path d={seg.path} fill={seg.color} />
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
      fill="#fff"
      text-anchor="middle"
      dominant-baseline="central"
    >
      {isAnki ? "" : seg.label}
    </text>
  {/each}
</svg>
