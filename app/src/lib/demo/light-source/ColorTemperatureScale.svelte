<script lang="ts">
  import chroma from "chroma-js"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface NamePart {
    text: string
    ankiHide?: boolean // true なら暗記モードで非表示（スペースは保持）
  }

  interface LightMarker {
    nameLines: NamePart[][] // 行 × 各行のセグメント
    temp: number
  }

  // ===== SVG dimensions =====
  const WIDTH = 1100
  const HEIGHT = 380

  // ===== Strip layout =====
  const STRIP_LEFT = 150
  const STRIP_RIGHT = 950
  const STRIP_WIDTH = STRIP_RIGHT - STRIP_LEFT
  const STRIP_HEIGHT = 64
  const STRIP_Y = (HEIGHT - STRIP_HEIGHT) / 2

  // ===== 色温度の範囲 =====
  const TEMP_MIN = 1500
  const TEMP_MAX = 12500

  // ===== グラデーション =====
  const GRADIENT_SAMPLE_COUNT = 23 // 1500K → 12500K を 500K 刻みでサンプル

  // ===== Tick / label sizes =====
  const TICK_LENGTH = 12
  const STROKE_WIDTH_TICK = 1.5
  const GAP_TICK_TO_LABEL = 6
  const LINE_HEIGHT_LABEL = 28
  const FONT_SIZE_MARKER_LABEL = 18
  const FONT_SIZE_SIDE_LABEL = 22
  const FONT_SIZE_GROUP_TITLE = 24

  // ===== 波括弧の形状 =====
  const BRACE_STROKE_WIDTH = 2
  const BRACE_CORNER_R = 8 // 端と中央コブの曲がりの半径
  const BRACE_HEIGHT = 18 // 足元から頂点までの距離
  const BRACE_LABEL_GAP = 24 // 波括弧の足元と近接ラベル中心の隙間
  const BRACE_TITLE_GAP = 24 // 波括弧の頂点とタイトル中心の隙間

  // ===== サイドラベルの位置 =====
  const SIDE_LABEL_X_GAP = 18

  // ===== Colors =====
  const COL_BODY = "var(--color-body)"
  // サイドラベル（低/高）は帯の両端の色を使う
  const COL_LOW_END = chroma.temperature(TEMP_MIN).hex()
  const COL_HIGH_END = chroma.temperature(TEMP_MAX).hex()

  // ===== 色温度 → X座標 =====
  const xAt = (temp: number): number =>
    STRIP_LEFT + ((temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * STRIP_WIDTH

  // ===== グラデーションストップ生成 =====
  const gradientStops = Array.from({ length: GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (GRADIENT_SAMPLE_COUNT - 1)
    const temp = TEMP_MIN + t * (TEMP_MAX - TEMP_MIN)
    return {
      offset: t,
      color: chroma.temperature(temp).hex()
    }
  })

  // ===== 主要な自然光（帯の上） =====
  const naturalLights: LightMarker[] = [
    { nameLines: [[{ text: "地平線の" }], [{ text: "太陽光" }]], temp: 1580 },
    { nameLines: [[{ text: "天頂の" }], [{ text: "太陽光" }]], temp: 5250 },
    { nameLines: [[{ text: "日中の" }], [{ text: "北窓の光" }]], temp: 6500 },
    { nameLines: [[{ text: "晴天の" }], [{ text: "青空" }]], temp: 12000 }
  ]

  // ===== 主要な蛍光ランプ（帯の下） =====
  // 「色」以外の部分を暗記モードで非表示にする
  const fluorescentLamps: LightMarker[] = [
    { nameLines: [[{ text: "電球", ankiHide: true }, { text: "色" }]], temp: 3000 },
    { nameLines: [[{ text: "白", ankiHide: true }, { text: "色" }]], temp: 4000 },
    { nameLines: [[{ text: "昼白", ankiHide: true }, { text: "色" }]], temp: 5000 },
    { nameLines: [[{ text: "昼光", ankiHide: true }, { text: "色" }]], temp: 6500 }
  ]

  // ===== ラベルのY位置 =====
  // 帯の上：（外側）名前 → 色温度（内側、帯寄り）
  // 名前が複数行の場合、temp に近い行から順に積み上げる
  const TOP_TEMP_Y = STRIP_Y - TICK_LENGTH - GAP_TICK_TO_LABEL - LINE_HEIGHT_LABEL / 2
  // 帯の下：（内側、帯寄り）色温度 → 名前（外側）
  const BOTTOM_TEMP_Y =
    STRIP_Y + STRIP_HEIGHT + TICK_LENGTH + GAP_TICK_TO_LABEL + LINE_HEIGHT_LABEL / 2

  // ===== セクション波括弧 / タイトル位置 =====
  const maxTopNameLines = Math.max(...naturalLights.map((l) => l.nameLines.length))
  const maxBottomNameLines = Math.max(...fluorescentLamps.map((l) => l.nameLines.length))

  // 帯の上：最上段ラベルから外側へ向かって 波括弧足元 → 波括弧頂点 → タイトル
  const TOP_TOPMOST_LABEL_Y = TOP_TEMP_Y - LINE_HEIGHT_LABEL * maxTopNameLines
  const TOP_BRACE_FEET_Y = TOP_TOPMOST_LABEL_Y - BRACE_LABEL_GAP
  const TOP_BRACE_PEAK_Y = TOP_BRACE_FEET_Y - BRACE_HEIGHT
  const TOP_TITLE_Y = TOP_BRACE_PEAK_Y - BRACE_TITLE_GAP

  // 帯の下：最下段ラベルから外側へ向かって 波括弧足元 → 波括弧頂点 → タイトル
  const BOTTOM_BOTTOMMOST_LABEL_Y = BOTTOM_TEMP_Y + LINE_HEIGHT_LABEL * maxBottomNameLines
  const BOTTOM_BRACE_FEET_Y = BOTTOM_BOTTOMMOST_LABEL_Y + BRACE_LABEL_GAP
  const BOTTOM_BRACE_PEAK_Y = BOTTOM_BRACE_FEET_Y + BRACE_HEIGHT
  const BOTTOM_TITLE_Y = BOTTOM_BRACE_PEAK_Y + BRACE_TITLE_GAP

  const naturalBraceStartX = xAt(naturalLights[0].temp)
  const naturalBraceEndX = xAt(naturalLights[naturalLights.length - 1].temp)
  const fluorescentBraceStartX = xAt(fluorescentLamps[0].temp)
  const fluorescentBraceEndX = xAt(fluorescentLamps[fluorescentLamps.length - 1].temp)

  // タイトルのX位置は各波括弧の中央
  const TOP_TITLE_X = (naturalBraceStartX + naturalBraceEndX) / 2
  const BOTTOM_TITLE_X = (fluorescentBraceStartX + fluorescentBraceEndX) / 2

  // 波括弧パス：xL〜xR を範囲とし、両端を yFeet、中央頂点を yPeak に置く
  // yPeak < yFeet なら上向き（頂点が上）、yPeak > yFeet なら下向き（頂点が下）
  const bracePath = (xL: number, xR: number, yFeet: number, yPeak: number): string => {
    const xM = (xL + xR) / 2
    const r = BRACE_CORNER_R
    const yShoulder = yFeet + (yPeak < yFeet ? -r : r)
    return [
      `M ${xL} ${yFeet}`,
      `Q ${xL} ${yShoulder} ${xL + r} ${yShoulder}`,
      `L ${xM - r} ${yShoulder}`,
      `Q ${xM} ${yShoulder} ${xM} ${yPeak}`,
      `Q ${xM} ${yShoulder} ${xM + r} ${yShoulder}`,
      `L ${xR - r} ${yShoulder}`,
      `Q ${xR} ${yShoulder} ${xR} ${yFeet}`
    ].join(" ")
  }

  // ===== サイドラベルのY位置 =====
  const SIDE_LABEL_CENTER_Y = STRIP_Y + STRIP_HEIGHT / 2

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="color-temperature-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
  </defs>

  <!-- 帯（色温度のグラデーション） -->
  <rect
    x={STRIP_LEFT}
    y={STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#color-temperature-gradient)"
  />

  <!-- 左側ラベル：低（帯の左端の色） -->
  <text
    x={STRIP_LEFT - SIDE_LABEL_X_GAP}
    y={SIDE_LABEL_CENTER_Y}
    fill={COL_LOW_END}
    font-size={FONT_SIZE_SIDE_LABEL}
    text-anchor="end"
    dominant-baseline="central"
  >
    {isAnki ? "" : "低"}
  </text>

  <!-- 右側ラベル：高（帯の右端の色） -->
  <text
    x={STRIP_RIGHT + SIDE_LABEL_X_GAP}
    y={SIDE_LABEL_CENTER_Y}
    fill={COL_HIGH_END}
    font-size={FONT_SIZE_SIDE_LABEL}
    text-anchor="start"
    dominant-baseline="central"
  >
    {isAnki ? "" : "高"}
  </text>

  <!-- セクションタイトル -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_GROUP_TITLE}
    font-weight="bold"
    text-anchor="middle"
    dominant-baseline="central"
  >
    <text x={TOP_TITLE_X} y={TOP_TITLE_Y}>自然光</text>
    <text x={BOTTOM_TITLE_X} y={BOTTOM_TITLE_Y}>蛍光ランプ</text>
  </g>

  <!-- セクション波括弧（最初と最後の目盛りを範囲として表す） -->
  <g
    stroke={COL_BODY}
    stroke-width={BRACE_STROKE_WIDTH}
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d={bracePath(naturalBraceStartX, naturalBraceEndX, TOP_BRACE_FEET_Y, TOP_BRACE_PEAK_Y)} />
    <path
      d={bracePath(
        fluorescentBraceStartX,
        fluorescentBraceEndX,
        BOTTOM_BRACE_FEET_Y,
        BOTTOM_BRACE_PEAK_Y
      )}
    />
  </g>

  <!-- 自然光（帯の上） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_MARKER_LABEL}
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each naturalLights as item (item.temp)}
      {@const x = xAt(item.temp)}
      {@const lineCount = item.nameLines.length}
      <line
        x1={x}
        y1={STRIP_Y}
        x2={x}
        y2={STRIP_Y - TICK_LENGTH}
        stroke={COL_BODY}
        stroke-width={STROKE_WIDTH_TICK}
      />
      {#each item.nameLines as line, i (i)}
        <text {x} y={TOP_TEMP_Y - LINE_HEIGHT_LABEL * (lineCount - i)}>
          {#each line as part, j (j)}<tspan
              visibility={part.ankiHide && isAnki ? "hidden" : "visible"}
            >
              {part.text}
            </tspan>{/each}
        </text>
      {/each}
      <text {x} y={TOP_TEMP_Y}>
        <tspan visibility={isAnki ? "hidden" : "visible"}>{item.temp}</tspan>
        K
      </text>
    {/each}
  </g>

  <!-- 蛍光ランプ（帯の下） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_MARKER_LABEL}
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each fluorescentLamps as item (item.temp)}
      {@const x = xAt(item.temp)}
      <line
        x1={x}
        y1={STRIP_Y + STRIP_HEIGHT}
        x2={x}
        y2={STRIP_Y + STRIP_HEIGHT + TICK_LENGTH}
        stroke={COL_BODY}
        stroke-width={STROKE_WIDTH_TICK}
      />
      <text {x} y={BOTTOM_TEMP_Y}>
        <tspan visibility={isAnki ? "hidden" : "visible"}>{item.temp}</tspan>
        K
      </text>
      {#each item.nameLines as line, i (i)}
        <text {x} y={BOTTOM_TEMP_Y + LINE_HEIGHT_LABEL * (i + 1)}>
          {#each line as part, j (j)}<tspan
              visibility={part.ankiHide && isAnki ? "hidden" : "visible"}
            >
              {part.text}
            </tspan>{/each}
        </text>
      {/each}
    {/each}
  </g>
</svg>
