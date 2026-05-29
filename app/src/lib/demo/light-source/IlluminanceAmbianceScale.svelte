<script lang="ts">
  import chroma from "chroma-js"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface Illuminance {
    value: number
    t: number // 帯上の相対位置（0〜1）
  }

  interface Usage {
    lines: string[]
    t: number // 帯上の相対位置（0〜1）
  }

  // ===== Strip layout =====
  // STRIP_LEFT / STRIP_RIGHT / WIDTH / HEIGHT は他の値から自動算出する（下部）
  const STRIP_WIDTH = 800
  const STRIP_HEIGHT = 64

  // ===== グラデーション =====
  const GRADIENT_SAMPLE_COUNT = 16
  // 左端＝濃いめのグレイ（低照度）／右端＝白に近い薄いグレイ（高照度）
  const COL_GRADIENT_DARK = "#6b6b6b"
  const COL_GRADIENT_LIGHT = "#f0f0f0"

  // ===== ラベルのフォントサイズ =====
  const FONT_SIZE_NUM = 22
  const FONT_SIZE_USAGE = 18
  const FONT_SIZE_SIDE = 20
  const FONT_SIZE_UNIT = 18

  // ===== 単位ラベル =====
  const UNIT_LABEL = "(lx)"
  const GAP_NUM_TO_UNIT = 6 // 「800」ラベルと単位ラベルの隙間

  // ===== 隙間・行高 =====
  const GAP_STRIP_TO_NUM = 18 // 帯の下端と照度ラベル上端の隙間
  const GAP_NUM_TO_USAGE = 20 // 照度ラベル下端と使用例1行目中心の隙間
  const LINE_HEIGHT = 26 // 使用例・サイドラベルの行間
  const SIDE_LABEL_GAP = 24 // 帯端とサイドラベルの隙間

  // ===== 矢印 =====
  const COL_ARROW = "var(--color-body)"
  const ARROW_STROKE_WIDTH = 2
  const ARROW_GAP = 14 // 照度ラベルと矢印端の隙間
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 20 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 外側パディング =====
  const PADDING_VERTICAL = 8
  const PADDING_HORIZONTAL = 4

  // ===== Colors =====
  const COL_BODY = "var(--color-body)"

  // ===== グラデーションストップ生成 =====
  const grayScale = chroma.scale([COL_GRADIENT_DARK, COL_GRADIENT_LIGHT]).mode("lab")
  const gradientStops = Array.from({ length: GRADIENT_SAMPLE_COUNT }, (_, i) => {
    const t = i / (GRADIENT_SAMPLE_COUNT - 1)
    return { offset: t, color: grayScale(t).hex() }
  })

  // ===== 照度ラベル（帯の下） =====
  const illuminances: Illuminance[] = [
    { value: 50, t: 0 },
    { value: 100, t: 1 / 3 },
    { value: 300, t: 2 / 3 },
    { value: 800, t: 1 }
  ]

  // ===== 照明の使用例（照度ラベルのさらに下） =====
  const usages: Usage[] = [
    { lines: ["飲食店"], t: 0 },
    { lines: ["ホテル", "ロビー"], t: 1 / 6 },
    { lines: ["集合住宅", "エントランス"], t: 1 / 3 },
    { lines: ["オフィス", "共用部分"], t: 2 / 3 },
    { lines: ["物販", "店舗"], t: 5 / 6 },
    { lines: ["大型", "店舗"], t: 1 }
  ]

  // ===== サイドラベル =====
  // 「空間」以外の行を暗記モードで非表示にする
  interface SideLine {
    text: string
    ankiHide?: boolean
  }
  const sideLeftLines: SideLine[] = [{ text: "落ち着いた", ankiHide: true }, { text: "空間" }]
  const sideRightLines: SideLine[] = [{ text: "開放的な", ankiHide: true }, { text: "空間" }]

  const maxUsageLines = Math.max(...usages.map((u) => u.lines.length))

  // ===== 文字幅の概算（全角＝フォントサイズ／半角＝フォントサイズ×0.6） =====
  const estimateCharWidth = (ch: string, fontSize: number): number => {
    const code = ch.charCodeAt(0)
    const isFullWidth = (code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef)
    return isFullWidth ? fontSize : fontSize * 0.6
  }
  const estimateTextWidth = (s: string, fontSize: number): number =>
    [...s].reduce((sum, ch) => sum + estimateCharWidth(ch, fontSize), 0)

  const numHalfWidth = (value: number): number =>
    estimateTextWidth(String(value), FONT_SIZE_NUM) / 2
  const usageHalfWidth = (u: Usage): number =>
    Math.max(...u.lines.map((l) => estimateTextWidth(l, FONT_SIZE_USAGE))) / 2
  const sideLeftWidth = Math.max(
    ...sideLeftLines.map((l) => estimateTextWidth(l.text, FONT_SIZE_SIDE))
  )
  const sideRightWidth = Math.max(
    ...sideRightLines.map((l) => estimateTextWidth(l.text, FONT_SIZE_SIDE))
  )

  // ===== 横方向のはみ出し量を集計 =====
  // 照度ラベル・使用例ラベルは帯内に収めるため、はみ出すのはサイドラベルと単位ラベル
  const unitOverhang = GAP_NUM_TO_UNIT + estimateTextWidth(UNIT_LABEL, FONT_SIZE_UNIT)
  const LEFT_OVERHANG = SIDE_LABEL_GAP + sideLeftWidth + PADDING_HORIZONTAL
  const RIGHT_OVERHANG =
    Math.max(SIDE_LABEL_GAP + sideRightWidth, unitOverhang) + PADDING_HORIZONTAL

  const STRIP_LEFT = LEFT_OVERHANG
  const STRIP_RIGHT = STRIP_LEFT + STRIP_WIDTH
  const WIDTH = STRIP_RIGHT + RIGHT_OVERHANG

  // ===== 縦方向の位置 =====
  // 上から：帯 → 照度ラベル（＋矢印） → 使用例
  const STRIP_Y = PADDING_VERTICAL
  const NUM_LABEL_CENTER_Y = STRIP_Y + STRIP_HEIGHT + GAP_STRIP_TO_NUM + FONT_SIZE_NUM / 2
  const USAGE_TOP_Y =
    NUM_LABEL_CENTER_Y + FONT_SIZE_NUM / 2 + GAP_NUM_TO_USAGE + FONT_SIZE_USAGE / 2 // 使用例1行目の中心
  // サイドラベルは帯の縦中央に揃える
  const SIDE_LABEL_CENTER_Y = STRIP_Y + STRIP_HEIGHT / 2
  const HEIGHT =
    USAGE_TOP_Y + LINE_HEIGHT * (maxUsageLines - 1) + FONT_SIZE_USAGE / 2 + PADDING_VERTICAL

  // ===== 相対位置 → X座標 =====
  const xAt = (t: number): number => STRIP_LEFT + t * STRIP_WIDTH

  // 帯の左右端からはみ出さないように中心Xをクランプする
  const clampToStrip = (x: number, half: number): number =>
    Math.min(Math.max(x, STRIP_LEFT + half), STRIP_RIGHT - half)

  const numXAt = (d: Illuminance): number => clampToStrip(xAt(d.t), numHalfWidth(d.value))
  const usageXAt = (u: Usage): number => clampToStrip(xAt(u.t), usageHalfWidth(u))

  // ===== 照度ラベル間の矢印 =====
  const arrows = illuminances.slice(0, -1).map((d, i) => {
    const next = illuminances[i + 1]
    return {
      x1: numXAt(d) + numHalfWidth(d.value) + ARROW_GAP,
      x2: numXAt(next) - numHalfWidth(next.value) - ARROW_GAP,
      y: NUM_LABEL_CENTER_Y
    }
  })

  // 単位ラベル（「800」の右側）の左端X
  const lastIlluminance = illuminances[illuminances.length - 1]
  const UNIT_LABEL_X =
    numXAt(lastIlluminance) + numHalfWidth(lastIlluminance.value) + GAP_NUM_TO_UNIT

  // サイドラベル1行目の中心Y（複数行を中央揃え）
  const sideLineTopY = (lineCount: number): number =>
    SIDE_LABEL_CENTER_Y - (LINE_HEIGHT * (lineCount - 1)) / 2

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="illuminance-gradient" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
    <marker
      id="illuminance-arrow-end"
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

  <!-- 帯（照度のグラデーション） -->
  <rect
    x={STRIP_LEFT}
    y={STRIP_Y}
    width={STRIP_WIDTH}
    height={STRIP_HEIGHT}
    fill="url(#illuminance-gradient)"
  />

  <!-- 照度ラベル間の矢印 -->
  {#each arrows as arrow, i (i)}
    <line
      x1={arrow.x1}
      y1={arrow.y}
      x2={arrow.x2}
      y2={arrow.y}
      stroke={COL_ARROW}
      stroke-width={ARROW_STROKE_WIDTH}
      stroke-linecap="round"
      marker-end="url(#illuminance-arrow-end)"
    />
  {/each}

  <!-- 照度の数値ラベル（帯の下） -->
  <g
    fill={COL_BODY}
    font-size={FONT_SIZE_NUM}
    font-weight="bold"
    text-anchor="middle"
    dominant-baseline="central"
  >
    {#each illuminances as d (d.value)}
      <text x={numXAt(d)} y={NUM_LABEL_CENTER_Y}>{d.value}</text>
    {/each}
    <text
      x={UNIT_LABEL_X}
      y={NUM_LABEL_CENTER_Y}
      font-size={FONT_SIZE_UNIT}
      font-weight="bold"
      text-anchor="start"
    >
      {UNIT_LABEL}
    </text>
  </g>

  <!-- 照明の使用例（照度ラベルのさらに下／暗記モードで非表示） -->
  <g fill={COL_BODY} font-size={FONT_SIZE_USAGE} text-anchor="middle" dominant-baseline="central">
    {#each usages as u (u.t)}
      {@const x = usageXAt(u)}
      {#each u.lines as line, i (i)}
        <text {x} y={USAGE_TOP_Y + LINE_HEIGHT * i} visibility={isAnki ? "hidden" : "visible"}>
          {line}
        </text>
      {/each}
    {/each}
  </g>

  <!-- サイドラベル（帯の両端／暗記モードでは「空間」以外を非表示） -->
  <g fill={COL_BODY} font-size={FONT_SIZE_SIDE} font-weight="bold" dominant-baseline="central">
    {#each sideLeftLines as line, i (i)}
      <text
        x={STRIP_LEFT - SIDE_LABEL_GAP - sideLeftWidth / 2}
        y={sideLineTopY(sideLeftLines.length) + LINE_HEIGHT * i}
        text-anchor="middle"
        visibility={line.ankiHide && isAnki ? "hidden" : "visible"}
      >
        {line.text}
      </text>
    {/each}
    {#each sideRightLines as line, i (i)}
      <text
        x={STRIP_RIGHT + SIDE_LABEL_GAP + sideRightWidth / 2}
        y={sideLineTopY(sideRightLines.length) + LINE_HEIGHT * i}
        text-anchor="middle"
        visibility={line.ankiHide && isAnki ? "hidden" : "visible"}
      >
        {line.text}
      </text>
    {/each}
  </g>
</svg>
