<script lang="ts">
  import { hierarchy, partition, type HierarchyRectangularNode } from "d3-hierarchy"
  import { arc } from "d3-shape"
  import { mhvcToHex } from "munsell"

  // ===== SVG 中心 =====
  const CX = 460
  const CY = 460

  // ===== マンセル設定 =====
  const VALUE = 5
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
    28, 28, 28, 28, 26, 20, 18, 16, 16, 14, 14, 14, 14, 14, 16, 20, 32, 32, 32, 32, 32, 32, 30, 26,
    24, 20, 20, 20, 22, 24, 32, 34, 36, 38, 40, 40, 40, 36, 32, 30
  ]
  const MAX_CHROMA_OVERALL = Math.max(...MAX_CHROMA_AT_V5)
  /** 全色相を通じた最大リング数（=最大彩度に到達する色相のリング数） */
  const RING_COUNT = MAX_CHROMA_OVERALL / CHROMA_STEP

  // ===== 半径 =====
  // 中央の無彩色円の直径と各彩度帯の幅を揃えるため、R_CENTER = RING_W / 2 とする
  const RING_W = 16
  const R_CENTER = RING_W / 2
  const R_OUTER = R_CENTER + RING_COUNT * RING_W

  // ===== ストローク =====
  const STROKE_WIDTH = 0.6
  const STROKE_COLOR = "#fff"

  // ===== 角度オフセット =====
  // d3.arc は 12 時 = 0、CW 正方向。slot k の中心角は (k + 0.5) * (2π / HUE_COUNT)。
  // hue40=2 ("5R") を 12 時に固定するため -2.5 スロット分回転。
  const ANGLE_OFFSET = -((2 + 0.5) * 2 * Math.PI) / HUE_COUNT

  /** hue40 → hue100（munsell.js の入力用、R/100Z 上の正規化） */
  function hue40ToHue100(hue40: number): number {
    return (hue40 * 2.5) % 100
  }

  // ===== 中央 N =====
  const CENTER_HEX = mhvcToHex(0, VALUE, 0)

  // ===== 階層データ構築 =====
  // root → 40 本の chain。各 chain は当該色相の彩度ステップ（CHROMA_STEP..maxC）を
  // 単一子の連鎖で表現する。partition() は各色相に等しい角度を割り当て、
  // 単一子のため depth がそのまま彩度リング番号に対応する。
  // 色相ごとに chain 長が異なるため、外周は色相の最高彩度に応じて凹凸する。
  type CellData = {
    hue40: number
    hue100: number
    chromaIdx: number
    chroma: number
    children?: CellData[]
  }
  type RootData = { children: CellData[] }
  type AnyDatum = RootData | CellData

  function buildChain(hue40: number): CellData {
    const hue100 = hue40ToHue100(hue40)
    const maxC = MAX_CHROMA_AT_V5[hue40]
    const chromas: number[] = []
    for (let c = CHROMA_STEP; c <= maxC; c += CHROMA_STEP) chromas.push(c)
    let node: CellData | undefined
    for (let i = chromas.length - 1; i >= 0; i--) {
      const base = { hue40, hue100, chromaIdx: i, chroma: chromas[i] }
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

  function buildDrawCells(): DrawCell[] {
    const cells: DrawCell[] = []
    for (const node of (root as HierarchyRectangularNode<AnyDatum>).descendants()) {
      if (node.depth === 0) continue
      const data = node.data as CellData
      cells.push({
        key: `h${data.hue40}-c${data.chromaIdx}`,
        path: arcGen(node) ?? "",
        fill: mhvcToHex(data.hue100, VALUE, data.chroma)
      })
    }
    return cells
  }

  const cells = buildDrawCells()

  // ===== ViewBox =====
  // 等明度面の外縁は色相ごとの最高彩度差で凹凸する。最大彩度（R_OUTER）で
  // 正方形にすると上下に大きな余白が出るため、外周をサンプリングして
  // 上下/左右それぞれの最大半径方向の伸びを求める。
  // 円の中心を SVG の中心に保つため、viewBox は (CX, CY) を中心に対称にする
  // （幅は完全フィットしないが、上下方向の高さは縮められる）。
  function computeHalfExtents(): { halfW: number; halfH: number } {
    let halfW = R_CENTER
    let halfH = R_CENTER
    const slotAngle = (2 * Math.PI) / HUE_COUNT
    const SAMPLES_PER_SLOT = 32
    for (let k = 0; k < HUE_COUNT; k++) {
      const rings = Math.floor(MAX_CHROMA_AT_V5[k] / CHROMA_STEP)
      const r = R_CENTER + rings * RING_W
      const start = k * slotAngle + ANGLE_OFFSET
      const end = (k + 1) * slotAngle + ANGLE_OFFSET
      for (let i = 0; i <= SAMPLES_PER_SLOT; i++) {
        const t = start + ((end - start) * i) / SAMPLES_PER_SLOT
        const ax = Math.abs(r * Math.sin(t))
        const ay = Math.abs(r * Math.cos(t))
        if (ax > halfW) halfW = ax
        if (ay > halfH) halfH = ay
      }
    }
    return { halfW, halfH }
  }

  const PADDING = 4
  const { halfW, halfH } = computeHalfExtents()
  const vbW = 2 * (halfW + PADDING)
  const vbH = 2 * (halfH + PADDING)
  const viewBox = `${CX - halfW - PADDING} ${CY - halfH - PADDING} ${vbW} ${vbH}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <!-- 中央ディスク（chroma=0 の無彩色） -->
  <circle
    cx={CX}
    cy={CY}
    r={R_CENTER}
    fill={CENTER_HEX}
    stroke={STROKE_COLOR}
    stroke-width={STROKE_WIDTH}
  />

  <!-- 各色相の彩度リング（その色相の最高彩度まで） -->
  <g transform="translate({CX} {CY})">
    {#each cells as cell (cell.key)}
      <path d={cell.path} fill={cell.fill} stroke={STROKE_COLOR} stroke-width={STROKE_WIDTH} />
    {/each}
  </g>
</svg>
