<script lang="ts">
  import chroma from "chroma-js"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface AmbiencePart {
    text: string
    ankiHide?: boolean // true なら暗記モードで非表示（スペースは保持）
  }

  interface Ambience {
    lines: AmbiencePart[][] // 行 × 各行のセグメント
    t: number // 帯上の相対位置（0〜1）
  }

  // ===== Strip layout =====
  // STRIP_LEFT / STRIP_RIGHT / WIDTH / HEIGHT は他の値から自動算出する（下部）
  const STRIP_WIDTH = 800
  const STRIP_HEIGHT = 64

  // ===== 色温度の範囲 =====
  const TEMP_MIN = 1500
  const TEMP_MAX = 12500

  // ===== グラデーション =====
  const TEMP_GRADIENT_SAMPLE_COUNT = 23 // 1500K → 12500K を 500K 刻みでサンプル
  const ILLUM_GRADIENT_SAMPLE_COUNT = 16
  // 照度帯：左端＝濃いめのグレイ（低照度）／右端＝白に近い薄いグレイ（高照度）
  const COL_GRADIENT_DARK = "#6b6b6b"
  const COL_GRADIENT_LIGHT = "#f0f0f0"

  // ===== ラベルのフォントサイズ =====
  const FONT_SIZE_AMBIENCE = 20
  const FONT_SIZE_SIDE = 22

  // ===== 隙間・行高 =====
  const LINE_HEIGHT_AMBIENCE = 28
  const GAP_STRIP_TO_AMBIENCE = 18 // 色温度帯の下端と雰囲気ラベルブロック上端の隙間
  const GAP_AMBIENCE_TO_STRIP = 18 // 雰囲気ラベルブロック下端と照度帯上端の隙間
  const SIDE_LABEL_GAP = 18 // 帯端とサイドラベル（高／低）の隙間

  // ===== 外側パディング =====
  const PADDING_VERTICAL = 8
  const PADDING_HORIZONTAL = 4

  // ===== Colors =====
  const COL_BODY = "var(--color-body)"
  // 色温度帯のサイドラベル（低／高）は帯の両端の色を使う
  const COL_TEMP_LOW_END = chroma.temperature(TEMP_MIN).hex()
  const COL_TEMP_HIGH_END = chroma.temperature(TEMP_MAX).hex()

  // ===== グラデーションストップ生成 =====
  const tempGradientStops = Array.from({ length: TEMP_GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (TEMP_GRADIENT_SAMPLE_COUNT - 1)
    const temp = TEMP_MIN + t * (TEMP_MAX - TEMP_MIN)
    return { offset: t, color: chroma.temperature(temp).hex() }
  })

  const illumScale = chroma.scale([COL_GRADIENT_DARK, COL_GRADIENT_LIGHT]).mode("lab")
  const illumGradientStops = Array.from({ length: ILLUM_GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (ILLUM_GRADIENT_SAMPLE_COUNT - 1)
    return { offset: t, color: illumScale(t).hex() }
  })

  // ===== 雰囲気ラベル（色温度帯の下） =====
  // 「雰囲気」以外の部分を暗記モードで非表示にする
  const ambiences: Ambience[] = [
    {
      t: 1 / 6,
      lines: [
        [{ text: "あたたかく", ankiHide: true }],
        [{ text: "落ち着いた", ankiHide: true }, { text: "雰囲気" }]
      ]
    },
    {
      t: 1 / 2,
      lines: [[{ text: "自然な", ankiHide: true }, { text: "雰囲気" }]]
    },
    {
      t: 5 / 6,
      lines: [
        [{ text: "クール・", ankiHide: true }],
        [{ text: "さわやかな", ankiHide: true }, { text: "雰囲気" }]
      ]
    }
  ]

  const maxAmbienceLines = Math.max(...ambiences.map((a) => a.lines.length))

  // ===== 横方向のはみ出し量 =====
  // 雰囲気ラベルは帯内に収まる前提。はみ出すのは両端のサイドラベル（高／低・1文字想定）
  const SIDE_LABEL_OVERHANG = SIDE_LABEL_GAP + FONT_SIZE_SIDE
  const STRIP_LEFT = SIDE_LABEL_OVERHANG + PADDING_HORIZONTAL
  const STRIP_RIGHT = STRIP_LEFT + STRIP_WIDTH
  const WIDTH = STRIP_RIGHT + SIDE_LABEL_OVERHANG + PADDING_HORIZONTAL

  // ===== 縦方向の位置 =====
  // 上から：色温度帯 → 雰囲気ラベル → 照度帯
  const TEMP_STRIP_Y = PADDING_VERTICAL

  const AMBIENCE_BLOCK_TOP = TEMP_STRIP_Y + STRIP_HEIGHT + GAP_STRIP_TO_AMBIENCE
  const AMBIENCE_BLOCK_HEIGHT =
    LINE_HEIGHT_AMBIENCE * (maxAmbienceLines - 1) + FONT_SIZE_AMBIENCE
  const AMBIENCE_BLOCK_CENTER_Y = AMBIENCE_BLOCK_TOP + AMBIENCE_BLOCK_HEIGHT / 2

  const ILLUM_STRIP_Y = AMBIENCE_BLOCK_TOP + AMBIENCE_BLOCK_HEIGHT + GAP_AMBIENCE_TO_STRIP
  const HEIGHT = ILLUM_STRIP_Y + STRIP_HEIGHT + PADDING_VERTICAL

  // ===== 相対位置 → X座標 =====
  const xAt = (t: number): number => STRIP_LEFT + t * STRIP_WIDTH

  // 行数の異なる雰囲気ラベルをブロック中央に揃えるための1行目中心Y
  const ambienceFirstLineY = (lineCount: number): number =>
    AMBIENCE_BLOCK_CENTER_Y - (LINE_HEIGHT_AMBIENCE * (lineCount - 1)) / 2

  // サイドラベルは各帯の縦中央に揃える
  const TEMP_SIDE_LABEL_Y = TEMP_STRIP_Y + STRIP_HEIGHT / 2
  const ILLUM_SIDE_LABEL_Y = ILLUM_STRIP_Y + STRIP_HEIGHT / 2

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="cti-temperature-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each tempGradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
    <linearGradient id="cti-illuminance-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each illumGradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
  </defs>

  <!-- 色温度のグラデーション帯 -->
  <rect
    x={STRIP_LEFT}
    y={TEMP_STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#cti-temperature-gradient)"
  />

  <!-- 色温度帯のサイドラベル：左＝低（暖色端の色）／右＝高（寒色端の色） -->
  <text
    x={STRIP_LEFT - SIDE_LABEL_GAP}
    y={TEMP_SIDE_LABEL_Y}
    fill={COL_TEMP_LOW_END}
    font-size={FONT_SIZE_SIDE}
    font-weight="bold"
    text-anchor="end"
    dominant-baseline="central"
  >
    {isAnki ? "" : "低"}
  </text>
  <text
    x={STRIP_RIGHT + SIDE_LABEL_GAP}
    y={TEMP_SIDE_LABEL_Y}
    fill={COL_TEMP_HIGH_END}
    font-size={FONT_SIZE_SIDE}
    font-weight="bold"
    text-anchor="start"
    dominant-baseline="central"
  >
    {isAnki ? "" : "高"}
  </text>

  <!-- 雰囲気ラベル（色温度帯の下／暗記モードでは「雰囲気」以外を非表示） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_AMBIENCE}
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each ambiences as item (item.t)}
      {@const x = xAt(item.t)}
      {@const lineCount = item.lines.length}
      {#each item.lines as line, i (i)}
        <text {x} y={ambienceFirstLineY(lineCount) + LINE_HEIGHT_AMBIENCE * i}>
          {#each line as part, j (j)}<tspan
              visibility={part.ankiHide && isAnki ? "hidden" : "visible"}>{part.text}</tspan
            >{/each}
        </text>
      {/each}
    {/each}
  </g>

  <!-- 照度のグラデーション帯 -->
  <rect
    x={STRIP_LEFT}
    y={ILLUM_STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#cti-illuminance-gradient)"
  />

  <!-- 照度帯のサイドラベル：左＝低／右＝高 -->
  <g fill={COL_BODY} font-size={FONT_SIZE_SIDE} font-weight="bold" dominant-baseline="central">
    <text x={STRIP_LEFT - SIDE_LABEL_GAP} y={ILLUM_SIDE_LABEL_Y} text-anchor="end">
      {isAnki ? "" : "低"}
    </text>
    <text x={STRIP_RIGHT + SIDE_LABEL_GAP} y={ILLUM_SIDE_LABEL_Y} text-anchor="start">
      {isAnki ? "" : "高"}
    </text>
  </g>
</svg>
