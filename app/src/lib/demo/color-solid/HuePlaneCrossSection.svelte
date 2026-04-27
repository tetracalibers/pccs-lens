<script lang="ts">
  import chroma from "chroma-js"

  // ===== レイアウト定数 =====
  const R = 220 // 半径（ColorSolidSphere と同じ）
  const LIGHTNESS_DOT_R = 13 // 明度スケール円・等色相面ドットの半径

  // 余白（明度高低ラベル・高彩度ラベルの bbox を含む）
  const LEFT_PAD = 20 // 「高明度/低明度」ラベルが軸中心で center-anchor で収まる程度の余白
  const TOP_LABEL_GAP = 10
  const TOP_LABEL_ASCENDER = 11
  const BOTTOM_LABEL_GAP = 20
  const BOTTOM_LABEL_DESCENDER = 3
  const SAT_LABEL_GAP = 6
  const SAT_LABEL_WIDTH = 50

  // ===== SVG サイズと中心 =====
  const TOP_PAD = LIGHTNESS_DOT_R + TOP_LABEL_GAP + TOP_LABEL_ASCENDER
  const BOTTOM_PAD = LIGHTNESS_DOT_R + BOTTOM_LABEL_GAP + BOTTOM_LABEL_DESCENDER
  const RIGHT_PAD = LIGHTNESS_DOT_R + SAT_LABEL_GAP + SAT_LABEL_WIDTH

  const cx = LEFT_PAD + LIGHTNESS_DOT_R // 明度軸の x（図の左寄り）
  const cy = TOP_PAD + R
  const W = cx + R + RIGHT_PAD
  const H = TOP_PAD + 2 * R + BOTTOM_PAD

  const axisTopY = cy - R
  const axisBottomY = cy + R

  // ===== 等色相面の色（赤、PCCS hue 2 / Munsell 4R 周辺）=====
  // ColorSolidSphere と同じ LCH 色相
  const RED_LCH_HUE = 30
  const PLANE_FILL = "#e52838"
  // LCH 彩度ステップ。明度スケール円の間隔（0.2R）に概ね合わせる
  const C_LCH_STEP = 16
  // LCH 彩度をピクセルへ変換するスケール（最大彩度 ~80 が R に対応）
  const C_LCH_TO_PX_DENOM = 80

  // LCH→sRGB 変換でクリッピングされていない（=ガモット内）かを往復変換で判定
  function isInGamut(L: number, C: number, h: number): boolean {
    const back = chroma.lch(L, C, h).lch()
    return Math.abs(back[1] - C) < 1.5
  }

  type DenseDot = { x: number; y: number; hex: string; key: string }

  // 明度スケール円と同じ V=1..9 のグリッドに揃え、彩度0は明度スケール側のグレイ円が表すためスキップ。
  // ガモット端まで詰めて並べる
  const denseDots: DenseDot[] = (() => {
    const dots: DenseDot[] = []
    for (let V = 1; V <= 9; V++) {
      const dy = ((5 - V) / 5) * R
      const y = cy + dy
      const L = V * 10
      for (let C = C_LCH_STEP; C <= 200; C += C_LCH_STEP) {
        if (!isInGamut(L, C, RED_LCH_HUE)) break
        const x = cx + (C / C_LCH_TO_PX_DENOM) * R
        const hex = chroma.lch(L, C, RED_LCH_HUE).hex()
        dots.push({ x, y, hex, key: `${V}-${C}` })
      }
    }
    return dots
  })()

  // ===== 明度スケール（V=0..10 の 11 段階のグレイ円）=====
  const NUM_LIGHTNESS_CIRCLES = 11

  type LightCircle = { hex: string; y: number; V: number }

  const lightnessCircles: LightCircle[] = Array.from({ length: NUM_LIGHTNESS_CIRCLES }, (_, i) => {
    // i=0 を最上部（白）、最後を最下部（黒）
    const V = NUM_LIGHTNESS_CIRCLES - 1 - i
    const t = V / (NUM_LIGHTNESS_CIRCLES - 1)
    const gray = Math.round(255 * t)
    const hex = `#${gray.toString(16).padStart(2, "0").repeat(3)}`
    const y = axisTopY + (i * 2 * R) / (NUM_LIGHTNESS_CIRCLES - 1)
    return { hex, y, V }
  })

  // ===== パス =====
  // 等色相面（半円）の塗りパス
  const planePath = `M ${cx} ${axisTopY} A ${R} ${R} 0 0 1 ${cx} ${axisBottomY} Z`
  // 半円の弧（断面の輪郭。軸側は明度軸線で表現するためここでは弧のみ）
  const planeArcPath = `M ${cx} ${axisTopY} A ${R} ${R} 0 0 1 ${cx} ${axisBottomY}`

  // 「等色相面」ラベルが沿う、円周より少し内側の弧（上端 → 右端）
  const PLANE_LABEL_R_RATIO = 0.9
  const planeLabelR = R * PLANE_LABEL_R_RATIO
  const planeLabelPath = `M ${cx} ${cy - planeLabelR} A ${planeLabelR} ${planeLabelR} 0 0 1 ${cx + planeLabelR} ${cy}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
  <defs>
    <!-- 「等色相面」ラベルが沿う弧 -->
    <path id="ehp-plane-label-path" d={planeLabelPath} />
  </defs>

  <!-- 等色相面の薄い塗り（半円） -->
  <path d={planePath} fill={PLANE_FILL} fill-opacity="0.15" />

  <!-- 半円の輪郭（断面の境界。軸側は別途明度軸線で描画） -->
  <path d={planeArcPath} fill="none" stroke="slategray" stroke-width="1.5" />

  <!-- 等色相面のドット（sRGBガモットに沿った形で配置）。
       ピーク彩度のドット（hex=#e52838）は色相環上の num=2 (R) と同じ位置に対応するため、
       他の色相点と同様に白ストロークで強調する -->
  {#each denseDots as dot (dot.key)}
    {@const isPeak = dot.hex === PLANE_FILL}
    <circle
      cx={dot.x}
      cy={dot.y}
      r={LIGHTNESS_DOT_R}
      fill={dot.hex}
      stroke={isPeak ? "#fff" : "#444"}
      stroke-width={isPeak ? 1.2 : 0.8}
    />
  {/each}

  <!-- 明度軸（縦線）。明度スケール円の背面に描画し、円の隙間から軸が覗くようにする -->
  <line x1={cx} y1={axisTopY} x2={cx} y2={axisBottomY} stroke="slategray" stroke-width="1" />

  <!-- 明度スケール（円の縦並び） -->
  {#each lightnessCircles as c (c.V)}
    <circle {cx} cy={c.y} r={LIGHTNESS_DOT_R} fill={c.hex} stroke="#444" stroke-width="0.8" />
  {/each}

  <!-- 明度の高低ラベル -->
  <text class="ehp-mark" x={cx} y={axisTopY - LIGHTNESS_DOT_R - 10} text-anchor="middle">
    無彩色軸
  </text>
</svg>

<style>
  .ehp-mark {
    font-size: 13px;
    fill: var(--color-body);
  }
</style>
