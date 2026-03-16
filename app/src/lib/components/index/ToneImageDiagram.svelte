<script lang="ts">
  import { SvelteMap } from "svelte/reactivity"
  import colorsFullData from "$lib/data/pccs_colors_full.json"
  import toneData from "$lib/data/pccs_tone.json"

  // --- セルサイズ定数 ---
  const PIE_OUTER_R = 36
  const PIE_INNER_R = 15
  const LABEL_R = 44
  const CELL_R = 50
  const RECT_W = 90
  const RECT_H = 60
  const ROW_STEP = 108
  const COL_GAP = 14
  const COL_GAP_ACH = 20

  // --- 軸用パディング ---
  const AXIS_PAD = 52
  const PAD = 8

  // --- 座標導出 ---
  const X0 = PAD + RECT_W / 2
  const X1 = X0 + RECT_W / 2 + COL_GAP_ACH + CELL_R
  const X2 = X1 + 2 * CELL_R + COL_GAP
  const X3 = X2 + 2 * CELL_R + COL_GAP
  const X4 = X3 + 2 * CELL_R + COL_GAP
  const Y0 = PAD + RECT_H / 2
  const S = ROW_STEP

  // オフセット（縦軸用余白を左に確保）
  const OX = AXIS_PAD
  const OY = 0

  const CELLS_SVG_W = Math.ceil(X4 + CELL_R + PAD)
  const CELLS_SVG_H = Math.ceil(Y0 + 4 * S + RECT_H / 2 + PAD)
  const SVG_W = CELLS_SVG_W + AXIS_PAD
  const SVG_H = CELLS_SVG_H + AXIS_PAD

  type ToneCell = {
    key: string
    toneSymbol: string
    cx: number
    cy: number
    shape: "circle" | "square"
  }

  const CELLS: ToneCell[] = [
    { key: "W", toneSymbol: "W", cx: OX + X0, cy: OY + Y0 + S * 0, shape: "square" },
    { key: "ltGy", toneSymbol: "Gy", cx: OX + X0, cy: OY + Y0 + S * 1, shape: "square" },
    { key: "mGy", toneSymbol: "Gy", cx: OX + X0, cy: OY + Y0 + S * 2, shape: "square" },
    { key: "dkGy", toneSymbol: "Gy", cx: OX + X0, cy: OY + Y0 + S * 3, shape: "square" },
    { key: "Bk", toneSymbol: "Bk", cx: OX + X0, cy: OY + Y0 + S * 4, shape: "square" },
    { key: "p", toneSymbol: "p", cx: OX + X1, cy: OY + Y0 + S * 0.5, shape: "circle" },
    { key: "ltg", toneSymbol: "ltg", cx: OX + X1, cy: OY + Y0 + S * 1.5, shape: "circle" },
    { key: "g", toneSymbol: "g", cx: OX + X1, cy: OY + Y0 + S * 2.5, shape: "circle" },
    { key: "dkg", toneSymbol: "dkg", cx: OX + X1, cy: OY + Y0 + S * 3.5, shape: "circle" },
    { key: "lt", toneSymbol: "lt", cx: OX + X2, cy: OY + Y0 + S * 0.5, shape: "circle" },
    { key: "sf", toneSymbol: "sf", cx: OX + X2, cy: OY + Y0 + S * 1.5, shape: "circle" },
    { key: "d", toneSymbol: "d", cx: OX + X2, cy: OY + Y0 + S * 2.5, shape: "circle" },
    { key: "dk", toneSymbol: "dk", cx: OX + X2, cy: OY + Y0 + S * 3.5, shape: "circle" },
    { key: "b", toneSymbol: "b", cx: OX + X3, cy: OY + Y0 + S * 1, shape: "circle" },
    { key: "s", toneSymbol: "s", cx: OX + X3, cy: OY + Y0 + S * 2, shape: "circle" },
    { key: "dp", toneSymbol: "dp", cx: OX + X3, cy: OY + Y0 + S * 3, shape: "circle" },
    { key: "v", toneSymbol: "v", cx: OX + X4, cy: OY + Y0 + S * 2, shape: "circle" }
  ]

  // 偶数色相番号 (2, 4, ..., 24)
  const EVEN_HUES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
  const UPPER_HUES = [2, 4, 6, 8, 10, 12]
  const LOWER_HUES = [14, 16, 18, 20, 22, 24]

  // toneSymbol × hueNumber → hex のマップ
  const colorMap = new SvelteMap<string, string>()
  for (const c of colorsFullData) {
    if (c.toneSymbol && c.hueNumber) {
      colorMap.set(`${c.toneSymbol}:${c.hueNumber}`, c.hex)
    }
  }

  // トーン情報 map
  const toneMap = new SvelteMap(toneData.map((t) => [t.toneSymbol, t]))

  // 無彩色の背景色
  const ACHROMATIC_BG: Record<string, string> = {
    W: "#f1f1f1",
    ltGy: "#D0D0D0",
    mGy: "#797979",
    dkGy: "#4A4A4A",
    Bk: "#252525"
  }

  function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
  }

  // SVG パイスライスパスを生成
  function pieSlicePath(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startDeg: number,
    endDeg: number
  ): string {
    const toRad = (d: number) => (d * Math.PI) / 180
    const sx = cx + outerR * Math.cos(toRad(startDeg))
    const sy = cy + outerR * Math.sin(toRad(startDeg))
    const ex = cx + outerR * Math.cos(toRad(endDeg))
    const ey = cy + outerR * Math.sin(toRad(endDeg))
    const ix = cx + innerR * Math.cos(toRad(endDeg))
    const iy = cy + innerR * Math.sin(toRad(endDeg))
    const ix2 = cx + innerR * Math.cos(toRad(startDeg))
    const iy2 = cy + innerR * Math.sin(toRad(startDeg))
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return [
      `M ${sx} ${sy}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ex} ${ey}`,
      `L ${ix} ${iy}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      `Z`
    ].join(" ")
  }

  // ラベル座標
  function labelPos(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  // ツールチップ
  // ToneSelector と同様に、インスタンスごとにユニークなアンカー名を生成
  const instanceId = Math.random().toString(36).slice(2, 8)
  const ANCHOR_NAME = `--tone-diagram-${instanceId}`

  let activeCellKey = $state<string | null>(null)
  let tooltipEl: HTMLDivElement | null = $state(null)

  // 現在アクティブなセル（アンカースパン描画用）
  const activeCell = $derived(
    activeCellKey ? (CELLS.find((c) => c.key === activeCellKey) ?? null) : null
  )

  function openTooltip(cell: ToneCell) {
    activeCellKey = cell.key
    tooltipEl?.showPopover()
  }

  function closeTooltip() {
    tooltipEl?.hidePopover()
  }

  // feelings タグの背景色: トーンの偶数色相を均等に振り分ける
  function feelingColor(toneSymbol: string, index: number, total: number): string {
    if (["W", "Gy", "Bk"].includes(toneSymbol)) return ""
    const hueIndex = total <= 1 ? 0 : Math.round((index / (total - 1)) * 11)
    return colorMap.get(`${toneSymbol}:${EVEN_HUES[hueIndex]}`) ?? "#ddd"
  }

  const isAchromatic = (sym: string) => ["W", "Gy", "Bk"].includes(sym)

  // SVG viewBox 座標 → wrapper パーセンテージ変換
  // ToneSelector と同様に position:absolute スパンを % で配置し anchor-name を付与する
  function anchorLeft(cell: ToneCell): number {
    const x = cell.shape === "circle" ? cell.cx - CELL_R : cell.cx - RECT_W / 2
    return (x / SVG_W) * 100
  }
  function anchorTop(cell: ToneCell): number {
    const y = cell.shape === "circle" ? cell.cy - CELL_R : cell.cy - RECT_H / 2
    return (y / SVG_H) * 100
  }
  function anchorW(cell: ToneCell): number {
    return ((cell.shape === "circle" ? 2 * CELL_R : RECT_W) / SVG_W) * 100
  }
  function anchorH(cell: ToneCell): number {
    return ((cell.shape === "circle" ? 2 * CELL_R : RECT_H) / SVG_H) * 100
  }

  // セル群の境界座標
  const CELLS_LEFT = OX + X0 - RECT_W / 2
  const CELLS_RIGHT = OX + X4 + CELL_R
  const CELLS_TOP = OY + Y0 - RECT_H / 2
  const CELLS_BOTTOM = OY + Y0 + 4 * S + RECT_H / 2

  // --- 軸レイアウト定数 ---
  const AXIS_GAP = 16 // セル境界 ↔ 軸線の隙間
  const H_LABEL_GAP = 26 // 横軸線からラベルまでの距離（下方向）
  const V_TITLE_OFFSET = 26 // 縦軸線から「明度」タイトル中心までの距離（左方向）

  // 軸線座標
  const H_AXIS_Y = CELLS_BOTTOM + AXIS_GAP
  const H_AXIS_X1 = CELLS_LEFT
  const H_AXIS_X2 = CELLS_RIGHT

  const V_AXIS_X = CELLS_LEFT - AXIS_GAP
  const V_AXIS_Y1 = CELLS_BOTTOM
  const V_AXIS_Y2 = CELLS_TOP

  // ラベル座標
  const H_LABEL_Y = H_AXIS_Y + H_LABEL_GAP
  const V_TITLE_X = V_AXIS_X - V_TITLE_OFFSET
</script>

<div class="diagram-wrapper">
  <svg viewBox="0 0 {SVG_W} {SVG_H}" role="img" aria-label="PCCSトーン概念図">
    <defs>
      <marker
        id="arr-axis-img"
        markerWidth="12"
        markerHeight="12"
        refX="10"
        refY="5.8"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <polyline points="0,0 10,5.8 0,11.6" fill="none" stroke="#aaa" stroke-width="1.5" />
      </marker>
    </defs>

    <!-- 横軸（彩度） -->
    <line
      x1={H_AXIS_X1}
      y1={H_AXIS_Y}
      x2={H_AXIS_X2}
      y2={H_AXIS_Y}
      stroke="#aaa"
      stroke-width="1.5"
      marker-end="url(#arr-axis-img)"
    />
    <text x={(H_AXIS_X1 + H_AXIS_X2) / 2} y={H_LABEL_Y} text-anchor="middle" font-size="14" fill="#aaa">
      彩度
    </text>

    <!-- 縦軸（明度） -->
    <line
      x1={V_AXIS_X}
      y1={V_AXIS_Y1}
      x2={V_AXIS_X}
      y2={V_AXIS_Y2}
      stroke="#aaa"
      stroke-width="1.5"
      marker-end="url(#arr-axis-img)"
    />
    <text x={V_TITLE_X} y={(V_AXIS_Y1 + V_AXIS_Y2) / 2} text-anchor="middle" font-size="14" fill="#aaa">
      明度
    </text>

    <!-- トーンセル -->
    {#each CELLS as cell (cell.key)}
      {@const tone = toneMap.get(cell.toneSymbol)}
      <g
        data-tone-cell
        role="button"
        aria-label={tone ? `${cell.key}トーンの詳細を表示` : cell.key}
        aria-expanded={activeCellKey === cell.key}
        aria-controls="tone-tooltip"
        tabindex="0"
        style="cursor: pointer;"
        onclick={() => openTooltip(cell)}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") openTooltip(cell)
        }}
      >
        {#if cell.shape === "circle"}
          <!-- ドーナツ型パイチャート -->
          {#each EVEN_HUES as hue, i (hue)}
            {@const startDeg = -195 + i * 30}
            {@const endDeg = -195 + (i + 1) * 30}
            {@const hex = colorMap.get(`${cell.toneSymbol}:${hue}`) ?? "#ddd"}
            <circle cx={cell.cx} cy={cell.cy} r={PIE_INNER_R} fill="#fff" />
            <path
              d={pieSlicePath(cell.cx, cell.cy, PIE_INNER_R, PIE_OUTER_R, startDeg, endDeg)}
              fill={hex}
              stroke="white"
              stroke-width="0.5"
            />
          {/each}
          <!-- 外周の色相番号ラベル -->
          {#each EVEN_HUES as hue, i (hue)}
            {@const midDeg = -195 + i * 30 + 15}
            {@const pos = labelPos(cell.cx, cell.cy, LABEL_R, midDeg)}
            <text
              x={pos.x}
              y={pos.y}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="8"
              fill="#555"
              style="pointer-events: none; user-select: none;"
            >
              {hue}
            </text>
          {/each}
          <!-- 中央テキスト -->
          <text
            x={cell.cx}
            y={cell.cy}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-weight="bold"
            font-size="11"
            fill="#333"
            style="pointer-events: none; user-select: none;"
          >
            {cell.toneSymbol}
          </text>
        {:else}
          <!-- 無彩色セル（矩形） -->
          {@const bg = ACHROMATIC_BG[cell.key] ?? "#999"}
          {@const textColor = isLightColor(bg) ? "#333" : "#fff"}
          <rect
            x={cell.cx - RECT_W / 2}
            y={cell.cy - RECT_H / 2}
            width={RECT_W}
            height={RECT_H}
            fill={bg}
            stroke="#ccc"
            stroke-width="1"
          />
          <text
            x={cell.cx}
            y={cell.cy}
            text-anchor="middle"
            dominant-baseline="central"
            font-family="var(--font-mono)"
            font-weight="bold"
            font-size="13"
            fill={textColor}
            style="pointer-events: none; user-select: none;"
          >
            {cell.toneSymbol === "Gy" ? cell.key : cell.toneSymbol}
          </text>
        {/if}
      </g>
    {/each}
  </svg>

  <!--
    SVG <g> は anchor-name 非対応のため、ToneSelector と同様に
    アクティブなセルに重なる不可視 HTML スパンを % 座標で絶対配置し anchor-name を付与する
  -->
  {#if activeCell}
    <span
      class="cell-anchor"
      style="
        left: {anchorLeft(activeCell)}%;
        top: {anchorTop(activeCell)}%;
        width: {anchorW(activeCell)}%;
        height: {anchorH(activeCell)}%;
        anchor-name: {ANCHOR_NAME};
      "
    ></span>
  {/if}
</div>

<!-- ツールチップ（diagram-wrapper の外に配置して fixed が効くようにする） -->
<!-- popover="auto" により Escape・外側クリックの閉じる処理はブラウザが自動処理 -->
<div
  class="tone-tooltip"
  style="position-anchor: {ANCHOR_NAME};"
  bind:this={tooltipEl}
  role="tooltip"
  id="tone-tooltip"
  popover="auto"
  ontoggle={(e) => {
    if ((e as ToggleEvent).newState === "closed") activeCellKey = null
  }}
>
  {#if activeCell}
    {@const tone = toneMap.get(activeCell.toneSymbol)}
    {#if tone}
      <button class="tooltip-close" onclick={closeTooltip} aria-label="閉じる">×</button>

      <!-- 上部スウォッチ（色相 2〜12） -->
      {#if !isAchromatic(activeCell.toneSymbol)}
        <div class="swatches-row" aria-hidden="true">
          {#each UPPER_HUES as hue (hue)}
            {@const hex = colorMap.get(`${activeCell.toneSymbol}:${hue}`) ?? "#ddd"}
            <div
              class="swatch"
              style="background: {hex}"
              title="{activeCell.toneSymbol}{hue}"
            ></div>
          {/each}
        </div>
      {:else}
        <div class="swatches-row" aria-hidden="true">
          <div
            class="swatch"
            style="background: {ACHROMATIC_BG[activeCell.key] ?? '#999'}; height: 30px;"
            title={activeCell.toneSymbol}
          ></div>
        </div>
      {/if}

      <!-- トーン名 -->
      <h2 class="tooltip-tone-name">
        {tone.toneNameEn}
      </h2>

      <!-- feelings タグクラウド -->
      <div class="feelings-tags" aria-label="イメージワード">
        {#each tone.feelings as feeling, i (i)}
          {@const bg = feelingColor(activeCell.toneSymbol, i, tone.feelings.length)}
          <span
            class="feeling-tag"
            class:feeling-tag--plain={!bg}
            style={bg ? `background: ${bg}; color: ${isLightColor(bg) ? "#333" : "#fff"}` : ""}
          >
            {feeling}
          </span>
        {/each}
      </div>

      <!-- カテゴリ -->
      <ul class="categories" aria-label="カテゴリ">
        {#each tone.categories as cat (cat)}
          <li>{cat}</li>
        {/each}
      </ul>

      <!-- 下部スウォッチ（色相 14〜24） -->
      {#if !isAchromatic(activeCell.toneSymbol)}
        <div class="swatches-row" aria-hidden="true">
          {#each LOWER_HUES as hue (hue)}
            {@const hex = colorMap.get(`${activeCell.toneSymbol}:${hue}`) ?? "#ddd"}
            <div
              class="swatch"
              style="background: {hex}"
              title="{activeCell.toneSymbol}{hue}"
            ></div>
          {/each}
        </div>
      {:else}
        <div class="swatches-row" aria-hidden="true">
          <div
            class="swatch"
            style="background: {ACHROMATIC_BG[activeCell.key] ?? '#999'}; height: 30px;"
            title={activeCell.toneSymbol}
          ></div>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .diagram-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
    max-width: 640px;
  }

  svg {
    width: 100%;
    height: auto;
  }

  /*
   * SVG <g> は anchor-name 非対応のため、ToneSelector と同様に
   * SVG viewBox 座標をパーセンテージに変換して絶対配置した不可視スパンを使う。
   */
  .cell-anchor {
    position: absolute;
    pointer-events: none;
  }

  /*
   * CSS Anchor Positioning を使用。ToneSelector の .gray-subtone-tooltip と同パターン。
   * position-anchor はインラインスタイルで動的に設定する。
   * デフォルト：アンカーの右側に表示
   * フォールバック：右に収まらなければ左→下→上の順で試みる
   */
  .tone-tooltip {
    position: fixed;
    margin-block: 8px;
    position-area: bottom span-left;
    position-try: flip-block flip-inline;

    width: min(200px, 90vw);
    max-height: 80svh;
    overflow-y: auto;
    background: var(--color-surface, #fff);
    color: var(--color-text, #111);
    border: none;
    border-radius: 6px;
    padding: 1.5rem;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
    z-index: 200;
  }

  .tone-tooltip:popover-open {
    animation: tooltip-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @media (max-width: 640px) {
    .tone-tooltip {
      margin-inline: 8px;
      position-area: bottom span-left;
    }
  }

  @keyframes tooltip-in {
    from {
      scale: 0.85;
      opacity: 0;
    }
    to {
      scale: 1;
      opacity: 1;
    }
  }

  /* ---- 閉じるボタン ---- */
  .tooltip-close {
    position: absolute;
    top: 0;
    right: 0;
    background: none;
    border: none;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-text, #333);
  }

  .tooltip-close:hover {
    background: rgba(128, 128, 128, 0.15);
  }

  /* ---- スウォッチ行 ---- */
  .swatches-row {
    display: flex;
    gap: 4px;
    margin-bottom: 1rem;
  }
  .swatches-row:last-child {
    margin-bottom: 0;
  }

  .swatch {
    flex: 1;
    aspect-ratio: 1;
    border-radius: 6px;
  }

  /* ---- トーン名 ---- */
  .tooltip-tone-name {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: bold;
    margin: 0 0 0.75rem;
    padding-right: 2rem;
  }

  /* ---- feelings タグクラウド ---- */
  .feelings-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 0.75rem;
  }

  .feeling-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 0.7rem;
  }

  .feeling-tag--plain {
    background: var(--color-muted, #eee);
    color: var(--color-text, #333);
  }

  /* ---- カテゴリ ---- */
  .categories {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.5rem;
  }

  .categories li {
    font-size: 0.75rem;
    color: var(--color-text-muted, #777);
  }

  .categories li:not(:last-child)::after {
    content: "/";
    margin-left: 0.5rem;
  }
</style>
