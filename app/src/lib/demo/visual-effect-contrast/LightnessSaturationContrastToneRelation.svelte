<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP, PCCS_ALL_MAP } from "$lib/data/pccs"

  let {
    figure,
    ground,
    iconId
  }: {
    figure: string
    ground: string
    iconId: string
  } = $props()

  type ToneCell = {
    key: string
    cx: number
    cy: number
  }

  // ===== セルレイアウト定数 =====
  const SQ = 36
  const VGAP = 4
  const S = SQ + VGAP // Col0 セル中心間の縦距離
  const COL_GAP_ACH = 20 // 無彩色列と有彩色1列目の隙間
  const COL_GAP = 4 // 有彩色列同士の隙間
  const INNER_PAD = 10 // セル群と輪郭線の間の余白

  // ===== 矢印・ラベル定数 =====
  const ARROW_OFFSET = 8 // セル端から矢印開始点までの距離
  const ARROW_LENGTH = 50
  const LABEL_GAP = 8 // 矢印先端とラベル端の視覚的余白（全方向共通）
  const LABEL_FONT_SIZE = 16
  const VIEWBOX_MARGIN = 4 // viewBox外周の余白

  // ===== 線幅 =====
  const OUTLINE_STROKE_WIDTH = 1.5
  const DIVIDER_STROKE_WIDTH = 1.2
  const ARROW_STROKE_WIDTH = 2.5

  // ===== 矢の形状 =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 20 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色 =====
  const COL_OUTLINE = "var(--color-body)"
  const COL_DIVIDER = "var(--color-body)"
  const COL_ARROW = "var(--canvas-pen-pink)"
  const COL_LABEL = "var(--canvas-pen-pink)"

  // ===== セル中心座標 =====
  const X0 = INNER_PAD + SQ / 2
  const X1 = X0 + SQ + COL_GAP_ACH
  const X2 = X1 + SQ + COL_GAP
  const X3 = X2 + SQ + COL_GAP
  const X4 = X3 + SQ + COL_GAP
  const Y0 = INNER_PAD + SQ / 2

  // ===== 輪郭線（左フラット・右セミサークルのかまぼこ形） =====
  const OUTLINE_X = 0
  const OUTLINE_Y = 0
  const OUTLINE_W = 2 * INNER_PAD + (X4 - X0) + SQ
  const OUTLINE_H = 2 * INNER_PAD + 4 * S + SQ
  const OUTLINE_R = OUTLINE_H / 2

  // ===== 仕切り線X座標（無彩色列と有彩色列の中間） =====
  const DIVIDER_X = X0 + SQ / 2 + COL_GAP_ACH / 2

  // ===== セル定義 =====
  const CELLS: ToneCell[] = [
    { key: "W", cx: X0, cy: Y0 + S * 0 },
    { key: "ltGy", cx: X0, cy: Y0 + S * 1 },
    { key: "mGy", cx: X0, cy: Y0 + S * 2 },
    { key: "dkGy", cx: X0, cy: Y0 + S * 3 },
    { key: "Bk", cx: X0, cy: Y0 + S * 4 },
    { key: "p", cx: X1, cy: Y0 + S * 0.5 },
    { key: "ltg", cx: X1, cy: Y0 + S * 1.5 },
    { key: "g", cx: X1, cy: Y0 + S * 2.5 },
    { key: "dkg", cx: X1, cy: Y0 + S * 3.5 },
    { key: "lt", cx: X2, cy: Y0 + S * 0.5 },
    { key: "sf", cx: X2, cy: Y0 + S * 1.5 },
    { key: "d", cx: X2, cy: Y0 + S * 2.5 },
    { key: "dk", cx: X2, cy: Y0 + S * 3.5 },
    { key: "b", cx: X3, cy: Y0 + S * 1 },
    { key: "s", cx: X3, cy: Y0 + S * 2 },
    { key: "dp", cx: X3, cy: Y0 + S * 3 },
    { key: "v", cx: X4, cy: Y0 + S * 2 }
  ]

  function notationToCellKey(notation: string): string | null {
    const c = PCCS_ALL_MAP.get(notation)
    if (!c) return null
    return c.isNeutral ? c.achromaticBucket : c.toneSymbol
  }

  function findCell(key: string | null): ToneCell | undefined {
    if (!key) return undefined
    return CELLS.find((c) => c.key === key)
  }

  const figureHex = $derived(PCCS_HEX_MAP.get(figure) ?? "#000000")
  const groundHex = $derived(PCCS_HEX_MAP.get(ground) ?? "#ffffff")
  const figureCell = $derived(findCell(notationToCellKey(figure)))
  const groundCell = $derived(findCell(notationToCellKey(ground)))

  // ===== 矢印仕様 =====
  type LabelAnchor = "middle" | "start" | "end"
  type LabelBaseline = "central" | "hanging"
  type ArrowSpec = {
    label: string
    line: { x1: number; y1: number; x2: number; y2: number }
    labelPos: { x: number; y: number; anchor: LabelAnchor; baseline: LabelBaseline }
  }

  function computeArrow(fig: ToneCell, gnd: ToneCell): ArrowSpec | null {
    if (fig.cx === gnd.cx && fig.cy !== gnd.cy) {
      // 縦に並ぶ
      if (fig.cy < gnd.cy) {
        // 図が上 → 上向き矢印（central: テキスト中心が y）
        const startY = fig.cy - SQ / 2 - ARROW_OFFSET
        const endY = startY - ARROW_LENGTH
        return {
          label: "明るく見える",
          line: { x1: fig.cx, y1: startY, x2: fig.cx, y2: endY },
          labelPos: {
            x: fig.cx,
            y: endY - LABEL_GAP - LABEL_FONT_SIZE / 2,
            anchor: "middle",
            baseline: "central"
          }
        }
      }
      // 図が下 → 下向き矢印（hanging: テキスト上端が y）
      const startY = fig.cy + SQ / 2 + ARROW_OFFSET
      const endY = startY + ARROW_LENGTH
      return {
        label: "暗く見える",
        line: { x1: fig.cx, y1: startY, x2: fig.cx, y2: endY },
        labelPos: {
          x: fig.cx,
          y: endY + LABEL_GAP + LABEL_FONT_SIZE / 2,
          anchor: "middle",
          baseline: "hanging"
        }
      }
    }
    if (fig.cy === gnd.cy && fig.cx !== gnd.cx) {
      // 横に並ぶ
      if (fig.cx > gnd.cx) {
        // 図が右 → 右向き矢印
        const startX = fig.cx + SQ / 2 + ARROW_OFFSET
        const endX = startX + ARROW_LENGTH
        return {
          label: "鮮やかに見える",
          line: { x1: startX, y1: fig.cy, x2: endX, y2: fig.cy },
          labelPos: { x: endX + LABEL_GAP, y: fig.cy, anchor: "start", baseline: "central" }
        }
      }
      // 図が左 → 左向き矢印
      const startX = fig.cx - SQ / 2 - ARROW_OFFSET
      const endX = startX - ARROW_LENGTH
      return {
        label: "くすんで見える",
        line: { x1: startX, y1: fig.cy, x2: endX, y2: fig.cy },
        labelPos: { x: endX - LABEL_GAP, y: fig.cy, anchor: "end", baseline: "central" }
      }
    }
    return null
  }

  const arrow = $derived(figureCell && groundCell ? computeArrow(figureCell, groundCell) : null)

  // 輪郭線パス：左辺直線 + 右側半円
  const outlinePath = `M ${OUTLINE_X} ${OUTLINE_Y} L ${OUTLINE_X + OUTLINE_W - OUTLINE_R} ${OUTLINE_Y} A ${OUTLINE_R} ${OUTLINE_R} 0 0 1 ${OUTLINE_X + OUTLINE_W - OUTLINE_R} ${OUTLINE_Y + OUTLINE_H} L ${OUTLINE_X} ${OUTLINE_Y + OUTLINE_H} Z`

  // ===== viewBox（実コンテンツにフィットさせる） =====
  const viewBox = $derived.by(() => {
    let minX = OUTLINE_X
    let maxX = OUTLINE_X + OUTLINE_W
    let minY = OUTLINE_Y
    let maxY = OUTLINE_Y + OUTLINE_H

    if (arrow) {
      minX = Math.min(minX, arrow.line.x1, arrow.line.x2)
      maxX = Math.max(maxX, arrow.line.x1, arrow.line.x2)
      minY = Math.min(minY, arrow.line.y1, arrow.line.y2)
      maxY = Math.max(maxY, arrow.line.y1, arrow.line.y2)

      // ラベル境界（日本語想定で 1 文字 ≒ font-size 幅）
      const labelWidth = arrow.label.length * LABEL_FONT_SIZE
      const labelHalfHeight = LABEL_FONT_SIZE / 2 + 2
      const lp = arrow.labelPos
      const lbMinX =
        lp.anchor === "middle"
          ? lp.x - labelWidth / 2
          : lp.anchor === "start"
            ? lp.x
            : lp.x - labelWidth
      const lbMaxX =
        lp.anchor === "middle"
          ? lp.x + labelWidth / 2
          : lp.anchor === "start"
            ? lp.x + labelWidth
            : lp.x
      minX = Math.min(minX, lbMinX)
      maxX = Math.max(maxX, lbMaxX)
      minY = Math.min(minY, lp.y - labelHalfHeight)
      maxY = Math.max(maxY, lp.y + labelHalfHeight)
    }

    const x = minX - VIEWBOX_MARGIN
    const y = minY - VIEWBOX_MARGIN
    const w = maxX - minX + 2 * VIEWBOX_MARGIN
    const h = maxY - minY + 2 * VIEWBOX_MARGIN
    return `${x} ${y} ${w} ${h}`
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <defs>
    <marker
      id="contrast-arrow-end"
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
        stroke={COL_ARROW}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- かまぼこ輪郭線 -->
  <path
    d={outlinePath}
    fill="none"
    stroke={COL_OUTLINE}
    stroke-width={OUTLINE_STROKE_WIDTH}
    stroke-linejoin="round"
  />

  <!-- 無彩色・有彩色の仕切り線 -->
  <line
    x1={DIVIDER_X}
    y1={OUTLINE_Y}
    x2={DIVIDER_X}
    y2={OUTLINE_Y + OUTLINE_H}
    stroke={COL_DIVIDER}
    stroke-width={DIVIDER_STROKE_WIDTH}
  />

  <!-- DEBUG: 全セルを薄く表示 -->
  {#each CELLS as cell (cell.key)}
    <rect
      x={cell.cx - SQ / 2}
      y={cell.cy - SQ / 2}
      width={SQ}
      height={SQ}
      fill="none"
      stroke={COL_OUTLINE}
      stroke-width="1"
      opacity="0.3"
    />
    <text
      x={cell.cx}
      y={cell.cy}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      fill={COL_OUTLINE}
      opacity="0.5"
    >
      {cell.key}
    </text>
  {/each}

  {#if groundCell}
    <rect
      x={groundCell.cx - SQ / 2}
      y={groundCell.cy - SQ / 2}
      width={SQ}
      height={SQ}
      fill={groundHex}
    />
  {/if}

  {#if figureCell}
    <foreignObject x={figureCell.cx - SQ / 2} y={figureCell.cy - SQ / 2} width={SQ} height={SQ}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {figureHex}; display: grid; place-items: center;"
      >
        <Icon icon={iconId} width={SQ} height={SQ} />
      </div>
    </foreignObject>
  {/if}

  {#if arrow}
    <line
      x1={arrow.line.x1}
      y1={arrow.line.y1}
      x2={arrow.line.x2}
      y2={arrow.line.y2}
      stroke={COL_ARROW}
      stroke-width={ARROW_STROKE_WIDTH}
      stroke-linecap="round"
      stroke-linejoin="round"
      marker-end="url(#contrast-arrow-end)"
    />
    <text
      x={arrow.labelPos.x}
      y={arrow.labelPos.y}
      text-anchor={arrow.labelPos.anchor}
      dominant-baseline={arrow.labelPos.baseline}
      font-size={LABEL_FONT_SIZE}
      font-weight="bold"
      fill={COL_LABEL}
    >
      {arrow.label}
    </text>
  {/if}
</svg>
