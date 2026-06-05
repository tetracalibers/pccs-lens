<script lang="ts">
  import { arc } from "d3-shape"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"

  // ===== 色相環の半径 =====
  const R_OUTER = 255
  const SWATCH_HEIGHT = 55
  const R_INNER = R_OUTER - SWATCH_HEIGHT
  const MID_RADIUS = (R_OUTER + R_INNER) / 2

  // ===== セグメント仕様（PCCSHueWheel と同じ）=====
  // 24 セグメント、各 15°。num k のセグメントは [(k-1)·SA, k·SA]。
  const HUE_COUNT = 24
  const SEGMENT_ANGLE = (2 * Math.PI) / HUE_COUNT

  // ===== セグメント間ギャップ（PCCSHueWheel と同じ算出式）=====
  const GAP = Math.max(2, R_OUTER * 0.018)
  const PAD_ANGLE = GAP / MID_RADIUS

  // ===== 角度オフセット =====
  // num=8（Y）の中心を 12 時に揃える。
  // num=8 のセグメント中心は 7.5·SA なので、これを 0 にする。
  const TOP_HUE_NUM = 8
  const ANGLE_OFFSET = -(TOP_HUE_NUM - 0.5) * SEGMENT_ANGLE

  // ===== セグメントのラベル =====
  const FONT_SIZE_SEGMENT = 14

  // ===== ViewBox（原点中心）=====
  const PADDING = 20
  const VB_R = R_OUTER + PADDING

  // ===== ツールチップ（吹き出し）の文字 =====
  const FONT_SIZE_LABEL = 12
  const FONT_SIZE_VALUE = 14

  // ===== ツールチップのレイアウト =====
  const GAP_LABEL_VALUE = 8 // ラベル右端 ↔ 値左端
  const GAP_VALUE_BRACE = 10 // 色相記号の値 ↔ 波括弧頂点
  const BRACE_DEPTH = 14 // 波括弧の頂点 ↔ 足元（横方向の深さ）
  const GAP_BRACE_LABEL = 10 // 波括弧の足元 ↔ サブラベル右側
  const SUB_GAP = 24 // 色相番号/色相記号/略記号の行間
  const SECTION_GAP = 22 // 波括弧セクション ↔ 色相名セクションの隙間
  const ROW_GAP = 28 // 日本語名 ↔ 英語名の行間
  const PAD_X = 20 // 吹き出し左右の内側余白
  const PAD_Y = 32 // 吹き出し上下の内側余白

  // ===== 波括弧の形状（ColorTemperatureScale を参考）=====
  const BRACE_STROKE_WIDTH = 1.2
  const BRACE_CORNER_R = 8

  // ===== 吹き出しの形状 =====
  const BUBBLE_CORNER_R = 12
  const TAIL_LEN = 20 // 吹き出し縁からツノ先端までの距離
  const TAIL_HALF = 10 // ツノ付け根の半幅

  // ===== Colors =====
  const COL_BUBBLE_BG = "light-dark(#ffffff, #1c1c2e)"
  const COL_LABEL = "var(--color-body)"
  const COL_VALUE = "var(--color-body)"
  const COL_BRACE = "var(--color-body)"

  type Segment = {
    key: number
    symbol: string
    color: string
    textColor: string
    path: string
    /** 12 時 = 0、CW を正とする中心角度（度） */
    midAngleDeg: number
  }

  const arcGen = arc<{ x0: number; x1: number }>()
    .startAngle((d) => d.x0 + ANGLE_OFFSET)
    .endAngle((d) => d.x1 + ANGLE_OFFSET)
    .innerRadius(R_INNER)
    .outerRadius(R_OUTER)
    .padAngle(PAD_ANGLE)
    .padRadius(MID_RADIUS)

  const segments: Segment[] = Array.from(PCCS_HUE_MAP.entries()).map(([num, data]) => {
    const x0 = (num - 1) * SEGMENT_ANGLE
    const x1 = num * SEGMENT_ANGLE
    const midAng = (((x0 + x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
    return {
      key: num,
      symbol: data.symbol,
      color: data.color,
      textColor: isLightColor(data.color) ? "#222" : "#fff",
      path: arcGen({ x0, x1 }) ?? "",
      midAngleDeg: midAng
    }
  })

  // 12 時 = 0、CW 正の角度を SVG 座標へ変換（原点中心）
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [r * Math.cos(t), r * Math.sin(t)]
  }

  // ===== 文字幅の概算（ColorTemperatureScale と同じ手法）=====
  function charWidth(ch: string, fontSize: number): number {
    const code = ch.charCodeAt(0)
    const isFullWidth = (code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef)
    return isFullWidth ? fontSize : fontSize * 0.6
  }
  function textWidth(s: string, fontSize: number): number {
    return [...s].reduce((sum, ch) => sum + charWidth(ch, fontSize), 0)
  }

  // ===== アクティブな色相 =====
  // 初期状態は 8:Y のツールチップを表示
  let activeNum = $state(8)

  const active = $derived(PCCS_HUE_MAP.get(activeNum)!)
  const activeSegment = $derived(segments.find((s) => s.key === activeNum)!)
  // 略記号（symbol の ":" 以降）。色相番号は Map のキー。
  const activeAbbr = $derived(active.symbol.split(":")[1] ?? "")

  function selectHue(num: number) {
    activeNum = num
  }

  // ===== ツールチップ内のレイアウト計算 =====
  const layout = $derived.by(() => {
    const symbol = active.symbol
    const labelJa = active.labelJa
    const labelEn = active.labelEn
    const numText = String(activeNum)

    // メイン行（色相記号・日本語名・英語名）。ラベルは右揃え、値は左揃えで縦に揃える。
    const mainLabels = ["色相記号", "日本語の色相名", "英語の色相名"]
    const mainLabelW = Math.max(...mainLabels.map((l) => textWidth(l, FONT_SIZE_LABEL)))
    const symbolW = textWidth(symbol, FONT_SIZE_VALUE)
    const mainValueW = Math.max(
      symbolW,
      textWidth(labelJa, FONT_SIZE_VALUE),
      textWidth(labelEn, FONT_SIZE_VALUE)
    )

    // サブ行（色相番号・色相の略記号）
    const subLabels = ["色相番号", "色相の略記号"]
    const subLabelW = Math.max(...subLabels.map((l) => textWidth(l, FONT_SIZE_LABEL)))
    const subValueW = Math.max(
      textWidth(numText, FONT_SIZE_VALUE),
      textWidth(activeAbbr, FONT_SIZE_VALUE)
    )

    // 横方向の座標（content 原点 0 を基準に左→右）
    const mainLabelEndX = mainLabelW
    const mainValueX = mainLabelEndX + GAP_LABEL_VALUE
    const bracePeakX = mainValueX + symbolW + GAP_VALUE_BRACE
    const braceFeetX = bracePeakX + BRACE_DEPTH
    // サブラベル（色相番号・色相の略記号）は左寄せ。値はラベル幅ぶん右に揃える。
    const subLabelStartX = braceFeetX + GAP_BRACE_LABEL
    const subValueX = subLabelStartX + subLabelW + GAP_LABEL_VALUE
    const contentRight = Math.max(subValueX + subValueW, mainValueX + mainValueW)

    // 縦方向の座標
    const y0 = 0 // 色相番号
    const y1 = SUB_GAP // 色相記号（波括弧の中心）
    const y2 = 2 * SUB_GAP // 色相の略記号
    const y3 = y2 + SECTION_GAP // 日本語名
    const y4 = y3 + ROW_GAP // 英語名
    const contentH = y4

    // 吹き出しの大きさ・content のオフセット（吹き出し中心 = 原点）
    const hw = contentRight / 2 + PAD_X
    const hh = contentH / 2 + PAD_Y
    const offsetX = -contentRight / 2
    const offsetY = -contentH / 2

    return {
      mainLabelEndX,
      mainValueX,
      bracePeakX,
      braceFeetX,
      subLabelStartX,
      subValueX,
      y0,
      y1,
      y2,
      y3,
      y4,
      hw,
      hh,
      offsetX,
      offsetY
    }
  })

  // ===== 縦向きの波括弧パス（ColorTemperatureScale の bracePath を縦向きに）=====
  // 足元 (xFeet, yT) と (xFeet, yB)、中央頂点を (xPeak, yM) に置く。
  function vBracePath(yT: number, yB: number, xFeet: number, xPeak: number): string {
    const yM = (yT + yB) / 2
    const r = BRACE_CORNER_R
    const xShoulder = xFeet + (xPeak < xFeet ? -r : r)
    return [
      `M ${xFeet} ${yT}`,
      `Q ${xShoulder} ${yT} ${xShoulder} ${yT + r}`,
      `L ${xShoulder} ${yM - r}`,
      `Q ${xShoulder} ${yM} ${xPeak} ${yM}`,
      `Q ${xShoulder} ${yM} ${xShoulder} ${yM + r}`,
      `L ${xShoulder} ${yB - r}`,
      `Q ${xShoulder} ${yB} ${xFeet} ${yB}`
    ].join(" ")
  }

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  // ===== 吹き出し（角丸長方形 + ツノ）のパス =====
  // 原点中心。ux, uy はツノを向ける方向の単位ベクトル。
  function bubblePath(hw: number, hh: number, ux: number, uy: number): string {
    const r = BUBBLE_CORNER_R
    const tX = Math.abs(ux) < 1e-6 ? Infinity : hw / Math.abs(ux)
    const tY = Math.abs(uy) < 1e-6 ? Infinity : hh / Math.abs(uy)
    const onVertical = tX <= tY // 左右どちらかの辺から出る
    const t = Math.min(tX, tY)
    const ex = t * ux
    const ey = t * uy
    const tipX = ex + TAIL_LEN * ux
    const tipY = ey + TAIL_LEN * uy

    const p: string[] = []
    p.push(`M ${-hw + r} ${-hh}`)

    // 上辺：(-hw+r,-hh) → (hw-r,-hh)（x 増加方向）
    if (!onVertical && uy < 0) {
      const cx = clamp(ex, -hw + r, hw - r)
      const b1 = clamp(cx - TAIL_HALF, -hw + r, hw - r)
      const b2 = clamp(cx + TAIL_HALF, -hw + r, hw - r)
      p.push(`L ${b1} ${-hh}`, `L ${tipX} ${tipY}`, `L ${b2} ${-hh}`)
    }
    p.push(`L ${hw - r} ${-hh}`)
    p.push(`Q ${hw} ${-hh} ${hw} ${-hh + r}`)

    // 右辺：(hw,-hh+r) → (hw,hh-r)（y 増加方向）
    if (onVertical && ux > 0) {
      const cy = clamp(ey, -hh + r, hh - r)
      const b1 = clamp(cy - TAIL_HALF, -hh + r, hh - r)
      const b2 = clamp(cy + TAIL_HALF, -hh + r, hh - r)
      p.push(`L ${hw} ${b1}`, `L ${tipX} ${tipY}`, `L ${hw} ${b2}`)
    }
    p.push(`L ${hw} ${hh - r}`)
    p.push(`Q ${hw} ${hh} ${hw - r} ${hh}`)

    // 下辺：(hw-r,hh) → (-hw+r,hh)（x 減少方向）
    if (!onVertical && uy > 0) {
      const cx = clamp(ex, -hw + r, hw - r)
      const b1 = clamp(cx + TAIL_HALF, -hw + r, hw - r)
      const b2 = clamp(cx - TAIL_HALF, -hw + r, hw - r)
      p.push(`L ${b1} ${hh}`, `L ${tipX} ${tipY}`, `L ${b2} ${hh}`)
    }
    p.push(`L ${-hw + r} ${hh}`)
    p.push(`Q ${-hw} ${hh} ${-hw} ${hh - r}`)

    // 左辺：(-hw,hh-r) → (-hw,-hh+r)（y 減少方向）
    if (onVertical && ux < 0) {
      const cy = clamp(ey, -hh + r, hh - r)
      const b1 = clamp(cy + TAIL_HALF, -hh + r, hh - r)
      const b2 = clamp(cy - TAIL_HALF, -hh + r, hh - r)
      p.push(`L ${-hw} ${b1}`, `L ${tipX} ${tipY}`, `L ${-hw} ${b2}`)
    }
    p.push(`L ${-hw} ${-hh + r}`)
    p.push(`Q ${-hw} ${-hh} ${-hw + r} ${-hh}`)
    p.push("Z")
    return p.join(" ")
  }

  // アクティブセグメント方向の単位ベクトル（ツノの向き）
  const activeDir = $derived.by(() => {
    const t = ((activeSegment.midAngleDeg - 90) * Math.PI) / 180
    return { ux: Math.cos(t), uy: Math.sin(t) }
  })

  function getSelectedRingStroke(hex: string): string {
    return isLightColor(hex)
      ? `oklch(from ${hex} calc(l - .10) c calc(h - 10))`
      : `oklch(from ${hex} calc(l + .10) c calc(h - 10))`
  }
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="{-VB_R} {-VB_R} {2 * VB_R} {2 * VB_R}"
  role="img"
  aria-label="PCCS色相環（色相をクリックすると表記が表示されます）"
>
  <!-- 24 色相のセグメント（クリック可能） -->
  {#each segments as seg (seg.key)}
    {@const [lx, ly] = pointAt(seg.midAngleDeg, MID_RADIUS)}
    <g
      data-hue
      role="button"
      tabindex="0"
      aria-label="{seg.symbol} {PCCS_HUE_MAP.get(seg.key)?.labelJa}"
      aria-pressed={activeNum === seg.key}
      style="cursor: pointer;"
      onclick={() => selectHue(seg.key)}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          selectHue(seg.key)
        }
      }}
    >
      <!-- フォーカスリング -->
      <path class="focus-ring" d={seg.path} fill="none" style="pointer-events: none;" />
      <!-- スウォッチ -->
      <path d={seg.path} fill={seg.color} />
      <!-- 色相記号 -->
      <text
        x={lx}
        y={ly}
        font-size={FONT_SIZE_SEGMENT}
        font-weight="600"
        fill={seg.textColor}
        text-anchor="middle"
        dominant-baseline="central"
        style="font-family: var(--font-mono); pointer-events: none; user-select: none;"
      >
        {seg.symbol}
      </text>
    </g>
  {/each}

  <!-- 選択中セグメントの強調アウトライン -->
  <path
    d={activeSegment.path}
    fill="none"
    stroke={getSelectedRingStroke(activeSegment.color)}
    stroke-width="2.5"
    style="pointer-events: none;"
  />

  <!-- 吹き出し（色相環の内側）。枠線は選択中の色相の色 -->
  <path
    d={bubblePath(layout.hw, layout.hh, activeDir.ux, activeDir.uy)}
    fill={COL_BUBBLE_BG}
    stroke={getSelectedRingStroke(activeSegment.color)}
    stroke-width="2"
  />

  <!-- 吹き出しの中身 -->
  <g transform="translate({layout.offsetX} {layout.offsetY})">
    <!-- 波括弧（色相記号 → 色相番号・色相の略記号）-->
    <path
      d={vBracePath(layout.y0, layout.y2, layout.braceFeetX, layout.bracePeakX)}
      fill="none"
      stroke={COL_BRACE}
      stroke-width={BRACE_STROKE_WIDTH}
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- 色相番号 -->
    <text
      class="tip-label"
      x={layout.subLabelStartX}
      y={layout.y0}
      font-size={FONT_SIZE_LABEL}
      fill={COL_LABEL}
      text-anchor="start"
      dominant-baseline="central"
    >
      色相番号
    </text>
    <text
      class="tip-value tip-value--mono"
      x={layout.subValueX}
      y={layout.y0}
      font-size={FONT_SIZE_VALUE}
      fill={COL_VALUE}
      text-anchor="start"
      dominant-baseline="central"
    >
      {activeNum}
    </text>

    <!-- 色相記号 -->
    <text
      class="tip-label"
      x={layout.mainLabelEndX}
      y={layout.y1}
      font-size={FONT_SIZE_LABEL}
      fill={COL_LABEL}
      text-anchor="end"
      dominant-baseline="central"
    >
      色相記号
    </text>
    <text
      class="tip-value tip-value--mono"
      x={layout.mainValueX}
      y={layout.y1}
      font-size={FONT_SIZE_VALUE}
      fill={COL_VALUE}
      text-anchor="start"
      dominant-baseline="central"
    >
      {active.symbol}
    </text>

    <!-- 色相の略記号 -->
    <text
      class="tip-label"
      x={layout.subLabelStartX}
      y={layout.y2}
      font-size={FONT_SIZE_LABEL}
      fill={COL_LABEL}
      text-anchor="start"
      dominant-baseline="central"
    >
      色相の略記号
    </text>
    <text
      class="tip-value tip-value--mono"
      x={layout.subValueX}
      y={layout.y2}
      font-size={FONT_SIZE_VALUE}
      fill={COL_VALUE}
      text-anchor="start"
      dominant-baseline="central"
    >
      {activeAbbr}
    </text>

    <!-- 日本語の色相名 -->
    <text
      class="tip-label"
      x={layout.mainLabelEndX}
      y={layout.y3}
      font-size={FONT_SIZE_LABEL}
      fill={COL_LABEL}
      text-anchor="end"
      dominant-baseline="central"
    >
      日本語の色相名
    </text>
    <text
      class="tip-value"
      x={layout.mainValueX}
      y={layout.y3}
      font-size={FONT_SIZE_VALUE}
      fill={COL_VALUE}
      text-anchor="start"
      dominant-baseline="central"
    >
      {active.labelJa}
    </text>

    <!-- 英語の色相名 -->
    <text
      class="tip-label"
      x={layout.mainLabelEndX}
      y={layout.y4}
      font-size={FONT_SIZE_LABEL}
      fill={COL_LABEL}
      text-anchor="end"
      dominant-baseline="central"
    >
      英語の色相名
    </text>
    <text
      class="tip-value tip-value--mono"
      x={layout.mainValueX}
      y={layout.y4}
      font-size={FONT_SIZE_VALUE}
      fill={COL_VALUE}
      text-anchor="start"
      dominant-baseline="central"
    >
      {active.labelEn}
    </text>
  </g>
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .tip-value {
    font-weight: bold;
  }

  .tip-value--mono {
    font-family: var(--font-mono);
  }

  /* ---- フォーカスリング（ToneImageDiagram を参考）---- */
  [data-hue]:focus {
    outline: none;
  }

  [data-hue]:focus .focus-ring {
    stroke: Highlight;
    stroke-width: 6;
  }
</style>
