<script lang="ts">
  // ===== SVG dimensions =====
  const WIDTH = 960
  const HEIGHT = 600

  // ===== Prism geometry (apex-up triangle) =====
  const PRISM_APEX_X = 480
  const PRISM_APEX_Y = 100
  const PRISM_BL_X = 360
  const PRISM_BL_Y = 330
  const PRISM_BR_X = 600
  const PRISM_BR_Y = 330

  // ===== Light entry point (midpoint of left face) =====
  const ENTRY_X = (PRISM_APEX_X + PRISM_BL_X) / 2
  const ENTRY_Y = (PRISM_APEX_Y + PRISM_BL_Y) / 2

  // ===== Spectrum colors (red → violet) =====
  const SPECTRUM_COLORS = [
    "#ff2020",
    "#ff8a00",
    "#ffe600",
    "#00d840",
    "#00b8ff",
    "#2440ff",
    "#a020e8"
  ]
  const N_BANDS = SPECTRUM_COLORS.length
  const BAND_INDICES = Array.from({ length: N_BANDS }, (_, i) => i)

  // ===== 各色帯の幅 (調整可能) =====
  /** プリズム内: 各色帯の幅 (右面上の t-fraction) */
  const INNER_BAND_WIDTH = 0.03
  /** プリズム外: 各色帯の幅 (キャンバス右端での pixel) */
  const OUTER_BAND_WIDTH = 25

  // ===== スペクトルの中心位置 =====
  /** プリズム内: スペクトル全体の中心 (右面上の t) */
  const INNER_T_CENTER = 0.5
  /** プリズム外: スペクトル全体の中心 (キャンバス右端での y) */
  const OUTER_Y_CENTER = 375

  // ===== 帯の境界値を生成 =====
  const INNER_T_START = INNER_T_CENTER - (N_BANDS * INNER_BAND_WIDTH) / 2
  const BAND_TS = Array.from(
    { length: N_BANDS + 1 },
    (_, i) => INNER_T_START + i * INNER_BAND_WIDTH
  )

  // ===== Incoming white light source (lower-left, light enters diagonally upward) =====
  const SOURCE_X = 40
  const SOURCE_Y = 350

  // ===== Outgoing band boundaries at canvas right edge =====
  const OUT_END_X = 920
  const OUT_END_Y_START = OUTER_Y_CENTER - (N_BANDS * OUTER_BAND_WIDTH) / 2
  const OUT_END_BOUNDARY_YS = Array.from(
    { length: N_BANDS + 1 },
    (_, i) => OUT_END_Y_START + i * OUTER_BAND_WIDTH
  )

  /** t (apex→BR) → x on right face */
  const faceX = (t: number): number => PRISM_APEX_X + t * (PRISM_BR_X - PRISM_APEX_X)
  /** t (apex→BR) → y on right face */
  const faceY = (t: number): number => PRISM_APEX_Y + t * (PRISM_BR_Y - PRISM_APEX_Y)

  // ===== Stroke widths / 効果 =====
  const STROKE_LIGHT = 3
  /** プリズム内スペクトルの霞み量 (feGaussianBlur stdDeviation) */
  const INNER_HAZE_BLUR = 2

  // ===== プリズム形状を文字列化 (polygon と clipPath で共用) =====
  const PRISM_POINTS = `${PRISM_APEX_X},${PRISM_APEX_Y} ${PRISM_BL_X},${PRISM_BL_Y} ${PRISM_BR_X},${PRISM_BR_Y}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <!-- ガラスのグラデーション (背景の黒と区別できる濃さ) -->
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#cddef3" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#5e83a8" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#a8c2dc" stop-opacity="0.75" />
    </linearGradient>

    <!-- プリズム形状でクリップ (内部スペクトルがプリズムからはみ出さないように) -->
    <clipPath id="prismClip">
      <polygon points={PRISM_POINTS} />
    </clipPath>

    <!-- ガラス内の霞み (内部スペクトルに適用) -->
    <filter id="hazy">
      <feGaussianBlur stdDeviation={INNER_HAZE_BLUR} />
    </filter>

    <!-- 入射白色光: 源 (透明) → 入射点 (白) -->
    <linearGradient
      id="whiteLight"
      gradientUnits="userSpaceOnUse"
      x1={SOURCE_X}
      y1={SOURCE_Y}
      x2={ENTRY_X}
      y2={ENTRY_Y}
    >
      <stop offset="0%" stop-color="white" stop-opacity="0" />
      <stop offset="100%" stop-color="white" stop-opacity="0.8" />
    </linearGradient>

    <!-- 内部のスペクトル帯: 入射点 (白) → 各帯の右面側中点 (色) -->
    {#each SPECTRUM_COLORS as color, i (i)}
      {@const tMid = (BAND_TS[i] + BAND_TS[i + 1]) / 2}
      <linearGradient
        id="inner-{i}"
        gradientUnits="userSpaceOnUse"
        x1={ENTRY_X}
        y1={ENTRY_Y}
        x2={faceX(tMid)}
        y2={faceY(tMid)}
      >
        <stop offset="0%" stop-color="white" stop-opacity="0.95" />
        <stop offset="100%" stop-color={color} stop-opacity="1" />
      </linearGradient>
    {/each}

    <!-- 外部のスペクトル帯: 右面 (色) → キャンバス右端 (透明) -->
    {#each SPECTRUM_COLORS as color, i (i)}
      {@const tMid = (BAND_TS[i] + BAND_TS[i + 1]) / 2}
      {@const yMid = (OUT_END_BOUNDARY_YS[i] + OUT_END_BOUNDARY_YS[i + 1]) / 2}
      <linearGradient
        id="outer-{i}"
        gradientUnits="userSpaceOnUse"
        x1={faceX(tMid)}
        y1={faceY(tMid)}
        x2={OUT_END_X}
        y2={yMid}
      >
        <stop offset="0%" stop-color={color} stop-opacity="1" />
        <stop offset="60%" stop-color={color} stop-opacity="0.85" />
        <stop offset="100%" stop-color={color} stop-opacity="0" />
      </linearGradient>
    {/each}
  </defs>

  <!-- 暗室の背景 -->
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="black" />
  
  <!-- 入射白色光 (左下から斜めにプリズムへ) -->
  <line
    x1={SOURCE_X}
    y1={SOURCE_Y}
    x2={ENTRY_X}
    y2={ENTRY_Y}
    stroke="url(#whiteLight)"
    stroke-width={STROKE_LIGHT}
    stroke-linecap="round"
  />
  
  <!-- プリズム本体 (枠線なし、塗りのみ) -->
  <polygon points={PRISM_POINTS} fill="url(#glass)" stroke="none" />

  <!-- プリズム内のスペクトル帯 (霞みフィルタ + プリズム形状でクリップ) -->
  <g clip-path="url(#prismClip)" filter="url(#hazy)">
    {#each BAND_INDICES as i (i)}
      <polygon
        points="{ENTRY_X},{ENTRY_Y} {faceX(BAND_TS[i])},{faceY(BAND_TS[i])} {faceX(BAND_TS[i + 1])},{faceY(BAND_TS[i + 1])}"
        fill="url(#inner-{i})"
      />
    {/each}
  </g>
  
  <!-- プリズムから出るスペクトル帯 (右面のセグメントが幅広に広がる帯になる) -->
  {#each BAND_INDICES as i (i)}
    <polygon
      points="{faceX(BAND_TS[i])},{faceY(BAND_TS[i])} {faceX(BAND_TS[i + 1])},{faceY(BAND_TS[i + 1])} {OUT_END_X},{OUT_END_BOUNDARY_YS[i + 1]} {OUT_END_X},{OUT_END_BOUNDARY_YS[i]}"
      fill="url(#outer-{i})"
      fill-opacity="0.9"
    />
  {/each}
</svg>
