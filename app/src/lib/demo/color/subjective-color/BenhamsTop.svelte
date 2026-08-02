<script lang="ts">
  // ===== SVG dimensions =====
  const SIZE = 320
  const CENTER = SIZE / 2

  // ===== Colors =====
  const COL_BG = "#ffffff"
  const COL_INK = "#000000"

  // ===== Layout constants =====
  const OUTER_RADIUS = 150 // 円盤の半径
  const ARC_STROKE_WIDTH = 4 // 黒い弧の太さ
  const NUM_GROUPS = 4 // 弧のグループ数（白い半円を分割する角度数）
  const ARCS_PER_GROUP = 3 // 1グループあたりの弧の本数
  const ARC_INNER_RADIUS = OUTER_RADIUS * 0.22 // 最内側の弧の半径
  const ARC_OUTER_RADIUS = OUTER_RADIUS - ARC_STROKE_WIDTH - 10 // 最外側の弧の半径
  const OUTLINE_STROKE_WIDTH = 1.5

  // ===== 弧パスの生成 =====
  // ベンハムのコマは「半分黒・半分白」の円盤の白い側に、
  // 同心円状の黒い弧を角度位置を変えながら配置する。
  // ここでは右半分を白とし、上から下へ4区間（各45°）に分け、
  // 内側から外側へ向かって順に各区間へ弧を3本ずつ並べる。
  type Arc = { d: string }

  function buildArcs(): Arc[] {
    const arcs: Arc[] = []
    const totalArcs = NUM_GROUPS * ARCS_PER_GROUP
    const radiusStep = (ARC_OUTER_RADIUS - ARC_INNER_RADIUS) / (totalArcs - 1)
    const angleStartDeg = -90 // 12時方向（白半円の上端）
    const groupAngleSpan = 180 / NUM_GROUPS // 45°

    for (let g = 0; g < NUM_GROUPS; g++) {
      const startDeg = angleStartDeg + g * groupAngleSpan
      const endDeg = startDeg + groupAngleSpan
      const startRad = (startDeg * Math.PI) / 180
      const endRad = (endDeg * Math.PI) / 180
      for (let a = 0; a < ARCS_PER_GROUP; a++) {
        const r = ARC_INNER_RADIUS + (g * ARCS_PER_GROUP + a) * radiusStep
        const x1 = CENTER + r * Math.cos(startRad)
        const y1 = CENTER + r * Math.sin(startRad)
        const x2 = CENTER + r * Math.cos(endRad)
        const y2 = CENTER + r * Math.sin(endRad)
        // sweep-flag=1 で時計回りに描く（白半円側を通る）
        arcs.push({ d: `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}` })
      }
    }
    return arcs
  }

  const ARCS = buildArcs()

  // ===== 黒い左半円のパス（上 → 反時計回りに左 → 下） =====
  const BLACK_HALF_PATH = `M ${CENTER} ${CENTER - OUTER_RADIUS} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 0 ${CENTER} ${CENTER + OUTER_RADIUS} Z`
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 白い円盤（背景） -->
  <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill={COL_BG} />

  <!-- 黒い左半円 -->
  <path d={BLACK_HALF_PATH} fill={COL_INK} />

  <!-- 白側に配置された黒い弧（4グループ × 3本） -->
  {#each ARCS as arc, i (i)}
    <path
      d={arc.d}
      fill="none"
      stroke={COL_INK}
      stroke-width={ARC_STROKE_WIDTH}
      stroke-linecap="butt"
    />
  {/each}

  <!-- 円盤の外周線 -->
  <circle
    cx={CENTER}
    cy={CENTER}
    r={OUTER_RADIUS}
    fill="none"
    stroke={COL_INK}
    stroke-width={OUTLINE_STROKE_WIDTH}
  />
</svg>
