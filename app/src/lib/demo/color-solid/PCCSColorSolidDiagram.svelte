<script lang="ts">
  import chroma from "chroma-js"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"

  interface Props {
    /** 球の半径（px） */
    sphereRadius?: number
  }

  let { sphereRadius = 220 }: Props = $props()

  const PAD_X = 130
  const PAD_Y = 70

  let R = $derived(sphereRadius)
  let W = $derived(R * 2 + PAD_X * 2)
  let H = $derived(R * 2 + PAD_Y * 2)
  let cx = $derived(W / 2)
  let cy = $derived(H / 2)
  // 透視で潰した赤道楕円のy半径
  let eRy = $derived(R * 0.26)

  // 色相番号 → 角度。num 2（R / 赤）を3時方向（右）に置き、右側半円に赤の等色相面を展開する
  const TOP_HUE_NUM = 20
  const HUE_COUNT = 24
  const ANGLE_PER_HUE = (2 * Math.PI) / HUE_COUNT

  function hueAngle(num: number): number {
    return -Math.PI / 2 + (num - TOP_HUE_NUM) * ANGLE_PER_HUE
  }

  type HueDot = {
    num: number
    color: string
    x: number
    y: number
    isFront: boolean
  }

  // 描画順は深さ（y昇順 = 奥→手前）。同じ前面/背面グループ内でも、より奥にあるものが先に描かれて手前のものに覆われるようにする
  let hueDots: HueDot[] = $derived(
    Array.from(PCCS_HUE_MAP.entries())
      .map(([num, data]) => {
        const a = hueAngle(num)
        return {
          num,
          color: data.color,
          x: cx + R * Math.cos(a),
          y: cy + eRy * Math.sin(a),
          isFront: Math.sin(a) >= -0.001
        }
      })
      .sort((a, b) => a.y - b.y)
  )

  // 赤の等色相面（chroma-js のLCH空間でsRGBガモット内のみサンプル）
  // RED_LCH_HUE: PCCS hue 2（Munsell 4R 周辺）に対応するLCH色相
  const RED_LCH_HUE = 30
  // LCH彩度ステップ。明度スケール円の間隔（0.2R）に概ね合わせる
  const C_LCH_STEP = 16
  // LCH彩度をピクセルへ変換するスケール（最大彩度 ~80 が R に対応）
  const C_LCH_TO_PX_DENOM = 80

  type DenseDot = { x: number; y: number; hex: string; key: string }

  // LCH→sRGB変換でクリッピングされていない（=ガモット内）かを往復変換で判定
  function isInGamut(L: number, C: number, h: number): boolean {
    const back = chroma.lch(L, C, h).lch()
    return Math.abs(back[1] - C) < 1.5
  }

  let denseRedDots: DenseDot[] = $derived.by(() => {
    const dots: DenseDot[] = []
    // 明度スケール円と同じ V=1..9 のグリッドに揃える
    for (let V = 1; V <= 9; V++) {
      const dy = ((5 - V) / 5) * R
      const y = cy + dy
      const L = V * 10
      // 彩度0は明度スケール側のグレイ円が表すためスキップし、ガモット端まで詰める
      for (let C = C_LCH_STEP; C <= 200; C += C_LCH_STEP) {
        if (!isInGamut(L, C, RED_LCH_HUE)) break
        const x = cx + (C / C_LCH_TO_PX_DENOM) * R
        const hex = chroma.lch(L, C, RED_LCH_HUE).hex()
        dots.push({ x, y, hex, key: `${V}-${C}` })
      }
    }
    return dots
  })

  // 明度スケール（円の縦並び）
  const NUM_LIGHTNESS_CIRCLES = 11
  const LIGHTNESS_DOT_R = 13

  let axisTopY = $derived(cy - R)
  let axisBottomY = $derived(cy + R)

  type LightCircle = { hex: string; y: number; V: number }

  let lightnessCircles: LightCircle[] = $derived(
    Array.from({ length: NUM_LIGHTNESS_CIRCLES }, (_, i) => {
      // i=0 を最上部（白）、最後を最下部（黒）
      const V = NUM_LIGHTNESS_CIRCLES - 1 - i
      const t = V / (NUM_LIGHTNESS_CIRCLES - 1)
      const gray = Math.round(255 * t)
      const hex = `#${gray.toString(16).padStart(2, "0").repeat(3)}`
      const y = axisTopY + (i * 2 * R) / (NUM_LIGHTNESS_CIRCLES - 1)
      return { hex, y, V }
    })
  )

  // 彩度の変化矢印は中央のグレイ円（V=5, #808080）と赤道左端の v14（bG, #008678）を結ぶ
  // 円と矢印が被らないよう、両端を円エッジから離す。終点側は矢じりの突出分も含む
  let satTarget = $derived(hueDots.find((d) => d.num === 14)!)
  let satLineStartX = $derived(cx - LIGHTNESS_DOT_R - 4)
  let satLineEndX = $derived(satTarget.x + LIGHTNESS_DOT_R + 6)
  let satMidX = $derived((satLineStartX + satLineEndX) / 2)

  // 赤の等色相面（右半円）パス
  let redPlanePath = $derived(`M ${cx} ${axisTopY} A ${R} ${R} 0 0 1 ${cx} ${axisBottomY} Z`)

  // 「赤の等色相面」ラベルが沿う内側円弧。右半円の上半分（top → right）の少し内側
  const RED_PLANE_LABEL_R_RATIO = 0.9
  let redPlaneLabelR = $derived(R * RED_PLANE_LABEL_R_RATIO)
  let redPlaneLabelPath = $derived(
    `M ${cx} ${cy - redPlaneLabelR} A ${redPlaneLabelR} ${redPlaneLabelR} 0 0 1 ${cx + redPlaneLabelR} ${cy}`
  )

  // 色相変化の弧（赤道の前面に少し外側）
  const HUE_ARC_START_ANGLE = Math.PI * 0.94
  const HUE_ARC_END_ANGLE = Math.PI * 0.18

  let hueArcRx = $derived(R + 26)
  let hueArcRy = $derived(eRy + 18)
  let hueArcStartX = $derived(cx + hueArcRx * Math.cos(HUE_ARC_START_ANGLE))
  let hueArcStartY = $derived(cy + hueArcRy * Math.sin(HUE_ARC_START_ANGLE))
  let hueArcEndX = $derived(cx + hueArcRx * Math.cos(HUE_ARC_END_ANGLE))
  let hueArcEndY = $derived(cy + hueArcRy * Math.sin(HUE_ARC_END_ANGLE))
  let hueArcPath = $derived(
    `M ${hueArcStartX} ${hueArcStartY} A ${hueArcRx} ${hueArcRy} 0 0 0 ${hueArcEndX} ${hueArcEndY}`
  )

  // 「色相の変化」ラベルが沿うパス: 色相変化矢印より少し外側（下側）の楕円弧で、矢印の左半分（start → 弧の底）に対応
  // textPath の文字はパスの「内側（弧の中心方向＝矢印側）」に乗るため、可視ギャップ12pxを得るには
  // パス自体を「12px（=ギャップ）+ 文字の高さ ≈ 14px」分だけ外側に置く
  const HUE_LABEL_GAP = 12
  const HUE_LABEL_FONT_HEIGHT = 14
  const HUE_LABEL_OFFSET = HUE_LABEL_GAP + HUE_LABEL_FONT_HEIGHT
  let hueLabelRx = $derived(hueArcRx + HUE_LABEL_OFFSET)
  let hueLabelRy = $derived(hueArcRy + HUE_LABEL_OFFSET)
  let hueLabelStartX = $derived(cx + hueLabelRx * Math.cos(HUE_ARC_START_ANGLE))
  let hueLabelStartY = $derived(cy + hueLabelRy * Math.sin(HUE_ARC_START_ANGLE))
  // 弧の底（角度 π/2）= 矢印の左右半分の境界
  let hueLabelEndX = $derived(cx + hueLabelRx * Math.cos(Math.PI / 2))
  let hueLabelEndY = $derived(cy + hueLabelRy * Math.sin(Math.PI / 2))
  // 矢印と同じ sweep=0（CCW = θ 減少方向）。始点 0.94π → 弧底 0.5π
  let hueLabelPath = $derived(
    `M ${hueLabelStartX} ${hueLabelStartY} A ${hueLabelRx} ${hueLabelRy} 0 0 0 ${hueLabelEndX} ${hueLabelEndY}`
  )

  // 明度の変化矢印（明度スケールの左隣に縦の双方向矢印）
  let lightArrowX = $derived(cx - LIGHTNESS_DOT_R - 28)
  let lightArrowYTop = $derived(axisTopY - 4)
  let lightArrowYBot = $derived(axisBottomY + 4)
  // 明度の変化ラベルの回転中心（矢印の左隣・上部寄り）
  let lightLabelPivotX = $derived(lightArrowX - 14)
  let lightLabelPivotY = $derived(lightArrowYTop + 60)

  // 「色相環」ラベル: スクリーン上では赤道楕円の v12（#33A23D）〜v9（#CCE700）の弧と平行で、内側に寄せた弧をなぞる。
  // text 側に scale(1, k) を当てて文字を縦圧縮するため、ディスク座標側の ry は eRy/k に拡げておく
  // （k 倍された結果ちょうど eRy ベースの弧になる）。INNER_RATIO で円周より内側に縮める
  const HUE_RING_LABEL_SCALE_Y = 0.55
  const HUE_RING_LABEL_INNER_RATIO = 0.85

  let hueRingLabelRxPre = $derived(R * HUE_RING_LABEL_INNER_RATIO)
  let hueRingLabelRyPre = $derived((eRy / HUE_RING_LABEL_SCALE_Y) * HUE_RING_LABEL_INNER_RATIO)
  let hueRingLabelStartAngle = $derived(hueAngle(12))
  let hueRingLabelEndAngle = $derived(hueAngle(9))
  let hueRingLabelStartX = $derived(hueRingLabelRxPre * Math.cos(hueRingLabelStartAngle))
  let hueRingLabelStartY = $derived(hueRingLabelRyPre * Math.sin(hueRingLabelStartAngle))
  let hueRingLabelEndX = $derived(hueRingLabelRxPre * Math.cos(hueRingLabelEndAngle))
  let hueRingLabelEndY = $derived(hueRingLabelRyPre * Math.sin(hueRingLabelEndAngle))
  // v12 (角度 150°) → v9 (角度 105°) は θ 減少方向（SVG y-down では CCW = sweep=0）
  let hueRingLabelPath = $derived(
    `M ${hueRingLabelStartX} ${hueRingLabelStartY} A ${hueRingLabelRxPre} ${hueRingLabelRyPre} 0 0 0 ${hueRingLabelEndX} ${hueRingLabelEndY}`
  )
</script>

<svg
  viewBox="0 0 {W} {H}"
  width={W}
  height={H}
  role="img"
  aria-label="PCCSの色立体（明度・色相・彩度の三軸）"
>
  <defs>
    <marker
      id="cs-arrow-end"
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="9"
      markerHeight="9"
      orient="auto"
    >
      <path d="M0 0 L10 5 L0 10 z" fill="#444" />
    </marker>
    <marker
      id="cs-arrow-start"
      viewBox="0 0 10 10"
      refX="2"
      refY="5"
      markerWidth="9"
      markerHeight="9"
      orient="auto"
    >
      <path d="M10 0 L0 5 L10 10 z" fill="#444" />
    </marker>
    <!-- 「色相環」ラベルが沿う円弧（ディスク座標、未投影）。テキスト要素側の transform で平面の透視を当てる -->
    <path id="cs-hue-ring-label-path" d={hueRingLabelPath} />
    <!-- 「赤の等色相面」ラベルが沿う、等色相面の上半分の円周より少し内側の弧 -->
    <path id="cs-red-plane-label-path" d={redPlaneLabelPath} />
    <!-- 「色相の変化」ラベルが沿う、色相変化矢印の左半分の少し外側の弧 -->
    <path id="cs-hue-arrow-label-path" d={hueLabelPath} />
  </defs>

  <!-- 球の外形 -->
  <circle {cx} {cy} r={R} fill="none" stroke="#999" stroke-width="1.5" />

  <!-- 色相環の領域を示す薄い塗り（赤道楕円） -->
  <ellipse {cx} {cy} rx={R} ry={eRy} fill="rgba(120, 120, 120, 0.18)" />

  <!-- 赤道（後ろ半分・破線） -->
  <path
    d={`M ${cx + R} ${cy} A ${R} ${eRy} 0 0 1 ${cx - R} ${cy}`}
    fill="none"
    stroke="#aaa"
    stroke-width="1"
    stroke-dasharray="4 4"
  />

  <!-- 赤道（前半分・実線） -->
  <path
    d={`M ${cx - R} ${cy} A ${R} ${eRy} 0 0 1 ${cx + R} ${cy}`}
    fill="none"
    stroke="#aaa"
    stroke-width="1"
    stroke-dasharray="4 4"
  />

  <!-- 後ろ側の色相点（小さく描画） -->
  {#each hueDots.filter((d) => !d.isFront) as dot (dot.num)}
    <circle cx={dot.x} cy={dot.y} r="6" fill={dot.color} />
  {/each}

  <!-- 彩度の変化矢印（V=5 グレイ円 → v14 bG）。両端は円のエッジから離して被りを防ぐ -->
  <line
    x1={satLineStartX}
    y1={cy}
    x2={satLineEndX}
    y2={cy}
    stroke="#444"
    stroke-width="1.5"
    marker-start="url(#cs-arrow-start)"
    marker-end="url(#cs-arrow-end)"
  />

  <!-- 赤の等色相面の領域を示す薄い塗り（右半円） -->
  <path d={redPlanePath} fill="rgba(168, 50, 62, 0.12)" />

  <!-- 赤の等色相面（sRGBガモットに沿った自然な形でドットを配置） -->
  {#each denseRedDots as dot (dot.key)}
    <circle
      cx={dot.x}
      cy={dot.y}
      r={LIGHTNESS_DOT_R}
      fill={dot.hex}
      stroke="#444"
      stroke-width="0.8"
    />
  {/each}

  <!-- 明度軸（球の縦中心軸）。明度スケール円の背面に描画し、円の隙間から軸が覗くようにする -->
  <line x1={cx} y1={axisTopY} x2={cx} y2={axisBottomY} stroke="#666" stroke-width="1" />

  <!-- 明度スケール（円の縦並び） -->
  {#each lightnessCircles as c (c.V)}
    <circle {cx} cy={c.y} r={LIGHTNESS_DOT_R} fill={c.hex} stroke="#444" stroke-width="0.8" />
  {/each}

  <!-- 前側の色相点（num 2 = R は等色相面のピーク彩度ドットと重なるため非表示。num 14 は赤道端で v2 と対称位置にあるため等色相面ドットと同じ半径） -->
  {#each hueDots.filter((d) => d.isFront && d.num !== 2) as dot (dot.num)}
    <circle
      cx={dot.x}
      cy={dot.y}
      r={dot.num === 14 ? LIGHTNESS_DOT_R : 9}
      fill={dot.color}
      stroke="#fff"
      stroke-width="1.2"
    />
  {/each}

  <!-- 色相変化の弧矢印 -->
  <path
    d={hueArcPath}
    fill="none"
    stroke="#444"
    stroke-width="1.5"
    marker-end="url(#cs-arrow-end)"
  />

  <!-- 明度の変化矢印（縦・両端矢印） -->
  <line
    x1={lightArrowX}
    y1={lightArrowYTop}
    x2={lightArrowX}
    y2={lightArrowYBot}
    stroke="#444"
    stroke-width="1.5"
    marker-start="url(#cs-arrow-start)"
    marker-end="url(#cs-arrow-end)"
  />

  <!-- 明度スケールの白/黒ラベル（明度スケール円(r=13)と被らないよう、円の上下端からさらに離す） -->
  <text class="cs-scale-mark" x={cx} y={axisTopY - LIGHTNESS_DOT_R - 6} text-anchor="middle">
    白
  </text>
  <text class="cs-scale-mark" x={cx} y={axisBottomY + LIGHTNESS_DOT_R + 16} text-anchor="middle">
    黒
  </text>

  <!-- 「明度の変化」ラベル（-90°回転して矢印に沿わせる。上部寄りで矢じり・色相環の塗りと被らない位置） -->
  <text
    class="cs-label"
    x={lightLabelPivotX}
    y={lightLabelPivotY}
    text-anchor="middle"
    transform="rotate(-90 {lightLabelPivotX} {lightLabelPivotY})"
  >
    明度の変化
  </text>

  <!-- 「色相の変化」ラベル（矢印の左半分の少し外側の弧に沿う） -->
  <text class="cs-label" text-anchor="middle">
    <textPath href="#cs-hue-arrow-label-path" startOffset="50%">色相の変化</textPath>
  </text>

  <!-- 「彩度の変化」ラベル（彩度矢印の中点・線の上側） -->
  <text class="cs-label" x={satMidX} y={cy - 12} text-anchor="middle">彩度の変化</text>

  <!-- 「色相環」ラベル（ディスク平面に書かれた弧上の文字を斜め上から見た見た目）。
       未投影の円弧パスを textPath で辿り、translate + scaleY で平面の透視を当てる -->
  <text
    class="cs-hue-ring-label"
    text-anchor="middle"
    dominant-baseline="middle"
    transform="translate({cx} {cy}) scale(1 {HUE_RING_LABEL_SCALE_Y})"
  >
    <textPath href="#cs-hue-ring-label-path" startOffset="50%">色相環</textPath>
  </text>

  <!-- 「赤の等色相面」ラベル（等色相面の上半分の円周に沿わせる、内側に少し寄せた弧上） -->
  <text class="cs-plane-label" text-anchor="middle">
    <textPath href="#cs-red-plane-label-path" startOffset="50%">赤の等色相面</textPath>
  </text>
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
    font-family: var(--font-sans, sans-serif);
  }

  .cs-label {
    font-size: 14px;
    fill: #333;
  }

  .cs-scale-mark {
    font-size: 13px;
    fill: #333;
    font-weight: 600;
  }

  .cs-plane-label {
    font-size: 13px;
    fill: #a8323e;
  }

  /* 色相環ラベルは平面上に貼り付くように垂直方向に圧縮するため、フォントを大きめに設定 */
  .cs-hue-ring-label {
    font-size: 22px;
    fill: #444;
    translate: 0 -0.3em;
  }
</style>
