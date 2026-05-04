<script lang="ts">
  import chroma from "chroma-js"
  import { hierarchy, partition, type HierarchyRectangularNode } from "d3-hierarchy"
  import { arc } from "d3-shape"
  import {
    MUNSELL_HUE_FAMILIES,
    getMunsellHueHex,
    munsellHueLabelAt
  } from "$lib/data/munsell-hue"

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

  // ===== ストローク =====
  const STROKE_WIDTH = 0.6
  const STROKE_COLOR = "#fff"

  // ガモット外などで未登録の場合のフォールバック色
  const FALLBACK_HEX = "#888"

  function colorFor(idx: number): string {
    return getMunsellHueHex(munsellHueLabelAt(idx)) ?? FALLBACK_HEX
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
      const fam = MUNSELL_HUE_FAMILIES[k]
      const c5 = 4 + 10 * k
      segments.push({
        name: `5${fam}`,
        hueIndex: c5,
        children: [-2, -1, 0, 1, 2].map((d) => {
          const idx = (c5 + d + 100) % 100
          return { name: munsellHueLabelAt(idx), hueIndex: idx, value: 1 }
        })
      })
      const c10 = 9 + 10 * k
      segments.push({
        name: `10${fam}`,
        hueIndex: c10,
        children: [-2, -1, 0, 1, 2].map((d) => {
          const idx = (c10 + d + 100) % 100
          return { name: munsellHueLabelAt(idx), hueIndex: idx, value: 1 }
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
