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
  const ARROW_PAD_X = 130 // 横向き矢印のためのSVG左右パディング
  const ARROW_PAD_Y = 50 // 縦向き矢印のためのSVG上下パディング
  const ARROW_OFFSET = 8 // セル端から矢印開始点までの距離
  const ARROW_LENGTH = 50
  const LABEL_GAP = 6
  const LABEL_FONT_SIZE = 18

  // ===== 線幅 =====
  const OUTLINE_STROKE_WIDTH = 1.5
  const DIVIDER_STROKE_WIDTH = 1.2
  const ARROW_STROKE_WIDTH = 2

  // ===== 色 =====
  const COL_OUTLINE = "var(--color-body)"
  const COL_DIVIDER = "var(--color-body)"
  const COL_ARROW = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"

  // ===== セル中心座標 =====
  const X0 = ARROW_PAD_X + INNER_PAD + SQ / 2
  const X1 = X0 + SQ + COL_GAP_ACH
  const X2 = X1 + SQ + COL_GAP
  const X3 = X2 + SQ + COL_GAP
  const X4 = X3 + SQ + COL_GAP
  const Y0 = ARROW_PAD_Y + INNER_PAD + SQ / 2

  // ===== 輪郭線（左フラット・右セミサークルのかまぼこ形） =====
  const OUTLINE_X = ARROW_PAD_X
  const OUTLINE_Y = ARROW_PAD_Y
  const OUTLINE_W = 2 * INNER_PAD + (X4 - X0) + SQ
  const OUTLINE_H = 2 * INNER_PAD + 4 * S + SQ
  const OUTLINE_R = OUTLINE_H / 2

  // ===== 仕切り線X座標（無彩色列と有彩色列の中間） =====
  const DIVIDER_X = X0 + SQ / 2 + COL_GAP_ACH / 2

  // ===== SVGサイズ =====
  const SVG_W = OUTLINE_W + 2 * ARROW_PAD_X
  const SVG_H = OUTLINE_H + 2 * ARROW_PAD_Y

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
  type ArrowSpec = {
    label: string
    line: { x1: number; y1: number; x2: number; y2: number }
    labelPos: { x: number; y: number; anchor: "middle" | "start" | "end" }
  }

  function computeArrow(fig: ToneCell, gnd: ToneCell): ArrowSpec | null {
    if (fig.cx === gnd.cx && fig.cy !== gnd.cy) {
      // 縦に並ぶ
      if (fig.cy < gnd.cy) {
        // 図が上 → 上向き矢印
        const startY = fig.cy - SQ / 2 - ARROW_OFFSET
        const endY = startY - ARROW_LENGTH
        return {
          label: "明るく見える",
          line: { x1: fig.cx, y1: startY, x2: fig.cx, y2: endY },
          labelPos: { x: fig.cx, y: endY - LABEL_GAP, anchor: "middle" }
        }
      }
      // 図が下 → 下向き矢印
      const startY = fig.cy + SQ / 2 + ARROW_OFFSET
      const endY = startY + ARROW_LENGTH
      return {
        label: "暗く見える",
        line: { x1: fig.cx, y1: startY, x2: fig.cx, y2: endY },
        labelPos: { x: fig.cx, y: endY + LABEL_GAP + LABEL_FONT_SIZE, anchor: "middle" }
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
          labelPos: { x: endX + LABEL_GAP, y: fig.cy, anchor: "start" }
        }
      }
      // 図が左 → 左向き矢印
      const startX = fig.cx - SQ / 2 - ARROW_OFFSET
      const endX = startX - ARROW_LENGTH
      return {
        label: "くすんで見える",
        line: { x1: startX, y1: fig.cy, x2: endX, y2: fig.cy },
        labelPos: { x: endX - LABEL_GAP, y: fig.cy, anchor: "end" }
      }
    }
    return null
  }

  const arrow = $derived(figureCell && groundCell ? computeArrow(figureCell, groundCell) : null)

  // 輪郭線パス：左辺直線 + 右側半円
  const outlinePath = `M ${OUTLINE_X} ${OUTLINE_Y} L ${OUTLINE_X + OUTLINE_W - OUTLINE_R} ${OUTLINE_Y} A ${OUTLINE_R} ${OUTLINE_R} 0 0 1 ${OUTLINE_X + OUTLINE_W - OUTLINE_R} ${OUTLINE_Y + OUTLINE_H} L ${OUTLINE_X} ${OUTLINE_Y + OUTLINE_H} Z`
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}">
  <defs>
    <marker
      id="contrast-arrow-end"
      markerWidth="9"
      markerHeight="10"
      refX="8"
      refY="5"
      orient="auto"
    >
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COL_ARROW}
        stroke-width="1"
        stroke-linejoin="round"
        stroke-linecap="round"
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
      marker-end="url(#contrast-arrow-end)"
    />
    <text
      x={arrow.labelPos.x}
      y={arrow.labelPos.y}
      text-anchor={arrow.labelPos.anchor}
      dominant-baseline="middle"
      font-size={LABEL_FONT_SIZE}
      font-weight="bold"
      fill={COL_LABEL}
    >
      {arrow.label}
    </text>
  {/if}
</svg>
