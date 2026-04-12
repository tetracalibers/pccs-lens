<script lang="ts">
  import { PCCS_MAP } from "$lib/data/pccs"

  // ── Layout ────────────────────────────────────────────────────────────────
  const SVG_WIDTH = 1000

  // 上部セクション – スペクトルバー寸法
  const BAR_WIDTH = 375
  const BAR_HEIGHT = 60

  // W/Bk チップ（正方形、一辺 = BAR_HEIGHT）を先に定義し、バー x に反映
  const BTM_CHIP_SIZE = BAR_HEIGHT
  const BTM_CHIP_GAP = 8

  // 左列（RGB）: バーはチップ幅 + ギャップ分だけ右寄りにして下部と縦揃え
  const LEFT_BAR_X = BTM_CHIP_SIZE + BTM_CHIP_GAP // = 68
  const LEFT_LABEL_X = BTM_CHIP_SIZE / 2 // W チップ中心に縦揃え = 30

  // 右列（CMY）: バー左・ラベル右
  const RIGHT_BAR_X = SVG_WIDTH - LEFT_BAR_X - BAR_WIDTH // = 557
  const RIGHT_LABEL_X = RIGHT_BAR_X + BAR_WIDTH + BTM_CHIP_GAP + BTM_CHIP_SIZE / 2 // Bk チップ中心に縦揃え = 970

  // 中央列
  const MID_LEFT = LEFT_BAR_X + BAR_WIDTH // = 443
  const MID_RIGHT = RIGHT_BAR_X // = 557
  const MID_CENTER_X = (MID_LEFT + MID_RIGHT) / 2 // = 500

  // 矢印セクション（バー上部）
  const ARROW_TEXT_OFFSET = 20
  const GAP_TEXT_TO_LINE = 14
  const GAP_ARROW_TO_BAR = 18
  const ARROW_H = ARROW_TEXT_OFFSET + GAP_TEXT_TO_LINE + GAP_ARROW_TO_BAR // 52

  const ROW_HEIGHT = ARROW_H + BAR_HEIGHT // = 140
  const ROW_GAP = 28
  const PAD_TOP = 50 // 「補色の関係」ヘッダーの余白
  const PAD_BOTTOM = 28

  // ── Colors ────────────────────────────────────────────────────────────────
  const COLOR_ABSORB = "var(--canvas-pen-water)"
  const COLOR_REFLECT = "var(--canvas-pen-orange)"
  const COLOR_BAR_BORDER = "rgba(255,255,255,0.7)"
  const COLOR_LABEL_OUTLINE = "rgba(255,255,255,0.9)"
  const COLOR_CENTER = "#d04070"

  // ── Types ─────────────────────────────────────────────────────────────────
  type RegionKind = "absorb" | "reflect"

  interface Region {
    kind: RegionKind
    span: number
  }

  interface RowDef {
    leftLabel: string
    leftColor: string
    leftRegions: Region[]
    rightLabel: string
    rightColor: string
    rightRegions: Region[]
  }

  interface ResolvedRegion extends Region {
    localX: number
    absX: number
    width: number
    centerX: number
  }

  interface ClipRect {
    x: number
    width: number
  }

  // ── Row definitions ────────────────────────────────────────────────────────
  const rows: RowDef[] = [
    {
      leftLabel: "R",
      leftColor: PCCS_MAP.get("v3")!,
      leftRegions: [
        { kind: "absorb", span: 2 / 3 },
        { kind: "reflect", span: 1 / 3 }
      ],
      rightLabel: "C",
      rightColor: PCCS_MAP.get("v16")!,
      rightRegions: [
        { kind: "reflect", span: 2 / 3 },
        { kind: "absorb", span: 1 / 3 }
      ]
    },
    {
      leftLabel: "G",
      leftColor: PCCS_MAP.get("v12")!,
      leftRegions: [
        { kind: "absorb", span: 1 / 3 },
        { kind: "reflect", span: 1 / 3 },
        { kind: "absorb", span: 1 / 3 }
      ],
      rightLabel: "M",
      rightColor: PCCS_MAP.get("v24")!,
      rightRegions: [
        { kind: "reflect", span: 1 / 3 },
        { kind: "absorb", span: 1 / 3 },
        { kind: "reflect", span: 1 / 3 }
      ]
    },
    {
      leftLabel: "B",
      leftColor: PCCS_MAP.get("v19")!,
      leftRegions: [
        { kind: "reflect", span: 1 / 3 },
        { kind: "absorb", span: 2 / 3 }
      ],
      rightLabel: "Y",
      rightColor: PCCS_MAP.get("v8")!,
      rightRegions: [
        { kind: "absorb", span: 1 / 3 },
        { kind: "reflect", span: 2 / 3 }
      ]
    }
  ]

  // ── 高さの導出 ─────────────────────────────────────────────────────────────
  const TOP_H = PAD_TOP + rows.length * ROW_HEIGHT + (rows.length - 1) * ROW_GAP

  // 下部セクション
  const BTM_GAP = 52
  const BTM_Y = TOP_H + BTM_GAP
  const BTM_BAR_WIDTH = BAR_WIDTH // 上部バーと同じ幅
  const BTM_BAR_HEIGHT = BAR_HEIGHT
  const BTM_LABEL_GAP = 26 // ラベルテキストからバー上端までの距離

  const BTM_LABEL_Y = BTM_Y + 16 // ラベルテキストのベースライン
  const BTM_BAR_Y = BTM_Y + BTM_LABEL_GAP // バー上端

  // 上部バーと縦揃え（LEFT_BAR_X / RIGHT_BAR_X を共有）
  const BTM_LEFT_BAR_X = LEFT_BAR_X // = 68
  const BTM_LEFT_CHIP_X = LEFT_BAR_X - BTM_CHIP_GAP - BTM_CHIP_SIZE // = 0
  const BTM_RIGHT_BAR_X = RIGHT_BAR_X // = 557
  const BTM_RIGHT_CHIP_X = RIGHT_BAR_X + BTM_BAR_WIDTH + BTM_CHIP_GAP // = 940

  const BTM_BAR_CENTER_Y = BTM_BAR_Y + BTM_BAR_HEIGHT / 2
  const BTM_CHIP_Y = BTM_BAR_Y // チップ高さ = バー高さなのでオフセット不要

  const SVG_HEIGHT = BTM_BAR_Y + BTM_BAR_HEIGHT + PAD_BOTTOM

  // ── Helper functions ──────────────────────────────────────────────────────
  function rowY(i: number): number {
    return PAD_TOP + i * (ROW_HEIGHT + ROW_GAP)
  }

  function barTop(i: number): number {
    return rowY(i) + ARROW_H
  }

  function arrowTextY(i: number): number {
    return rowY(i) + ARROW_TEXT_OFFSET
  }

  function arrowLineY(i: number): number {
    return rowY(i) + ARROW_TEXT_OFFSET + GAP_TEXT_TO_LINE
  }

  function barCenterY(i: number): number {
    return barTop(i) + BAR_HEIGHT / 2
  }

  function resolveRegions(regions: Region[], barX: number): ResolvedRegion[] {
    let offset = 0
    return regions.map((region) => {
      const width = region.span * BAR_WIDTH
      const result: ResolvedRegion = {
        ...region,
        localX: offset,
        absX: barX + offset,
        width,
        centerX: barX + offset + width / 2
      }
      offset += width
      return result
    })
  }

  function reflectClipRects(regions: Region[]): ClipRect[] {
    return resolveRegions(regions, 0)
      .filter((r) => r.kind === "reflect")
      .map((r) => ({ x: r.localX, width: r.width }))
  }
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {SVG_WIDTH} {SVG_HEIGHT}"
  width={SVG_WIDTH}
  height={SVG_HEIGHT}
>
  <defs>
    <!-- 可視光スペクトルグラデーション -->
    <linearGradient id="mc-spectrum" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0.000" stop-color="#4b0082" />
      <stop offset="0.125" stop-color="#0000ff" />
      <stop offset="0.250" stop-color="#00bfff" />
      <stop offset="0.325" stop-color="#00ff80" />
      <stop offset="0.425" stop-color="#00ff00" />
      <stop offset="0.550" stop-color="#ffff00" />
      <stop offset="0.650" stop-color="#ffb000" />
      <stop offset="0.725" stop-color="#ff7f00" />
      <stop offset="0.800" stop-color="#ff0000" />
      <stop offset="1.000" stop-color="#7a0000" />
    </linearGradient>

    <!-- 左列（RGB）反射クリップパス -->
    {#each rows as row, i (row.leftLabel)}
      <clipPath id="mc-clip-L-{i}">
        {#each reflectClipRects(row.leftRegions) as cr (cr.x)}
          <rect x={cr.x} y="0" width={cr.width} height={BAR_HEIGHT} />
        {/each}
      </clipPath>
    {/each}

    <!-- 右列（CMY）反射クリップパス -->
    {#each rows as row, i (row.rightLabel)}
      <clipPath id="mc-clip-R-{i}">
        {#each reflectClipRects(row.rightRegions) as cr (cr.x)}
          <rect x={cr.x} y="0" width={cr.width} height={BAR_HEIGHT} />
        {/each}
      </clipPath>
    {/each}

    <!-- 矢印マーカー: 吸収（水色）左右 -->
    <marker id="mc-aL-absorb" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke={COLOR_ABSORB}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="mc-aR-absorb" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COLOR_ABSORB}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>

    <!-- 矢印マーカー: 反射（オレンジ）左右 -->
    <marker id="mc-aL-reflect" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke={COLOR_REFLECT}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="mc-aR-reflect" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COLOR_REFLECT}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>

    <!-- 矢印マーカー: 中央双方向矢印（ピンク）左右 -->
    <marker id="mc-aL-center" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke={COLOR_CENTER}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="mc-aR-center" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COLOR_CENTER}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </marker>
  </defs>

  <!-- 「補色の関係」ヘッダー -->
  <text
    x={MID_CENTER_X}
    y={PAD_TOP - 14}
    text-anchor="middle"
    fill={COLOR_CENTER}
    font-size="18"
    font-family="var(--font-classic)"
  >
    補色の関係
  </text>

  <!-- ── 上部 3 行（RGB / CMY）── -->
  {#each rows as row, i (i)}
    {@const leftRegions = resolveRegions(row.leftRegions, LEFT_BAR_X)}
    {@const rightRegions = resolveRegions(row.rightRegions, RIGHT_BAR_X)}
    {@const textY = arrowTextY(i)}
    {@const lineY = arrowLineY(i)}
    {@const bTop = barTop(i)}
    {@const bCenterY = barCenterY(i)}

    <!-- 左列 矢印ラベル -->
    {#each leftRegions as region (region.absX)}
      {@const isReflect = region.kind === "reflect"}
      {@const color = isReflect ? COLOR_REFLECT : COLOR_ABSORB}
      {@const markerId = isReflect ? "reflect" : "absorb"}
      <text x={region.centerX} y={textY} text-anchor="middle" fill={color} font-size="18">
        {isReflect ? "反射" : "吸収"}
      </text>
      <line
        x1={region.absX}
        y1={lineY}
        x2={region.absX + region.width}
        y2={lineY}
        stroke={color}
        stroke-width="2"
        marker-start="url(#mc-aL-{markerId})"
        marker-end="url(#mc-aR-{markerId})"
      />
    {/each}

    <!-- 右列 矢印ラベル -->
    {#each rightRegions as region (region.absX)}
      {@const isReflect = region.kind === "reflect"}
      {@const color = isReflect ? COLOR_REFLECT : COLOR_ABSORB}
      {@const markerId = isReflect ? "reflect" : "absorb"}
      <text x={region.centerX} y={textY} text-anchor="middle" fill={color} font-size="18">
        {isReflect ? "反射" : "吸収"}
      </text>
      <line
        x1={region.absX}
        y1={lineY}
        x2={region.absX + region.width}
        y2={lineY}
        stroke={color}
        stroke-width="2"
        marker-start="url(#mc-aL-{markerId})"
        marker-end="url(#mc-aR-{markerId})"
      />
    {/each}

    <!-- 左ラベル（R/G/B）: 縁取り + 塗り色 -->
    <text
      x={LEFT_LABEL_X}
      y={bCenterY}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="none"
      stroke={COLOR_LABEL_OUTLINE}
      stroke-width="3"
      stroke-linejoin="round"
      font-size="34"
      font-weight="bold"
      font-family="var(--font-classic)"
    >
      {row.leftLabel}
    </text>
    <text
      x={LEFT_LABEL_X}
      y={bCenterY}
      text-anchor="middle"
      dominant-baseline="middle"
      fill={row.leftColor}
      font-size="34"
      font-weight="bold"
      font-family="var(--font-classic)"
    >
      {row.leftLabel}
    </text>

    <!-- 右ラベル（C/M/Y）: 縁取り + 塗り色 -->
    <text
      x={RIGHT_LABEL_X}
      y={bCenterY}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="none"
      stroke={COLOR_LABEL_OUTLINE}
      stroke-width="3"
      stroke-linejoin="round"
      font-size="34"
      font-weight="bold"
      font-family="var(--font-classic)"
    >
      {row.rightLabel}
    </text>
    <text
      x={RIGHT_LABEL_X}
      y={bCenterY}
      text-anchor="middle"
      dominant-baseline="middle"
      fill={row.rightColor}
      font-size="34"
      font-weight="bold"
      font-family="var(--font-classic)"
    >
      {row.rightLabel}
    </text>

    <!-- 左バー（RGB スペクトル）-->
    <g transform="translate({LEFT_BAR_X}, {bTop})">
      <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT} fill="black" />
      <g clip-path="url(#mc-clip-L-{i})">
        <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT} fill="url(#mc-spectrum)" />
      </g>
      <rect
        x="0"
        y="0"
        width={BAR_WIDTH}
        height={BAR_HEIGHT}
        fill="none"
        stroke={COLOR_BAR_BORDER}
        stroke-width="1"
      />
    </g>

    <!-- 右バー（CMY スペクトル）-->
    <g transform="translate({RIGHT_BAR_X}, {bTop})">
      <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT} fill="black" />
      <g clip-path="url(#mc-clip-R-{i})">
        <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT} fill="url(#mc-spectrum)" />
      </g>
      <rect
        x="0"
        y="0"
        width={BAR_WIDTH}
        height={BAR_HEIGHT}
        fill="none"
        stroke={COLOR_BAR_BORDER}
        stroke-width="1"
      />
    </g>

    <!-- 中央 双方向矢印（←→）-->
    <line
      x1={MID_LEFT + 8}
      y1={bCenterY}
      x2={MID_RIGHT - 8}
      y2={bCenterY}
      stroke={COLOR_CENTER}
      stroke-width="2"
      marker-start="url(#mc-aL-center)"
      marker-end="url(#mc-aR-center)"
    />
  {/each}

  <!-- ── 下部セクション ── -->

  <!-- 「反射を重ねて白へ」ラベル -->
  <text
    x={BTM_LEFT_BAR_X + BTM_BAR_WIDTH / 2}
    y={BTM_LABEL_Y}
    text-anchor="middle"
    fill={COLOR_REFLECT}
    font-size="16"
    font-family="var(--font-classic)"
  >
    反射を重ねて白へ
  </text>

  <!-- W チップ（白い正方形）-->
  <rect
    x={BTM_LEFT_CHIP_X}
    y={BTM_CHIP_Y}
    width={BTM_CHIP_SIZE}
    height={BTM_CHIP_SIZE}
    fill="white"
    stroke="black"
    stroke-width="1"
  />
  <text
    x={BTM_LEFT_CHIP_X + BTM_CHIP_SIZE / 2}
    y={BTM_CHIP_Y + BTM_CHIP_SIZE / 2}
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#333"
    font-size="18"
    font-weight="bold"
    font-family="var(--font-classic)"
  >
    W
  </text>

  <!-- W バー（全反射 = フルスペクトル）-->
  <g transform="translate({BTM_LEFT_BAR_X}, {BTM_BAR_Y})">
    <rect x="0" y="0" width={BTM_BAR_WIDTH} height={BTM_BAR_HEIGHT} fill="url(#mc-spectrum)" />
    <rect
      x="0"
      y="0"
      width={BTM_BAR_WIDTH}
      height={BTM_BAR_HEIGHT}
      fill="none"
      stroke={COLOR_BAR_BORDER}
      stroke-width="1"
    />
  </g>

  <!-- 中央テキスト「混ぜて白か黒になるのが補色」-->
  <text
    x={MID_CENTER_X}
    y={BTM_BAR_CENTER_Y - 12}
    text-anchor="middle"
    fill={COLOR_CENTER}
    font-size="15"
    font-family="var(--font-classic)"
  >
    混ぜて
  </text>
  <text
    x={MID_CENTER_X}
    y={BTM_BAR_CENTER_Y + 6}
    text-anchor="middle"
    fill={COLOR_CENTER}
    font-size="15"
    font-family="var(--font-classic)"
  >
    白か黒になるのが
  </text>
  <text
    x={MID_CENTER_X}
    y={BTM_BAR_CENTER_Y + 26}
    text-anchor="middle"
    fill={COLOR_CENTER}
    font-size="17"
    font-weight="bold"
    font-family="var(--font-classic)"
  >
    補色
  </text>

  <!-- 「吸収を重ねて黒へ」ラベル -->
  <text
    x={BTM_RIGHT_BAR_X + BTM_BAR_WIDTH / 2}
    y={BTM_LABEL_Y}
    text-anchor="middle"
    fill={COLOR_ABSORB}
    font-size="16"
    font-family="var(--font-classic)"
  >
    吸収を重ねて黒へ
  </text>

  <!-- Bk バー（全吸収 = 黒）-->
  <g transform="translate({BTM_RIGHT_BAR_X}, {BTM_BAR_Y})">
    <rect x="0" y="0" width={BTM_BAR_WIDTH} height={BTM_BAR_HEIGHT} fill="black" />
    <rect
      x="0"
      y="0"
      width={BTM_BAR_WIDTH}
      height={BTM_BAR_HEIGHT}
      fill="none"
      stroke={COLOR_BAR_BORDER}
      stroke-width="1"
    />
  </g>

  <!-- Bk チップ（黒い正方形）-->
  <rect
    x={BTM_RIGHT_CHIP_X}
    y={BTM_CHIP_Y}
    width={BTM_CHIP_SIZE}
    height={BTM_CHIP_SIZE}
    fill="black"
    stroke="white"
    stroke-width="1"
  />
  <text
    x={BTM_RIGHT_CHIP_X + BTM_CHIP_SIZE / 2}
    y={BTM_CHIP_Y + BTM_CHIP_SIZE / 2}
    text-anchor="middle"
    dominant-baseline="middle"
    fill="white"
    font-size="16"
    font-weight="bold"
    font-family="var(--font-classic)"
  >
    Bk
  </text>
</svg>
