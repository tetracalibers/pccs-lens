<script lang="ts">
  import { PCCS_HEX_MAP, PCCS_ALL_MAP } from "$lib/data/pccs"

  let {
    leftColor = "v2",
    rightColor = "d14"
  }: {
    /** 左ウイングの v セルを塗りつぶす色（PCCS表記） */
    leftColor?: string
    /** 右ウイングの v セルを塗りつぶす色（PCCS表記） */
    rightColor?: string
  } = $props()

  type ToneCell = {
    id: string
    label: string
    cx: number
    cy: number
  }

  // ===== セルレイアウト定数 =====
  const SQ = 36
  const VGAP = 4
  const S = SQ + VGAP // 列内のセル中心間の縦距離
  const COL_GAP_ACH = 20 // 無彩色列と有彩色1列目の隙間
  const COL_GAP = 4 // 有彩色列同士の隙間
  const INNER_PAD = 10 // セル群と輪郭線の間の余白

  // ===== 矢印定数 =====
  const ARROW_OFFSET = 3 // セル端から矢印開始点までの距離
  const ARROW_LENGTH = 50
  const VIEWBOX_MARGIN = 4 // viewBox外周の余白

  // ===== 線幅 =====
  const OUTLINE_STROKE_WIDTH = 1.5
  const DIVIDER_STROKE_WIDTH = 1.2
  const ARROW_STROKE_WIDTH = 2.5
  const CELL_STROKE_WIDTH = 1

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 20 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色 =====
  const COL_OUTLINE = "var(--color-body)"
  const COL_DIVIDER = "var(--color-body)"
  const COL_ARROW = "var(--canvas-pen-pink)"

  // ===== 列間距離 =====
  const D_ACH = SQ + COL_GAP_ACH // 無彩色列中心 → 有彩色1列目中心
  const D_COL = SQ + COL_GAP // 有彩色列同士の中心間距離

  // ===== 縦方向 =====
  const Y0 = INNER_PAD + SQ / 2 // 無彩色列先頭セルの中心Y

  // ===== 輪郭線（両端が半円のスタジアム形）と中央無彩色軸のX =====
  // 中央（無彩色軸）から右端 v セルの右辺までの距離
  const HW_CELL = D_ACH + 3 * D_COL + SQ / 2
  const X_ACH = HW_CELL + INNER_PAD // 無彩色軸のX（左端輪郭を0に合わせる）

  const OUTLINE_LEFT = X_ACH - HW_CELL - INNER_PAD
  const OUTLINE_RIGHT = X_ACH + HW_CELL + INNER_PAD
  const OUTLINE_TOP = 0
  const OUTLINE_H = 2 * INNER_PAD + 4 * S + SQ
  const OUTLINE_BOTTOM = OUTLINE_H
  const CAP_R = OUTLINE_H / 2
  const X_LEFT_C = OUTLINE_LEFT + CAP_R // 左半円の中心X
  const X_RIGHT_C = OUTLINE_RIGHT - CAP_R // 右半円の中心X

  // 上辺 → 右半円 → 下辺 → 左半円 のスタジアム輪郭
  const outlinePath = `M ${X_LEFT_C} ${OUTLINE_TOP} L ${X_RIGHT_C} ${OUTLINE_TOP} A ${CAP_R} ${CAP_R} 0 0 1 ${X_RIGHT_C} ${OUTLINE_BOTTOM} L ${X_LEFT_C} ${OUTLINE_BOTTOM} A ${CAP_R} ${CAP_R} 0 0 1 ${X_LEFT_C} ${OUTLINE_TOP} Z`

  // ===== 仕切り線X座標（無彩色列と有彩色列の中間・左右） =====
  const DIVIDER_R_X = X_ACH + SQ / 2 + COL_GAP_ACH / 2
  const DIVIDER_L_X = X_ACH - SQ / 2 - COL_GAP_ACH / 2

  // ===== セル定義 =====
  // 中央の無彩色列（上から白→黒）
  const ACH: [string, number][] = [
    ["W", 0],
    ["ltGy", 1],
    ["mGy", 2],
    ["dkGy", 3],
    ["Bk", 4]
  ]
  // 有彩色ウイング（無彩色軸から外側へ。彩度対比のトーン図と同じ配置）
  const WING: { dcol: number; cells: [string, number][] }[] = [
    {
      dcol: 0,
      cells: [
        ["p", 0.5],
        ["ltg", 1.5],
        ["g", 2.5],
        ["dkg", 3.5]
      ]
    },
    {
      dcol: 1,
      cells: [
        ["lt", 0.5],
        ["sf", 1.5],
        ["d", 2.5],
        ["dk", 3.5]
      ]
    },
    {
      dcol: 2,
      cells: [
        ["b", 1],
        ["s", 2],
        ["dp", 3]
      ]
    },
    { dcol: 3, cells: [["v", 2]] }
  ]

  function buildCells(): ToneCell[] {
    const out: ToneCell[] = []
    // 中央：無彩色列
    for (const [label, i] of ACH) {
      out.push({ id: `C-${label}`, label, cx: X_ACH, cy: Y0 + S * i })
    }
    // 右ウイング(+1)・左ウイング(-1)。左は無彩色軸を挟んで左右反転
    for (const side of [1, -1]) {
      const prefix = side === 1 ? "R" : "L"
      for (const col of WING) {
        const cx = X_ACH + side * (D_ACH + col.dcol * D_COL)
        for (const [label, i] of col.cells) {
          out.push({ id: `${prefix}-${label}`, label, cx, cy: Y0 + S * i })
        }
      }
    }
    return out
  }
  const CELLS = buildCells()

  // 塗りつぶすセルを色のPCCSトーンから求める（Propsの色に位置ごと連動する）
  // 有彩色は該当ウイングのトーンセル、無彩色は中央の無彩色セルを対象にする
  function findWingCell(notation: string, prefix: "L" | "R"): ToneCell | undefined {
    const c = PCCS_ALL_MAP.get(notation)
    if (!c) return undefined
    const id = c.isNeutral ? `C-${c.achromaticBucket}` : `${prefix}-${c.toneSymbol}`
    return CELLS.find((cell) => cell.id === id)
  }

  const leftCell = $derived(findWingCell(leftColor, "L"))
  const rightCell = $derived(findWingCell(rightColor, "R"))

  const leftHex = $derived(PCCS_HEX_MAP.get(leftColor) ?? "#000000")
  const rightHex = $derived(PCCS_HEX_MAP.get(rightColor) ?? "#000000")

  // ===== 矢印（右の塗りつぶしセル → v14 方向に右へ） =====
  // rightColor が v トーン（最も鮮やか）のときは向かう先がないので矢印を出さない
  const arrow = $derived.by(() => {
    if (!rightCell) return null
    if (PCCS_ALL_MAP.get(rightColor)?.toneSymbol === "v") return null
    const startX = rightCell.cx + SQ / 2 + ARROW_OFFSET
    return { startX, endX: startX + ARROW_LENGTH, y: rightCell.cy }
  })

  // ===== viewBox（矢印が右端輪郭より外へ伸びる分まで含める） =====
  const viewBox = $derived.by(() => {
    let minX = OUTLINE_LEFT
    let maxX = OUTLINE_RIGHT
    if (arrow) {
      minX = Math.min(minX, arrow.startX, arrow.endX)
      maxX = Math.max(maxX, arrow.startX, arrow.endX)
    }
    const vbX = minX - VIEWBOX_MARGIN
    const vbY = OUTLINE_TOP - VIEWBOX_MARGIN
    const vbW = maxX - minX + 2 * VIEWBOX_MARGIN
    const vbH = OUTLINE_H + 2 * VIEWBOX_MARGIN
    return `${vbX} ${vbY} ${vbW} ${vbH}`
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <defs>
    <marker
      id="comp-contrast-arrow-end"
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

  <!-- スタジアム輪郭線（両端半円・無彩色軸を中央に共有） -->
  <path
    d={outlinePath}
    fill="none"
    stroke={COL_OUTLINE}
    stroke-width={OUTLINE_STROKE_WIDTH}
    stroke-linejoin="round"
  />

  <!-- 無彩色・有彩色の仕切り線（左右） -->
  <line
    x1={DIVIDER_L_X}
    y1={OUTLINE_TOP}
    x2={DIVIDER_L_X}
    y2={OUTLINE_BOTTOM}
    stroke={COL_DIVIDER}
    stroke-width={DIVIDER_STROKE_WIDTH}
  />
  <line
    x1={DIVIDER_R_X}
    y1={OUTLINE_TOP}
    x2={DIVIDER_R_X}
    y2={OUTLINE_BOTTOM}
    stroke={COL_DIVIDER}
    stroke-width={DIVIDER_STROKE_WIDTH}
  />

  <!-- トーンセルのグリッド -->
  {#each CELLS as cell (cell.id)}
    <rect
      x={cell.cx - SQ / 2}
      y={cell.cy - SQ / 2}
      width={SQ}
      height={SQ}
      fill="none"
      stroke={COL_OUTLINE}
      stroke-width={CELL_STROKE_WIDTH}
      opacity="0.3"
      rx="4"
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
      {cell.label}
    </text>
  {/each}

  <!-- 左ウイングの塗りつぶしセル（leftColor のトーン位置） -->
  {#if leftCell}
    <rect x={leftCell.cx - SQ / 2} y={leftCell.cy - SQ / 2} width={SQ} height={SQ} fill={leftHex} />
  {/if}

  <!-- 右ウイングの塗りつぶしセル（rightColor のトーン位置） -->
  {#if rightCell}
    <rect
      x={rightCell.cx - SQ / 2}
      y={rightCell.cy - SQ / 2}
      width={SQ}
      height={SQ}
      fill={rightHex}
    />
  {/if}

  <!-- 右の塗りつぶしセルから v14 方向（右）へ向かう矢印 -->
  {#if arrow}
    <line
      x1={arrow.startX}
      y1={arrow.y}
      x2={arrow.endX}
      y2={arrow.y}
      stroke={COL_ARROW}
      stroke-width={ARROW_STROKE_WIDTH}
      stroke-linecap="round"
      stroke-linejoin="round"
      marker-end="url(#comp-contrast-arrow-end)"
    />
  {/if}
</svg>
