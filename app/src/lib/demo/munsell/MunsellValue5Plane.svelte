<script lang="ts">
  import { hierarchy, partition, type HierarchyRectangularNode } from "d3-hierarchy"
  import { arc } from "d3-shape"
  import { mhvcToHex } from "munsell"
  import { MUNSELL_HUE_FAMILIES } from "$lib/data/munsell-hue"
  import { SvelteSet } from "svelte/reactivity"

  // ===== SVG 中心 =====
  const CX = 460
  const CY = 460

  // ===== マンセル設定 =====
  const VALUE = 6
  /** 色相数（2.5 ステップ × 40） */
  const HUE_COUNT = 40
  /** 彩度ステップ（マンセル標準は 2 刻み） */
  const CHROMA_STEP = 4

  /**
   * V=5 における各色相の最高彩度（Munsell Renotation Data 由来）。
   *
   * 出典: munsell.js の MRD.maxChromaTable[hue40][5]
   * （http://www.rit-mcsl.org/MunsellRenotation/all.dat より生成）。
   *
   * hue40 の対応:
   *   hue40 = (4 * family_idx + round(prefix / 2.5)) mod 40
   *   → hue40=0:"10RP", 1:"2.5R", 2:"5R", 3:"7.5R", 4:"10R",
   *      5:"2.5YR", ..., 38:"5RP", 39:"7.5RP"
   *
   * Y/GY 付近は 14、P 付近は 40 まで伸び、これが等明度面の凹凸を生む。
   */
  const MAX_CHROMA_AT_V5: readonly number[] = [
    28, 28, 28, 28, 26, 20, 18, 16, 16, 14,
    14, 14, 14, 14, 16, 20, 32, 32, 32, 32,
    32, 32, 30, 26, 24, 20, 20, 20, 22, 24,
    32, 34, 36, 38, 40, 40, 40, 36, 32, 30
  ]
  const MAX_CHROMA_OVERALL = Math.max(...MAX_CHROMA_AT_V5)
  /** 全色相を通じた最大リング数（=最大彩度に到達する色相のリング数） */
  const RING_COUNT = MAX_CHROMA_OVERALL / CHROMA_STEP

  // ===== 半径 =====
  const R_CENTER =12
  const RING_W = 15
  const R_OUTER = R_CENTER + RING_COUNT * RING_W

  // ===== フォント =====
  const FONT_SIZE_HUE = 12
  const FONT_SIZE_CENTER = 10

  // ===== ラベル配置半径（外周外側、円周上に均等配置）=====
  const HUE_LABEL_GAP = 8
  const R_HUE_LABEL = R_OUTER + HUE_LABEL_GAP + FONT_SIZE_HUE

  // ===== ストローク =====
  const STROKE_WIDTH = 0.6
  const STROKE_COLOR = "#fff"

  // ===== 角度オフセット =====
  // d3.arc は 12 時 = 0、CW 正方向。slot k の中心角は (k + 0.5) * (2π / HUE_COUNT)。
  // hue40=2 ("5R") を 12 時に固定するため -2.5 スロット分回転。
  const ANGLE_OFFSET = -((2 + 0.5) * 2 * Math.PI) / HUE_COUNT

  // ===== hue40 表記変換 =====
  /** hue40 → "5R", "2.5YR", "10RP" などの表記 */
  function hue40ToLabel(hue40: number): string {
    const prefIdx = ((hue40 % 4) + 4) % 4 // 0..3
    if (prefIdx === 0) {
      // hue40 = 4 * famIdx, prefix = 10 だが家族は前のものに繰り上がる
      const famIdx = (Math.floor(hue40 / 4) - 1 + 10) % 10
      return `10${MUNSELL_HUE_FAMILIES[famIdx]}`
    }
    const famIdx = Math.floor(hue40 / 4) % 10
    const prefix = prefIdx * 2.5 // 2.5, 5, 7.5
    return `${prefix}${MUNSELL_HUE_FAMILIES[famIdx]}`
  }

  /** hue40 → hue100（munsell.js の入力用、R/100Z 上の正規化） */
  function hue40ToHue100(hue40: number): number {
    return (hue40 * 2.5) % 100
  }

  // ===== 中央 N5 =====
  const CENTER_HEX = mhvcToHex(0, VALUE, 0)

  // ===== 階層データ構築 =====
  // root → 40 本の chain。各 chain は当該色相の彩度ステップ（2..maxC）を
  // 単一子の連鎖で表現する。partition() は各色相に等しい角度を割り当て、
  // 単一子のため depth がそのまま彩度リング番号に対応する。
  // 色相ごとに chain 長が異なるため、外周は色相の最高彩度に応じて凹凸する。
  type CellData = {
    hue40: number
    hue100: number
    chromaIdx: number
    chroma: number
    hueLabel: string
    children?: CellData[]
  }
  type RootData = { children: CellData[] }
  type AnyDatum = RootData | CellData

  function buildChain(hue40: number): CellData {
    const hue100 = hue40ToHue100(hue40)
    const hueLabel = hue40ToLabel(hue40)
    const maxC = MAX_CHROMA_AT_V5[hue40]
    const chromas: number[] = []
    for (let c = CHROMA_STEP; c <= maxC; c += CHROMA_STEP) chromas.push(c)
    let node: CellData | undefined
    for (let i = chromas.length - 1; i >= 0; i--) {
      const base = { hue40, hue100, chromaIdx: i, chroma: chromas[i], hueLabel }
      node = node ? { ...base, children: [node] } : { ...base }
    }
    return node!
  }

  const rootData: RootData = {
    children: Array.from({ length: HUE_COUNT }, (_, k) => buildChain(k))
  }

  const root = hierarchy<AnyDatum>(rootData as AnyDatum, (d) =>
    "children" in d ? d.children : undefined
  ).count()

  partition<AnyDatum>().size([2 * Math.PI, R_OUTER])(root)

  /** depth d (1..N) → 彩度 chromaIdx = d-1 のリングの内外半径 */
  function radiiAtDepth(depth: number): [number, number] {
    return [R_CENTER + (depth - 1) * RING_W, R_CENTER + depth * RING_W]
  }

  const arcGen = arc<HierarchyRectangularNode<AnyDatum>>()
    .startAngle((d) => d.x0 + ANGLE_OFFSET)
    .endAngle((d) => d.x1 + ANGLE_OFFSET)
    .innerRadius((d) => radiiAtDepth(d.depth)[0])
    .outerRadius((d) => radiiAtDepth(d.depth)[1])

  type DrawCell = {
    key: string
    path: string
    fill: string
  }

  type HueLabelInfo = {
    key: string
    label: string
    midAngleDeg: number
  }

  function buildDrawData(): { cells: DrawCell[]; hueLabels: HueLabelInfo[] } {
    const cells: DrawCell[] = []
    const hueLabels: HueLabelInfo[] = []
    const seen = new SvelteSet<number>()

    for (const node of (root as HierarchyRectangularNode<AnyDatum>).descendants()) {
      if (node.depth === 0) continue
      const data = node.data as CellData
      cells.push({
        key: `h${data.hue40}-c${data.chromaIdx}`,
        path: arcGen(node) ?? "",
        fill: mhvcToHex(data.hue100, VALUE, data.chroma)
      })
      if (!seen.has(data.hue40)) {
        seen.add(data.hue40)
        const midAngleDeg = (((node.x0 + node.x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
        hueLabels.push({
          key: `lbl-${data.hue40}`,
          label: data.hueLabel,
          midAngleDeg
        })
      }
    }
    return { cells, hueLabels }
  }

  const { cells, hueLabels } = buildDrawData()

  // 12 時 = 0、CW 正の角度 → SVG 座標
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [CX + r * Math.cos(t), CY + r * Math.sin(t)]
  }

  function normDeg(deg: number): number {
    return ((deg % 360) + 360) % 360
  }

  // 上半分はラベルを内→外向き、下半分は反転して上下逆を回避
  function labelRotation(midAngleDeg: number): number {
    const n = normDeg(midAngleDeg)
    return n < 180 ? midAngleDeg - 90 : midAngleDeg + 90
  }

  // ===== ViewBox =====
  const PADDING = 4
  const VB_R = R_HUE_LABEL + FONT_SIZE_HUE + PADDING
  const viewBox = `${CX - VB_R} ${CY - VB_R} ${2 * VB_R} ${2 * VB_R}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <!-- 中央 N5 ディスク（chroma=0 の無彩色） -->
  <circle
    cx={CX}
    cy={CY}
    r={R_CENTER}
    fill={CENTER_HEX}
    stroke={STROKE_COLOR}
    stroke-width={STROKE_WIDTH}
  />
  <text
    x={CX}
    y={CY}
    font-size={FONT_SIZE_CENTER}
    fill="#fff"
    text-anchor="middle"
    dominant-baseline="central"
  >
    N{VALUE}
  </text>

  <!-- 各色相の彩度リング（その色相の最高彩度まで） -->
  <g transform="translate({CX} {CY})">
    {#each cells as cell (cell.key)}
      <path
        d={cell.path}
        fill={cell.fill}
        stroke={STROKE_COLOR}
        stroke-width={STROKE_WIDTH}
      />
    {/each}
  </g>

  <!-- 色相ラベル（外周外側、放射方向）-->
  {#each hueLabels as h (h.key)}
    {@const [lx, ly] = pointAt(h.midAngleDeg, R_HUE_LABEL)}
    <text
      x={lx}
      y={ly}
      font-size={FONT_SIZE_HUE}
      fill="var(--color-body)"
      text-anchor="middle"
      dominant-baseline="central"
      transform="rotate({labelRotation(h.midAngleDeg)} {lx} {ly})"
    >
      {h.label}
    </text>
  {/each}
</svg>
