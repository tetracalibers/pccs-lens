<script lang="ts">
  import chroma from "chroma-js"
  import { hierarchy, partition, type HierarchyRectangularNode } from "d3-hierarchy"
  import { arc } from "d3-shape"
  import { MUNSELL_HUE_FAMILIES, getMunsellHueHex, munsellHueLabelAt } from "$lib/data/munsell-hue"
  import { PCCS_V24, PCCS_HEX_MAP, PCCS_HUE_MAP } from "$lib/data/pccs"

  // ===== SVG 中心 =====
  const CX = 360
  const CY = 360

  // ===== 半径（同心二重ドーナツ）=====
  const R_INNER_INNER = 90
  const R_INNER_OUTER = 160
  const R_OUTER_OUTER = 260

  // ===== PCCS bトーン 角丸正方形のレイアウト =====
  const PCCS_DOT_RADIUS = 22 // 正方形の半辺の長さ
  const PCCS_DOT_GAP = 12 // 外側リング外端から正方形までの隙間
  const PCCS_SQUARE_CORNER = 6 // 角丸の半径

  // ===== PCCS色相記号ラベルのレイアウト（正方形の中央に配置）=====
  const PCCS_LABEL_FONT_SIZE = 11

  // ===== 角度オフセット =====
  // d3.arc は 12 時方向 = 0、CW を正方向とする。
  // 内側 5R はツリー先頭の子なので [0°, 18°] を占め中心は 9°。
  // ANGLE_OFFSET = -9° により、5R 中心を 12 時に揃える。
  const ANGLE_OFFSET = -Math.PI / 20

  // ===== フォント =====
  const FONT_SIZE_INNER = 14
  const FONT_SIZE_OUTER = 12

  // ===== 外側ラベルの配置半径（外周から内側へ inset）=====
  const OUTER_LABEL_INSET = FONT_SIZE_OUTER * 2
  const R_OUTER_LABEL = R_OUTER_OUTER - OUTER_LABEL_INSET

  // ===== ストローク =====
  const STROKE_WIDTH = 0.6
  const STROKE_COLOR = "#fff"

  // ===== 対応する PCCS 色相がない外側扇形の透過度 =====
  const FADED_OPACITY = 0.8

  // ガモット外などで未登録の場合のフォールバック色
  const FALLBACK_HEX = "#888"

  function colorFor(idx: number): string {
    return getMunsellHueHex(munsellHueLabelAt(idx)) ?? FALLBACK_HEX
  }

  // 背景色の輝度に応じてラベルの文字色を白／黒で切替
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

  // ===== PCCS vトーン円の配置 =====
  // 例: "10RP 4/13.5" → "10RP" → 外側 idx 99
  function munsellHueToOuterIdx(hueStr: string): number | null {
    const match = /^(\d+)([A-Z]+)$/.exec(hueStr)
    if (!match) return null
    const num = Number(match[1])
    const famIdx = (MUNSELL_HUE_FAMILIES as readonly string[]).indexOf(match[2])
    if (famIdx < 0 || num < 1 || num > 10) return null
    return famIdx * 10 + (num - 1)
  }

  type PccsDot = {
    notation: string
    hex: string
    symbol: string
    /** 対応する Munsell 外側色相 idx（0..99） */
    hueIdx: number
    /** 角丸正方形 = ラベルの中心 */
    cx: number
    cy: number
  }

  const R_PCCS_DOT = R_OUTER_OUTER + PCCS_DOT_GAP + PCCS_DOT_RADIUS

  function buildPccsDots(): PccsDot[] {
    const byIdx = new Map(outerNodes.map((n) => [n.hueIndex, n]))
    const dots: PccsDot[] = []
    // 配置位置は v トーン側に揃った Munsell データを利用し、表示色のみ b トーンに差し替える
    for (const c of PCCS_V24) {
      if (!c.munsell || c.hueNumber === null) continue
      const huePart = c.munsell.split(/\s+/)[0]
      const idx = munsellHueToOuterIdx(huePart)
      if (idx === null) continue
      const node = byIdx.get(idx)
      if (!node) continue
      const bNotation = `b${c.hueNumber}`
      const hex = PCCS_HEX_MAP.get(bNotation)
      if (!hex) continue
      const symbol = PCCS_HUE_MAP.get(c.hueNumber)?.symbol ?? `${c.hueNumber}`
      const [cx, cy] = pointAt(node.midAngleDeg, R_PCCS_DOT)
      dots.push({
        notation: bNotation,
        hex,
        symbol,
        hueIdx: idx,
        cx,
        cy
      })
    }
    return dots
  }

  const pccsDots = buildPccsDots()

  // PCCS 対応のある外側色相 idx 集合（外側ラベル絞り込み用）
  const pccsOuterIdxSet = new Set(pccsDots.map((d) => d.hueIdx))
  const labeledOuterNodes = outerNodes.filter((n) => pccsOuterIdxSet.has(n.hueIndex))

  // ===== ViewBox =====
  const PADDING = 4
  const VB_R = R_PCCS_DOT + PCCS_DOT_RADIUS + PADDING
  const viewBox = `${CX - VB_R} ${CY - VB_R} ${2 * VB_R} ${2 * VB_R}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <!-- 内側 20 色相 + 外側 100 色相のセグメント。PCCS 対応のない外側は薄く表示 -->
  <!-- d3.arc は原点中心にパスを生成するので translate で中心を揃える -->
  <g transform="translate({CX} {CY})">
    {#each drawNodes as node (node.key)}
      <path
        d={node.path}
        fill={node.color}
        stroke={STROKE_COLOR}
        stroke-width={STROKE_WIDTH}
        opacity={node.depth === 2 && !pccsOuterIdxSet.has(node.hueIndex) ? FADED_OPACITY : 1}
      />
    {/each}
  </g>

  <!-- 外側ラベル（PCCS 対応のある色相のみ、外周寄りに配置） -->
  {#each labeledOuterNodes as node (node.key)}
    {@const [lx, ly] = pointAt(node.midAngleDeg, R_OUTER_LABEL)}
    <text
      x={lx}
      y={ly}
      font-size={FONT_SIZE_OUTER}
      fill="#fff"
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
      fill="#fff"
      text-anchor="middle"
      dominant-baseline="central"
      transform="rotate({labelRotation(node.midAngleDeg)} {lx} {ly})"
    >
      {node.label}
    </text>
  {/each}

  <!-- PCCS bトーン 24色（角丸正方形、対応する Munsell 色相位置に配置） -->
  {#each pccsDots as dot (dot.notation)}
    <rect
      x={dot.cx - PCCS_DOT_RADIUS}
      y={dot.cy - PCCS_DOT_RADIUS}
      width={PCCS_DOT_RADIUS * 2}
      height={PCCS_DOT_RADIUS * 2}
      rx={PCCS_SQUARE_CORNER}
      ry={PCCS_SQUARE_CORNER}
      fill={dot.hex}
    />
  {/each}

  <!-- PCCS色相記号ラベル（角丸正方形の中央に配置、回転無し） -->
  {#each pccsDots as dot (`${dot.notation}-label`)}
    <text
      x={dot.cx}
      y={dot.cy}
      font-size={PCCS_LABEL_FONT_SIZE}
      font-weight="600"
      fill={textColorOn(dot.hex)}
      text-anchor="middle"
      dominant-baseline="central"
    >
      {dot.symbol}
    </text>
  {/each}
</svg>
