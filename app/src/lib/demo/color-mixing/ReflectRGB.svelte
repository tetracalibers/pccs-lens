<script lang="ts">
  // ── Layout ────────────────────────────────────────────────────────────────
  const SVG_WIDTH = 1000
  const LABEL_X = 33 // R/G/B ラベルの x 中心
  const GAP_LABEL_TO_BAR = 50 // ラベル中心からスペクトルバー左端までの距離
  const BAR_X = LABEL_X + GAP_LABEL_TO_BAR // バー左端の x 座標（導出値）
  const BAR_WIDTH = 900 // スペクトルバーの幅
  const BAR_HEIGHT = 120 // スペクトルバーの高さ
  const ARROW_TEXT_OFFSET = 20 // テキストベースラインのオフセット（行上端から）
  const GAP_TEXT_TO_LINE = 14 // テキストベースラインから矢印ラインまでの距離
  const GAP_ARROW_TO_BAR = 18 // 矢印ラインからスペクトルバー上端までの余白
  const ARROW_H = ARROW_TEXT_OFFSET + GAP_TEXT_TO_LINE + GAP_ARROW_TO_BAR
  const ROW_GAP = 25 // 行間の余白
  const PAD_TOP = 12
  const PAD_BOTTOM = 8

  // ── Colors ────────────────────────────────────────────────────────────────
  const COLOR_ABSORB = "var(--canvas-pen-water)" // 吸収ラベル・矢印の色（水色）
  const COLOR_REFLECT = "var(--canvas-pen-orange)" // 反射ラベル・矢印の色（オレンジ）
  const COLOR_BAR_BORDER = "rgba(255,255,255,0.7)" // スペクトル帯の枠線の色
  const COLOR_LABEL_OUTLINE = "rgba(255,255,255,0.9)" // R/G/B ラベルの縁取りの色

  // ── Types ─────────────────────────────────────────────────────────────────
  type RegionKind = "absorb" | "reflect"

  interface Region {
    kind: RegionKind
    span: number
  }

  interface Row {
    label: string
    labelColor: string
    regions: Region[]
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

  // ── Row data ──────────────────────────────────────────────────────────────
  /** 各行の定義。regions は左から順に吸収・反射の領域を表す */
  const rows: Row[] = [
    {
      label: "R",
      labelColor: "#FD1A1C",
      regions: [
        { kind: "absorb", span: 2 / 3 },
        { kind: "reflect", span: 1 / 3 }
      ]
    },
    {
      label: "G",
      labelColor: "#33A23D",
      regions: [
        { kind: "absorb", span: 1 / 3 },
        { kind: "reflect", span: 1 / 3 },
        { kind: "absorb", span: 1 / 3 }
      ]
    },
    {
      label: "B",
      labelColor: "#1D1A88",
      regions: [
        { kind: "reflect", span: 1 / 3 },
        { kind: "absorb", span: 2 / 3 }
      ]
    }
  ]

  // ── Derived values ────────────────────────────────────────────────────────
  const ROW_HEIGHT = ARROW_H + BAR_HEIGHT
  const SVG_HEIGHT = PAD_TOP + rows.length * ROW_HEIGHT + (rows.length - 1) * ROW_GAP + PAD_BOTTOM

  /** 行 i の上端 y（矢印セクション開始位置） */
  function rowY(i: number): number {
    return PAD_TOP + i * (ROW_HEIGHT + ROW_GAP)
  }

  /** 行 i のバー上端 y */
  function barTop(i: number): number {
    return rowY(i) + ARROW_H
  }

  /** 行 i の矢印ラベルのテキストベースライン y */
  function arrowTextY(i: number): number {
    return rowY(i) + ARROW_TEXT_OFFSET
  }

  /** 行 i の矢印ライン y */
  function arrowLineY(i: number): number {
    return rowY(i) + ARROW_TEXT_OFFSET + GAP_TEXT_TO_LINE
  }

  /** 行 i のバー垂直中央 y（R/G/B ラベルの配置に使用） */
  function barCenterY(i: number): number {
    return barTop(i) + BAR_HEIGHT / 2
  }

  /**
   * 行の regions を、描画に必要な座標を付加した形に変換する。
   * - localX : バー内 x オフセット（クリップパスのローカル座標と対応）
   * - absX   : SVG グローバル x（矢印描画に使用）
   * - width  : 領域の幅
   * - centerX: 領域の中心 x（ラベル配置に使用）
   */
  function resolveRegions(row: Row): ResolvedRegion[] {
    let offset = 0
    return row.regions.map((region) => {
      const width = region.span * BAR_WIDTH
      const result: ResolvedRegion = {
        ...region,
        localX: offset,
        absX: BAR_X + offset,
        width,
        centerX: BAR_X + offset + width / 2
      }
      offset += width
      return result
    })
  }

  /**
   * バーローカル座標での「反射」クリップ矩形を返す。
   * 反射領域が連続していることを前提とする（R/G/B いずれもそう）。
   */
  function reflectClipRect(row: Row): ClipRect {
    const regions = resolveRegions(row)
    const reflectRegions = regions.filter((r) => r.kind === "reflect")
    const x = reflectRegions[0].localX
    const width = reflectRegions.reduce((sum, r) => sum + r.width, 0)
    return { x, width }
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
    <linearGradient id="rrgb-spectrum" x1="0" y1="0" x2="1" y2="0">
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

    <!-- 各行の反射クリップパス（バーのローカル座標で定義） -->
    {#each rows as row (row.label)}
      {@const clip = reflectClipRect(row)}
      <clipPath id="rrgb-clip-{row.label}">
        <rect x={clip.x} y="0" width={clip.width} height={BAR_HEIGHT} />
      </clipPath>
    {/each}

    <!-- 矢印マーカー: 吸収（水色）・反射（オレンジ）を左右それぞれ定義 -->
    <!-- SpectrumRange.svelte と同じ開きシェブロン形状 -->
    <marker id="rrgb-aL-absorb" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke={COLOR_ABSORB}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="rrgb-aR-absorb" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COLOR_ABSORB}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="rrgb-aL-reflect" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke={COLOR_REFLECT}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="rrgb-aR-reflect" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COLOR_REFLECT}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
  </defs>

  <!-- ── 各行（R / G / B） ── -->
  {#each rows as row, i (i)}
    {@const regions = resolveRegions(row)}
    {@const textY = arrowTextY(i)}
    {@const lineY = arrowLineY(i)}
    {@const bTop = barTop(i)}

    <!-- 矢印ラベルと矢印ライン -->
    {#each regions as region (region.absX)}
      {@const isReflect = region.kind === "reflect"}
      {@const color = isReflect ? COLOR_REFLECT : COLOR_ABSORB}
      {@const labelText = isReflect ? "反射" : "吸収"}
      {@const markerId = isReflect ? "reflect" : "absorb"}
      <text x={region.centerX} y={textY} text-anchor="middle" fill={color} font-size="20">
        {labelText}
      </text>
      <line
        x1={region.absX}
        y1={lineY}
        x2={region.absX + region.width}
        y2={lineY}
        stroke={color}
        stroke-width="2"
        marker-start="url(#rrgb-aL-{markerId})"
        marker-end="url(#rrgb-aR-{markerId})"
      />
    {/each}

    <!-- R/G/B ラベル（バー垂直中央）: 白縁取りを下に敷いてから塗り色で上描き -->
    <text
      x={LABEL_X}
      y={barCenterY(i)}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="none"
      stroke={COLOR_LABEL_OUTLINE}
      stroke-width="3"
      stroke-linejoin="round"
      font-size="44"
      font-weight="bold"
      font-family="var(--font-classic)"
    >
      {row.label}
    </text>
    <text
      x={LABEL_X}
      y={barCenterY(i)}
      text-anchor="middle"
      dominant-baseline="middle"
      fill={row.labelColor}
      font-size="44"
      font-weight="bold"
      font-family="var(--font-classic)"
    >
      {row.label}
    </text>

    <!-- スペクトルバー（黒地 + 反射領域のみグラデーション + 白枠） -->
    <g transform="translate({BAR_X}, {bTop})">
      <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT} fill="black" />
      <g clip-path="url(#rrgb-clip-{row.label})">
        <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT} fill="url(#rrgb-spectrum)" />
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
  {/each}
</svg>
