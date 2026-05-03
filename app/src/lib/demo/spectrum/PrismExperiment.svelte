<script lang="ts">
  // ===== SVG dimensions =====
  const WIDTH = 960
  const HEIGHT = 500

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
  const OUTER_BAND_WIDTH = 20

  // ===== スペクトルの中心位置 =====
  /** プリズム内: スペクトル全体の中心 (右面上の t) */
  const INNER_T_CENTER = 0.5
  /** プリズム外: スペクトル全体の中心 (キャンバス右端での y) */
  const OUTER_Y_CENTER = 375

  // ===== 帯の境界値を生成 =====
  const INNER_T_START = INNER_T_CENTER - (N_BANDS * INNER_BAND_WIDTH) / 2
  const INNER_T_END = INNER_T_START + N_BANDS * INNER_BAND_WIDTH
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
  const STROKE_LIGHT = 4
  /** プリズム内スペクトルの霞み量 (feGaussianBlur stdDeviation) */
  const INNER_HAZE_BLUR = 2

  // ===== 入射点を入射光と同じ幅の線分として扱う (左端の幅を白色光に合わせる) =====
  const LIGHT_DX = ENTRY_X - SOURCE_X
  const LIGHT_DY = ENTRY_Y - SOURCE_Y
  const LIGHT_LEN = Math.hypot(LIGHT_DX, LIGHT_DY)
  /** 入射光に直交する単位ベクトル × 半幅 (画面上 "上" 方向を正とする) */
  const ENTRY_PERP_X = (LIGHT_DY / LIGHT_LEN) * (STROKE_LIGHT / 2)
  const ENTRY_PERP_Y = (-LIGHT_DX / LIGHT_LEN) * (STROKE_LIGHT / 2)
  /** 入射線分の上端 (画面上の上側 = 小さい y、赤側) と下端 (紫側) */
  const ENTRY_TOP_X = ENTRY_X + ENTRY_PERP_X
  const ENTRY_TOP_Y = ENTRY_Y + ENTRY_PERP_Y
  const ENTRY_BOT_X = ENTRY_X - ENTRY_PERP_X
  const ENTRY_BOT_Y = ENTRY_Y - ENTRY_PERP_Y
  /** 入射線分上の i 番目 (0..N_BANDS) の境界点 */
  const entryBoundaryX = (i: number): number =>
    ENTRY_TOP_X + (i / N_BANDS) * (ENTRY_BOT_X - ENTRY_TOP_X)
  const entryBoundaryY = (i: number): number =>
    ENTRY_TOP_Y + (i / N_BANDS) * (ENTRY_BOT_Y - ENTRY_TOP_Y)

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

    <!-- ガラス内の霞み (内部スペクトル "blurred" 層に適用) -->
    <filter id="hazy">
      <feGaussianBlur stdDeviation={INNER_HAZE_BLUR} />
    </filter>

    <!-- シャープ層用マスク: 入射点 (白=表示) → 右面 (黒=非表示) -->
    <linearGradient
      id="sharpMaskGrad"
      gradientUnits="userSpaceOnUse"
      x1={ENTRY_X}
      y1={ENTRY_Y}
      x2={faceX(INNER_T_END)}
      y2={faceY(INNER_T_END)}
    >
      <stop offset="0" stop-color="white" />
      <stop offset="1" stop-color="black" />
    </linearGradient>
    <mask id="sharpMask">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#sharpMaskGrad)" />
    </mask>

    <!-- 入射白色光: 源 (透明) → 入射点 (白) -->
    <linearGradient
      id="whiteLight"
      gradientUnits="userSpaceOnUse"
      x1={SOURCE_X}
      y1={SOURCE_Y}
      x2={ENTRY_X}
      y2={ENTRY_Y}
    >
      <stop offset="0" stop-color="white" stop-opacity="0" />
      <stop offset="1" stop-color="white" stop-opacity="0.8" />
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

  <!-- プリズム本体 (枠線なし、塗りのみ) -->
  <polygon points={PRISM_POINTS} fill="url(#glass)" stroke="none" />

  <!-- 内部スペクトル (blurred 層): プリズム全体に霞みを敷く -->
  <g clip-path="url(#prismClip)" filter="url(#hazy)">
    {#each BAND_INDICES as i (i)}
      <polygon
        points="{entryBoundaryX(i)},{entryBoundaryY(i)} {faceX(BAND_TS[i])},{faceY(
          BAND_TS[i]
        )} {faceX(BAND_TS[i + 1])},{faceY(BAND_TS[i + 1])} {entryBoundaryX(i + 1)},{entryBoundaryY(
          i + 1
        )}"
        fill="url(#inner-{i})"
      />
    {/each}
  </g>

  <!-- 内部スペクトル (sharp 層): マスクで入射点側のみ上書きし、左端を鮮明に -->
  <g clip-path="url(#prismClip)" mask="url(#sharpMask)">
    {#each BAND_INDICES as i (i)}
      <polygon
        points="{entryBoundaryX(i)},{entryBoundaryY(i)} {faceX(BAND_TS[i])},{faceY(
          BAND_TS[i]
        )} {faceX(BAND_TS[i + 1])},{faceY(BAND_TS[i + 1])} {entryBoundaryX(i + 1)},{entryBoundaryY(
          i + 1
        )}"
        fill="url(#inner-{i})"
      />
    {/each}
  </g>

  <!-- プリズムから出るスペクトル帯 -->
  {#each BAND_INDICES as i (i)}
    <polygon
      points="{faceX(BAND_TS[i])},{faceY(BAND_TS[i])} {faceX(BAND_TS[i + 1])},{faceY(
        BAND_TS[i + 1]
      )} {OUT_END_X},{OUT_END_BOUNDARY_YS[i + 1]} {OUT_END_X},{OUT_END_BOUNDARY_YS[i]}"
      fill="url(#outer-{i})"
      fill-opacity="0.9"
    />
  {/each}

  <!-- 入射白色光 (入射点で終端、最後に描画してシャープな先端を保つ) -->
  <line
    x1={SOURCE_X}
    y1={SOURCE_Y}
    x2={ENTRY_X}
    y2={ENTRY_Y}
    stroke="url(#whiteLight)"
    stroke-width={STROKE_LIGHT}
    stroke-linecap="round"
  />
</svg>
