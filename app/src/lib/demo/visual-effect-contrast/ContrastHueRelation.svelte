<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP, PCCS_ALL_MAP, PCCS_HUE_MAP } from "$lib/data/pccs"

  let {
    figure,
    ground,
    iconId
  }: {
    figure: string
    ground: string
    iconId: string
  } = $props()

  // ===== 色相環ジオメトリ =====
  const HUE_COUNT = 24
  const ANGLE_PER_HUE = (2 * Math.PI) / HUE_COUNT
  const TOP_HUE_NUM = 8
  const TOP_ANGLE = -Math.PI / 2

  // ===== サイズ定数 =====
  const WHEEL_RADIUS = 100
  const WHEEL_STROKE_WIDTH = 1.5
  const MARKER_SIZE = 32
  const LABEL_FONT_SIZE = 18
  const LABEL_GAP = 6 // マーカー外側の端からラベル内側の端までの間隔
  const LABEL_TO_ARC_GAP = 12 // ラベル外側の端から円弧矢印までの間隔
  // ラベルテキストを矩形と見なすときの 1 文字あたりの幅をフォントサイズに対する比率で近似
  const LABEL_CHAR_WIDTH_RATIO = 0.6
  const VIEWBOX_MARGIN = 0

  // ===== 円弧矢印（A→D, 矢はC方向）: ContrastToneRelation と同等 =====
  const ARC_STROKE_WIDTH = 2.5
  const ARC_ARROW_HEAD_VIEWBOX = 7
  const ARC_ARROW_HEAD_SIZE = 20
  const ARC_ARROW_HEAD_STROKE = (ARC_STROKE_WIDTH * ARC_ARROW_HEAD_VIEWBOX) / ARC_ARROW_HEAD_SIZE

  // ===== 直線矢印（B→C, 点線）: SpectrumRange と同等 =====
  const LINE_STROKE_WIDTH = 2
  const LINE_DASH_ARRAY = "5,4"
  const LINE_OFFSET = 4 // マーカー端から線の開始点までの距離
  const LINE_MARKER_W = 9
  const LINE_MARKER_H = 10

  // ===== 色 =====
  const COL_WHEEL_OUTLINE = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"
  const COL_LINE = "var(--color-body)"

  // ===== ヘルパー =====
  const hueAngle = (num: number) => TOP_ANGLE + (num - TOP_HUE_NUM) * ANGLE_PER_HUE

  const complementHue = (hue: number) => ((hue - 1 + HUE_COUNT / 2) % HUE_COUNT) + 1

  function arcDist(a: number, b: number): number {
    const d = (a - b + HUE_COUNT) % HUE_COUNT
    return Math.min(d, HUE_COUNT - d)
  }

  /**
   * 地と地の補色の中間色相のうち、図と同じ側（図に近い方）にある方を返す。
   * 地と補色は色相環上で 12 離れているため中間候補は 2 つあり、
   * 図に近い方を選ぶ。
   */
  function midHueNearFigure(groundHue: number, figureHue: number): number {
    const cand1 = ((groundHue - 1 + HUE_COUNT / 4) % HUE_COUNT) + 1
    const cand2 = ((groundHue - 1 - HUE_COUNT / 4 + HUE_COUNT) % HUE_COUNT) + 1
    return arcDist(cand1, figureHue) <= arcDist(cand2, figureHue) ? cand1 : cand2
  }

  /** SVG 弧の sweep-flag: from → to を短い方の弧で進む向き */
  function shortSweepFlag(from: number, to: number): 0 | 1 {
    const diff = (to - from + HUE_COUNT) % HUE_COUNT
    return diff <= HUE_COUNT / 2 ? 1 : 0
  }

  // ===== 入力解析 =====
  const figureColor = $derived(PCCS_ALL_MAP.get(figure))
  const groundColor = $derived(PCCS_ALL_MAP.get(ground))

  const figureHue = $derived(figureColor?.hueNumber ?? null)
  const groundHue = $derived(groundColor?.hueNumber ?? null)
  const groundTone = $derived(groundColor?.toneSymbol ?? null)

  const compHue = $derived(groundHue !== null ? complementHue(groundHue) : null)
  const midHue = $derived(
    groundHue !== null && figureHue !== null ? midHueNearFigure(groundHue, figureHue) : null
  )

  // ===== 色 =====
  const figureHex = $derived(PCCS_HEX_MAP.get(figure) ?? "#000000")
  const groundHex = $derived(PCCS_HEX_MAP.get(ground) ?? "#ffffff")
  const cNotation = $derived(groundTone && compHue !== null ? `${groundTone}${compHue}` : null)
  const cHex = $derived(cNotation ? (PCCS_HEX_MAP.get(cNotation) ?? "#000000") : "#000000")
  const dHex = $derived(midHue !== null ? (PCCS_HEX_MAP.get(`v${midHue}`) ?? "#000000") : "#000000")
  const arcHex = $derived(
    midHue !== null ? (PCCS_HEX_MAP.get(`b${midHue}`) ?? "#000000") : "#000000"
  )
  // 同一ページに複数のコンポーネントが並んだとき、矢印の色が混ざらないように
  // marker id に色を含めて一意化する。
  const arcMarkerId = $derived(`hue-arc-arrow-${arcHex.replace("#", "")}`)

  // ===== 角度 =====
  const figureAngle = $derived(figureHue !== null ? hueAngle(figureHue) : null)
  const groundAngle = $derived(groundHue !== null ? hueAngle(groundHue) : null)
  const compAngle = $derived(compHue !== null ? hueAngle(compHue) : null)
  const midAngle = $derived(midHue !== null ? hueAngle(midHue) : null)

  // ===== ラベル =====
  const aLabel = $derived(figure)
  const bLabel = $derived(ground)
  const cLabel = $derived(cNotation ?? "")
  const dLabel = $derived(midHue !== null ? (PCCS_HUE_MAP.get(midHue)?.symbol ?? "") : "")

  // ===== ラベル配置 =====
  // テキスト矩形の中心から、放射方向（角度 angle に向かう方向）への張り出し量を概算で返す。
  // text-anchor="middle" / dominant-baseline="central" を前提とした水平テキスト用。
  function labelRadialExtent(text: string, angle: number | null): number {
    if (angle === null || !text) return 0
    const halfW = (text.length * LABEL_FONT_SIZE * LABEL_CHAR_WIDTH_RATIO) / 2
    const halfH = LABEL_FONT_SIZE / 2
    return halfW * Math.abs(Math.cos(angle)) + halfH * Math.abs(Math.sin(angle))
  }

  const aLabelExtent = $derived(labelRadialExtent(aLabel, figureAngle))
  const bLabelExtent = $derived(labelRadialExtent(bLabel, groundAngle))
  const cLabelExtent = $derived(labelRadialExtent(cLabel, compAngle))
  const dLabelExtent = $derived(labelRadialExtent(dLabel, midAngle))

  // ラベル中心の配置半径（マーカー外側端からラベル内側端までを LABEL_GAP に保つ）
  const markerOuterRadius = WHEEL_RADIUS + MARKER_SIZE / 2
  const aLabelRadius = $derived(markerOuterRadius + LABEL_GAP + aLabelExtent)
  const bLabelRadius = $derived(markerOuterRadius + LABEL_GAP + bLabelExtent)
  const cLabelRadius = $derived(markerOuterRadius + LABEL_GAP + cLabelExtent)
  const dLabelRadius = $derived(markerOuterRadius + LABEL_GAP + dLabelExtent)

  // ===== サイズ =====
  // 円弧矢印は全ラベルの外側に配置する
  const maxLabelOuterEdge = $derived(
    Math.max(
      aLabelRadius + aLabelExtent,
      bLabelRadius + bLabelExtent,
      cLabelRadius + cLabelExtent,
      dLabelRadius + dLabelExtent
    )
  )
  const arcRadius = $derived(maxLabelOuterEdge + LABEL_TO_ARC_GAP)
  const svgHalf = $derived(arcRadius + ARC_ARROW_HEAD_SIZE / 2 + VIEWBOX_MARGIN)
  const SIZE = $derived(svgHalf * 2)
  const cx = $derived(svgHalf)
  const cy = $derived(svgHalf)

  function pointAt(angle: number, radius: number) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    }
  }

  // ===== B→C 直線（点線、矢は C 側）=====
  const bcArrow = $derived.by(() => {
    if (groundAngle === null || compAngle === null) return null
    const dirX = -Math.cos(groundAngle)
    const dirY = -Math.sin(groundAngle)
    const offset = MARKER_SIZE / 2 + LINE_OFFSET
    const bp = pointAt(groundAngle, WHEEL_RADIUS)
    const cp = pointAt(compAngle, WHEEL_RADIUS)
    return {
      x1: bp.x + offset * dirX,
      y1: bp.y + offset * dirY,
      x2: cp.x - offset * dirX,
      y2: cp.y - offset * dirY
    }
  })

  // ===== A→D 円弧（矢は C 側）=====
  const adArcPath = $derived.by(() => {
    if (figureAngle === null || midAngle === null || figureHue === null || compHue === null)
      return null
    const sp = pointAt(figureAngle, arcRadius)
    const ep = pointAt(midAngle, arcRadius)
    const sweep = shortSweepFlag(figureHue, compHue)
    return `M ${sp.x.toFixed(3)} ${sp.y.toFixed(3)} A ${arcRadius} ${arcRadius} 0 0 ${sweep} ${ep.x.toFixed(3)} ${ep.y.toFixed(3)}`
  })

  // ===== マーカー位置 =====
  const aPos = $derived(figureAngle !== null ? pointAt(figureAngle, WHEEL_RADIUS) : null)
  const bPos = $derived(groundAngle !== null ? pointAt(groundAngle, WHEEL_RADIUS) : null)
  const cPos = $derived(compAngle !== null ? pointAt(compAngle, WHEEL_RADIUS) : null)
  const dPos = $derived(midAngle !== null ? pointAt(midAngle, WHEEL_RADIUS) : null)

  // ===== ラベル位置 =====
  const aLabelPos = $derived(figureAngle !== null ? pointAt(figureAngle, aLabelRadius) : null)
  const bLabelPos = $derived(groundAngle !== null ? pointAt(groundAngle, bLabelRadius) : null)
  const cLabelPos = $derived(compAngle !== null ? pointAt(compAngle, cLabelRadius) : null)
  const dLabelPos = $derived(midAngle !== null ? pointAt(midAngle, dLabelRadius) : null)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <!-- A→D 円弧用矢（C 方向）: ContrastToneRelation 形状 -->
    <marker
      id={arcMarkerId}
      viewBox="0 0 {ARC_ARROW_HEAD_VIEWBOX} {ARC_ARROW_HEAD_VIEWBOX}"
      refX={ARC_ARROW_HEAD_VIEWBOX / 2}
      refY={ARC_ARROW_HEAD_VIEWBOX / 2}
      markerWidth={ARC_ARROW_HEAD_SIZE}
      markerHeight={ARC_ARROW_HEAD_SIZE}
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <polyline
        points="0,3.5 3.5,1.75 0,0"
        fill="none"
        stroke={arcHex}
        stroke-width={ARC_ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>

    <!-- B→C 直線用矢（C 方向）: SpectrumRange 形状 -->
    <marker
      id="hue-line-arrow"
      markerWidth={LINE_MARKER_W}
      markerHeight={LINE_MARKER_H}
      refX="8"
      refY="5"
      orient="auto"
    >
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={COL_LINE}
        stroke-width="1"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </marker>
  </defs>

  <!-- 色相環（線のみ） -->
  <circle
    {cx}
    {cy}
    r={WHEEL_RADIUS}
    fill="none"
    stroke={COL_WHEEL_OUTLINE}
    stroke-width={WHEEL_STROKE_WIDTH}
  />

  <!-- B→C 直線矢印（点線） -->
  {#if bcArrow}
    <line
      x1={bcArrow.x1}
      y1={bcArrow.y1}
      x2={bcArrow.x2}
      y2={bcArrow.y2}
      stroke={COL_LINE}
      stroke-width={LINE_STROKE_WIDTH}
      stroke-dasharray={LINE_DASH_ARRAY}
      marker-end="url(#hue-line-arrow)"
    />
  {/if}

  <!-- B: 地のマーカー（正方形） -->
  {#if bPos}
    <rect
      x={bPos.x - MARKER_SIZE / 2}
      y={bPos.y - MARKER_SIZE / 2}
      width={MARKER_SIZE}
      height={MARKER_SIZE}
      fill={groundHex}
    />
  {/if}

  <!-- C: 地の補色マーカー（正方形） -->
  {#if cPos}
    <rect
      x={cPos.x - MARKER_SIZE / 2}
      y={cPos.y - MARKER_SIZE / 2}
      width={MARKER_SIZE}
      height={MARKER_SIZE}
      fill={cHex}
    />
  {/if}

  <!-- D: 中間色相 v トーン（円） -->
  {#if dPos}
    <circle cx={dPos.x} cy={dPos.y} r={MARKER_SIZE / 2} fill={dHex} />
  {/if}

  <!-- A: 図のアイコン -->
  {#if aPos}
    <foreignObject
      x={aPos.x - MARKER_SIZE / 2}
      y={aPos.y - MARKER_SIZE / 2}
      width={MARKER_SIZE}
      height={MARKER_SIZE}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {figureHex}; display: grid; place-items: center;"
      >
        <Icon icon={iconId} width={MARKER_SIZE} height={MARKER_SIZE} />
      </div>
    </foreignObject>
  {/if}

  <!-- ラベル -->
  {#if aLabelPos}
    <text
      x={aLabelPos.x}
      y={aLabelPos.y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={LABEL_FONT_SIZE}
      fill={COL_LABEL}
    >
      {aLabel}
    </text>
  {/if}
  {#if bLabelPos}
    <text
      x={bLabelPos.x}
      y={bLabelPos.y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={LABEL_FONT_SIZE}
      fill={COL_LABEL}
    >
      {bLabel}
    </text>
  {/if}
  {#if cLabelPos}
    <text
      x={cLabelPos.x}
      y={cLabelPos.y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={LABEL_FONT_SIZE}
      fill={COL_LABEL}
    >
      {cLabel}
    </text>
  {/if}
  {#if dLabelPos}
    <text
      x={dLabelPos.x}
      y={dLabelPos.y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={LABEL_FONT_SIZE}
      fill={COL_LABEL}
    >
      {dLabel}
    </text>
  {/if}

  <!-- A→D 円弧矢印 -->
  {#if adArcPath}
    <path
      d={adArcPath}
      fill="none"
      stroke={arcHex}
      stroke-width={ARC_STROKE_WIDTH}
      stroke-linecap="round"
      marker-end="url(#{arcMarkerId})"
    />
  {/if}
</svg>
