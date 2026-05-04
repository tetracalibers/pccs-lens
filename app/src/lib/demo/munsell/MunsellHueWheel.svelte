<script lang="ts">
  import chroma from "chroma-js"
  import { hierarchy, partition, type HierarchyRectangularNode } from "d3-hierarchy"
  import { arc } from "d3-shape"

  // ===== SVG 中心 =====
  const CX = 360
  const CY = 360

  // ===== 半径（同心二重ドーナツ）=====
  const R_INNER_INNER = 130
  const R_INNER_OUTER = 230
  const R_OUTER_OUTER = 320

  // ===== 角度オフセット =====
  // d3.arc は 12 時方向 = 0、CW を正方向とする。
  // 内側 5R はツリー先頭の子なので [0°, 18°] を占め中心は 9°。
  // ANGLE_OFFSET = -9° により、5R 中心を 12 時に揃える。
  const ANGLE_OFFSET = -Math.PI / 20

  // ===== フォント =====
  const FONT_SIZE_INNER = 15
  const FONT_SIZE_OUTER = 10

  // ===== 色 (LCH) =====
  const LCH_L = 62
  const LCH_C = 62

  // ===== ストローク =====
  const STROKE_WIDTH = 0.6
  const STROKE_COLOR = "#fff"

  // ===== Munsell 色相族 =====
  const FAMILIES = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"] as const

  // 外側 100 色相 idx 0..99 → ラベル "1R", "2R", ..., "10R", "1YR", ..., "10RP"
  function outerLabel(idx: number): string {
    const num = (idx % 10) + 1
    const fam = FAMILIES[Math.floor(idx / 10)]
    return `${num}${fam}`
  }

  // ===== Munsell idx (0..99) → LCH 色相角 =====
  // 主要色相 5X_k を 10 点の anchor として配置し、線形補間する。
  const ANCHORS: { idx: number; lch: number }[] = [
    { idx: 4, lch: 30 }, // 5R
    { idx: 14, lch: 60 }, // 5YR
    { idx: 24, lch: 95 }, // 5Y
    { idx: 34, lch: 130 }, // 5GY
    { idx: 44, lch: 160 }, // 5G
    { idx: 54, lch: 200 }, // 5BG
    { idx: 64, lch: 250 }, // 5B
    { idx: 74, lch: 285 }, // 5PB
    { idx: 84, lch: 320 }, // 5P
    { idx: 94, lch: 350 } // 5RP
  ]

  function lchHue(idx: number): number {
    // anchor を巡回参照できるよう [4, 104) に正規化
    let i = idx < ANCHORS[0].idx ? idx + 100 : idx
    for (let k = 0; k < ANCHORS.length; k++) {
      const a = ANCHORS[k]
      const b =
        k < ANCHORS.length - 1
          ? ANCHORS[k + 1]
          : { idx: ANCHORS[0].idx + 100, lch: ANCHORS[0].lch + 360 }
      if (i >= a.idx && i < b.idx) {
        const t = (i - a.idx) / (b.idx - a.idx)
        return (((a.lch + t * (b.lch - a.lch)) % 360) + 360) % 360
      }
    }
    return 0
  }

  function colorFor(idx: number): string {
    return chroma.lch(LCH_L, LCH_C, lchHue(idx)).hex()
  }

  function textColorOn(hex: string): string {
    return chroma(hex).luminance() > 0.55 ? "#222" : "#fff"
  }

  // ===== d3-hierarchy のためのデータ構築 =====
  type LeafDatum = { name: string; hueIndex: number; value: number }
  type InnerDatum = { name: string; hueIndex: number; children: LeafDatum[] }
  type RootDatum = { name: string; children: InnerDatum[] }
  type AnyDatum = RootDatum | InnerDatum | LeafDatum

  // 内側 i=2k → 5X_k（外側中心 4+10k、子 [-2..+2]）
  // 内側 i=2k+1 → 10X_k（外側中心 9+10k、子 [-2..+2]、家族をまたぐ）
  function buildInnerSegments(): InnerDatum[] {
    const segments: InnerDatum[] = []
    for (let k = 0; k < 10; k++) {
      const fam = FAMILIES[k]
      const c5 = 4 + 10 * k
      segments.push({
        name: `5${fam}`,
        hueIndex: c5,
        children: [-2, -1, 0, 1, 2].map((d) => {
          const idx = (c5 + d + 100) % 100
          return { name: outerLabel(idx), hueIndex: idx, value: 1 }
        })
      })
      const c10 = 9 + 10 * k
      segments.push({
        name: `10${fam}`,
        hueIndex: c10,
        children: [-2, -1, 0, 1, 2].map((d) => {
          const idx = (c10 + d + 100) % 100
          return { name: outerLabel(idx), hueIndex: idx, value: 1 }
        })
      })
    }
    return segments
  }

  const rootData: RootDatum = { name: "munsell", children: buildInnerSegments() }

  const root = hierarchy<AnyDatum>(rootData as AnyDatum, (d) =>
    "children" in d ? d.children : undefined
  ).sum((d) => ("value" in d ? d.value : 0))

  partition<AnyDatum>().size([2 * Math.PI, R_OUTER_OUTER])(root)

  function radiiAtDepth(depth: number): [number, number] {
    if (depth === 1) return [R_INNER_INNER, R_INNER_OUTER]
    if (depth === 2) return [R_INNER_OUTER, R_OUTER_OUTER]
    return [0, 0]
  }

  const arcGen = arc<HierarchyRectangularNode<AnyDatum>>()
    .startAngle((d) => d.x0 + ANGLE_OFFSET)
    .endAngle((d) => d.x1 + ANGLE_OFFSET)
    .innerRadius((d) => radiiAtDepth(d.depth)[0])
    .outerRadius((d) => radiiAtDepth(d.depth)[1])

  type DrawNode = {
    key: string
    depth: 1 | 2
    label: string
    hueIndex: number
    color: string
    path: string
    /** 12 時 = 0、CW を正とする中心角度（度） */
    midAngleDeg: number
    midRadius: number
  }

  function buildDrawNodes(): DrawNode[] {
    const nodes: DrawNode[] = []
    const all = (root as HierarchyRectangularNode<AnyDatum>).descendants()
    for (const node of all) {
      if (node.depth === 0) continue
      const [r0, r1] = radiiAtDepth(node.depth)
      const midR = (r0 + r1) / 2
      const midAng = (((node.x0 + node.x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
      const data = node.data as InnerDatum | LeafDatum
      const path = arcGen(node) ?? ""
      nodes.push({
        key: `d${node.depth}-${data.hueIndex}`,
        depth: node.depth as 1 | 2,
        label: data.name,
        hueIndex: data.hueIndex,
        color: colorFor(data.hueIndex),
        path,
        midAngleDeg: midAng,
        midRadius: midR
      })
    }
    return nodes
  }

  const drawNodes = buildDrawNodes()
  const innerNodes = drawNodes.filter((n) => n.depth === 1)
  const outerNodes = drawNodes.filter((n) => n.depth === 2)

  // 12 時 = 0、CW 正の角度を SVG 座標へ変換
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [CX + r * Math.cos(t), CY + r * Math.sin(t)]
  }

  function normDeg(deg: number): number {
    return ((deg % 360) + 360) % 360
  }

  // テキストが radial 方向（中心→外）に読めるよう回転。
  // 上半分（n<180、12 時側）はそのまま、下半分（n>=180、6 時側）は 180° 反転して
  // 上下逆さまを回避する。反転境界が 6 時方向に来るため、3 時/9 時付近で
  // 隣接ラベルの向きが食い違うことがなくなる。
  function labelRotation(midAngleDeg: number): number {
    const n = normDeg(midAngleDeg)
    return n < 180 ? midAngleDeg - 90 : midAngleDeg + 90
  }

  // ===== ViewBox =====
  const PADDING = 16
  const VB_R = R_OUTER_OUTER + PADDING
  const viewBox = `${CX - VB_R} ${CY - VB_R} ${2 * VB_R} ${2 * VB_R}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <!-- 内側 20 色相 + 外側 100 色相のセグメント -->
  <!-- d3.arc は原点中心にパスを生成するので translate で中心を揃える -->
  <g transform="translate({CX} {CY})">
    {#each drawNodes as node (node.key)}
      <path
        d={node.path}
        fill={node.color}
        stroke={STROKE_COLOR}
        stroke-width={STROKE_WIDTH}
      />
    {/each}
  </g>

  <!-- 外側 100 色相のラベル（扇形の中央に配置） -->
  {#each outerNodes as node (node.key)}
    {@const [lx, ly] = pointAt(node.midAngleDeg, node.midRadius)}
    <text
      x={lx}
      y={ly}
      font-size={FONT_SIZE_OUTER}
      fill={textColorOn(node.color)}
      text-anchor="middle"
      dominant-baseline="central"
      transform="rotate({labelRotation(node.midAngleDeg)} {lx} {ly})"
    >
      {node.label}
    </text>
  {/each}

  <!-- 内側 20 色相のラベル（扇形の中央に配置） -->
  {#each innerNodes as node (node.key)}
    {@const [lx, ly] = pointAt(node.midAngleDeg, node.midRadius)}
    <text
      x={lx}
      y={ly}
      font-size={FONT_SIZE_INNER}
      font-weight="600"
      fill={textColorOn(node.color)}
      text-anchor="middle"
      dominant-baseline="central"
      transform="rotate({labelRotation(node.midAngleDeg)} {lx} {ly})"
    >
      {node.label}
    </text>
  {/each}
</svg>
