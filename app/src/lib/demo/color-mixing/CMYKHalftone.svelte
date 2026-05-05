<script lang="ts">
  // ===== SVG dimensions =====
  const WIDTH = 360
  const HEIGHT = 360

  // ===== 色 =====
  const COL_BG = "#ffffff"
  const COL_C = "cyan"
  const COL_M = "magenta"
  const COL_Y = "yellow"
  const COL_K = "black"

  // ===== ドット =====
  const DOT_OPACITY = 1

  // ===== 半径レンジ =====
  // 全体の円サイズをまとめて調整するスケール係数（1で標準）
  const RADIUS_SCALE = 0.7
  // 大小差の度合いをまとめて調整するスケール係数（1で標準, 0で全円が平均サイズに揃う）
  const RADIUS_VARIANCE = 0.4

  // 平均値を保ったまま min/max の幅を VARIANCE 倍に伸縮し、最後に SCALE を掛ける
  function scaledRange(min: number, max: number): [number, number] {
    const center = (min + max) / 2
    const half = (max - min) / 2
    return [
      (center - half * RADIUS_VARIANCE) * RADIUS_SCALE,
      (center + half * RADIUS_VARIANCE) * RADIUS_SCALE
    ]
  }

  const [LARGE_R_MIN, LARGE_R_MAX] = scaledRange(34, 52)
  const [SMALL_R_MIN, SMALL_R_MAX] = scaledRange(12, 22)
  const [K_LARGE_R_MIN, K_LARGE_R_MAX] = scaledRange(14, 24)
  const [K_SMALL_R_MIN, K_SMALL_R_MAX] = scaledRange(4, 9)

  // ===== ドット数 =====
  // 全体の密度をまとめて調整するスケール係数（1で標準）
  const DENSITY = 2.6
  const CMY_LARGE_COUNT = Math.round(5 * DENSITY)
  const CMY_SMALL_COUNT = Math.round(10 * DENSITY)
  const K_LARGE_COUNT = Math.round(3 * DENSITY)
  const K_SMALL_COUNT = Math.round(7 * DENSITY)

  type Dot = { cx: number; cy: number; r: number }

  // 線形合同法による疑似乱数（同じシードで常に同じ列を生成する）
  function makeRng(seed: number) {
    let s = seed >>> 0
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0
      return s / 4294967296
    }
  }

  function generateDots(
    seed: number,
    largeCount: number,
    smallCount: number,
    largeMin: number,
    largeMax: number,
    smallMin: number,
    smallMax: number
  ): Dot[] {
    const rng = makeRng(seed)
    const dots: Dot[] = []
    for (let i = 0; i < largeCount; i++) {
      dots.push({
        cx: rng() * WIDTH,
        cy: rng() * HEIGHT,
        r: largeMin + rng() * (largeMax - largeMin)
      })
    }
    for (let i = 0; i < smallCount; i++) {
      dots.push({
        cx: rng() * WIDTH,
        cy: rng() * HEIGHT,
        r: smallMin + rng() * (smallMax - smallMin)
      })
    }
    return dots
  }

  const cyanDots = generateDots(
    11,
    CMY_LARGE_COUNT,
    CMY_SMALL_COUNT,
    LARGE_R_MIN,
    LARGE_R_MAX,
    SMALL_R_MIN,
    SMALL_R_MAX
  )
  const magentaDots = generateDots(
    34,
    CMY_LARGE_COUNT,
    CMY_SMALL_COUNT,
    LARGE_R_MIN,
    LARGE_R_MAX,
    SMALL_R_MIN,
    SMALL_R_MAX
  )
  const yellowDots = generateDots(
    53,
    CMY_LARGE_COUNT,
    CMY_SMALL_COUNT,
    LARGE_R_MIN,
    LARGE_R_MAX,
    SMALL_R_MIN,
    SMALL_R_MAX
  )
  const blackDots = generateDots(
    73,
    K_LARGE_COUNT,
    K_SMALL_COUNT,
    K_LARGE_R_MIN,
    K_LARGE_R_MAX,
    K_SMALL_R_MIN,
    K_SMALL_R_MAX
  )
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <clipPath id="cmyk-halftone-clip">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} />
    </clipPath>
  </defs>

  <!-- 白背景 -->
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_BG} />

  <!-- CMYKドット（重なりが減法混色になるよう multiply で合成） -->
  <g clip-path="url(#cmyk-halftone-clip)">
    <g opacity={DOT_OPACITY} style="mix-blend-mode: multiply">
      {#each cyanDots as d, i (`c-${i}`)}
        <circle cx={d.cx} cy={d.cy} r={d.r} fill={COL_C} />
      {/each}
    </g>
    <g opacity={DOT_OPACITY} style="mix-blend-mode: multiply">
      {#each magentaDots as d, i (`m-${i}`)}
        <circle cx={d.cx} cy={d.cy} r={d.r} fill={COL_M} />
      {/each}
    </g>
    <g opacity={DOT_OPACITY} style="mix-blend-mode: multiply">
      {#each yellowDots as d, i (`y-${i}`)}
        <circle cx={d.cx} cy={d.cy} r={d.r} fill={COL_Y} />
      {/each}
    </g>
    <g opacity={DOT_OPACITY} style="mix-blend-mode: multiply">
      {#each blackDots as d, i (`k-${i}`)}
        <circle cx={d.cx} cy={d.cy} r={d.r} fill={COL_K} />
      {/each}
    </g>
  </g>
</svg>
