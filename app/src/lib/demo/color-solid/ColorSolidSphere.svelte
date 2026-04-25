<script lang="ts">
  import chroma from "chroma-js"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"

  // 球の半径（固定値）
  const R = 220

  // PAD_X / PAD_Y は図全体（球外の矢印・ラベル類を含む）の外側パディング
  const PAD_X = 20
  const PAD_Y = 10

  // 後方で使う角度・寸法定数を先に宣言しておく（leftExtra / topExtra / bottomExtra 計算で参照するため）
  const HUE_ARC_START_ANGLE = Math.PI * 0.94
  const HUE_ARC_END_ANGLE = Math.PI * 0.18
  const HUE_ARC_RADIUS_OUTSET = 26 // 色相変化矢印楕円の rx と R との差
  const LIGHTNESS_DOT_R = 13

  // 透視で潰した赤道楕円のy半径
  const eRy = R * 0.26

  // 球の中心から見た「図の各方向への最遠描画距離」（球外側へはみ出す要素を含む bounding box）
  // 左: 色相変化矢印の start（角度 0.94π）が最も左に出る
  let leftExtra = $derived(
    Math.ceil((R + HUE_ARC_RADIUS_OUTSET) * Math.abs(Math.cos(HUE_ARC_START_ANGLE)) + 3)
  )
  // 右: 球外形＋ストロークの余裕のみ
  let rightExtra = $derived(R + 2)
  // 上: 「白」ラベル(明度スケール円(r=13)の上、+6px gap、ascender ~11px)
  let topExtra = $derived(R + LIGHTNESS_DOT_R + 6 + 11)
  // 下: 「黒」ラベル(明度スケール円の下、+16px gap、descender ~3px)
  let bottomExtra = $derived(R + LIGHTNESS_DOT_R + 16 + 3)

  // SVG 全体のサイズと球中心。図の bounding box に PAD を足したもの
  let W = $derived(leftExtra + rightExtra + PAD_X * 2)
  let H = $derived(topExtra + bottomExtra + PAD_Y * 2)
  let cx = $derived(PAD_X + leftExtra)
  let cy = $derived(PAD_Y + topExtra)

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

  // 明度スケール（円の縦並び）。LIGHTNESS_DOT_R は先頭で宣言済み
  const NUM_LIGHTNESS_CIRCLES = 11

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

  // 色相変化の弧（赤道の前面に少し外側）。HUE_ARC_* と HUE_ARC_RADIUS_OUTSET は先頭で宣言済み
  let hueArcRx = $derived(R + HUE_ARC_RADIUS_OUTSET)
  let hueArcRy = $derived(eRy + 18)
  let hueArcStartX = $derived(cx + hueArcRx * Math.cos(HUE_ARC_START_ANGLE))
  let hueArcStartY = $derived(cy + hueArcRy * Math.sin(HUE_ARC_START_ANGLE))
  let hueArcEndX = $derived(cx + hueArcRx * Math.cos(HUE_ARC_END_ANGLE))
  let hueArcEndY = $derived(cy + hueArcRy * Math.sin(HUE_ARC_END_ANGLE))
  let hueArcPath = $derived(
    `M ${hueArcStartX} ${hueArcStartY} A ${hueArcRx} ${hueArcRy} 0 0 0 ${hueArcEndX} ${hueArcEndY}`
  )

  // 色相変化矢印のグラデーション。前面側で弧の角度範囲内にある色相点の色を、
  // 弧上での角度位置に応じた offset で並べ、終端は赤(#e52838)で締める
  const HUE_GRADIENT_END_COLOR = "#e52838"
  const TWO_PI = 2 * Math.PI
  let hueGradientStops: { offset: number; color: string }[] = $derived.by(() => {
    const span = HUE_ARC_START_ANGLE - HUE_ARC_END_ANGLE
    const stops: { offset: number; color: string }[] = []
    for (const [num, data] of PCCS_HUE_MAP.entries()) {
      // hueAngle は num に応じて負値も返すため、[0, 2π) に正規化してから範囲判定
      const a = ((hueAngle(num) % TWO_PI) + TWO_PI) % TWO_PI
      if (a > HUE_ARC_START_ANGLE || a < HUE_ARC_END_ANGLE) continue
      // 弧の始点(0.94π)を offset=0、終点(0.18π)を offset=1 にマッピング
      stops.push({ offset: (HUE_ARC_START_ANGLE - a) / span, color: data.color })
    }
    stops.sort((s1, s2) => s1.offset - s2.offset)
    stops.push({ offset: 1, color: HUE_GRADIENT_END_COLOR })
    return stops
  })

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
  const HUE_RING_LABEL_SCALE_Y = 0.75
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
    <!-- 開いた V 字の矢印マーカー（SpectrumRange と統一）。色ごとに別 ID で定義 -->
    <!-- 赤: 色相変化弧の終点（グラデーション終端色 #e52838 と一致させる） -->
    <marker id="cs-aR-r" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke={HUE_GRADIENT_END_COLOR}
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <!-- 色相変化弧用のグラデーション。弧の始点→終点を結ぶ直線方向に沿って色補間する -->
    <linearGradient
      id="cs-hue-arc-gradient"
      gradientUnits="userSpaceOnUse"
      x1={hueArcStartX}
      y1={hueArcStartY}
      x2={hueArcEndX}
      y2={hueArcEndY}
    >
      {#each hueGradientStops as stop, i (i)}
        <stop offset={stop.offset} stop-color={stop.color} />
      {/each}
    </linearGradient>
    <!-- ピンク: 彩度変化矢印の両端 -->
    <marker id="cs-aL-p" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke="var(--canvas-pen-pink)"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <marker id="cs-aR-p" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke="var(--canvas-pen-pink)"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    <!-- 水色: 明度変化矢印の両端 -->
    <marker id="cs-aL-w" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
      <polyline
        points="8,1 1,5 8,9"
        fill="none"
        stroke="var(--canvas-pen-water)"
        stroke-width="1"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </marker>
    <marker id="cs-aR-w" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke="var(--canvas-pen-water)"
        stroke-width="1"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </marker>
    <!-- 「色相環」ラベルが沿う円弧（ディスク座標、未投影）。テキスト要素側の transform で平面の透視を当てる -->
    <path id="cs-hue-ring-label-path" d={hueRingLabelPath} />
    <!-- 「赤の等色相面」ラベルが沿う、等色相面の上半分の円周より少し内側の弧 -->
    <path id="cs-red-plane-label-path" d={redPlaneLabelPath} />
    <!-- 「色相の変化」ラベルが沿う、色相変化矢印の左半分の少し外側の弧 -->
    <path id="cs-hue-arrow-label-path" d={hueLabelPath} />
    <!-- 「色相の変化」ラベル用マスク。
         Safari/WebKit は <text>+<textPath> の fill に paint server (gradient) を直接指定すると、
         textPath 変形前の水平 bbox を基準にクリップして末尾の文字が描画されない既知の挙動がある。
         そこでテキスト形状をマスクとして使い、gradient で塗った <rect> を切り抜く方式に切り替える。
         マスク内の text は solid color (white) なので paint-server bbox 問題は発生しない -->
    <mask
      id="cs-hue-arrow-label-mask"
      maskUnits="userSpaceOnUse"
      maskContentUnits="userSpaceOnUse"
      x="0"
      y="0"
      width={W}
      height={H}
    >
      <rect x="0" y="0" width={W} height={H} fill="black" />
      <text class="cs-label" text-anchor="middle" fill="white">
        <textPath href="#cs-hue-arrow-label-path" startOffset="50%">色相の変化</textPath>
      </text>
    </mask>
  </defs>

  <!-- 球の外形 -->
  <circle {cx} {cy} r={R} fill="none" stroke="slategray" stroke-width="1.5" />

  <!-- 色相環の領域を示す薄い塗り（赤道楕円） -->
  <ellipse {cx} {cy} rx={R} ry={eRy} fill="lightslategray" fill-opacity="0.2" />

  <!-- 赤道（後ろ半分・破線） -->
  <path
    d={`M ${cx + R} ${cy} A ${R} ${eRy} 0 0 1 ${cx - R} ${cy}`}
    fill="none"
    stroke="slategray"
    stroke-width="1"
    stroke-dasharray="4 4"
  />

  <!-- 赤道（前半分・実線） -->
  <path
    d={`M ${cx - R} ${cy} A ${R} ${eRy} 0 0 1 ${cx + R} ${cy}`}
    fill="none"
    stroke="slategray"
    stroke-width="1"
    stroke-dasharray="4 4"
  />

  <!-- 後ろ側の色相点（小さく描画） -->
  {#each hueDots.filter((d) => !d.isFront) as dot (dot.num)}
    <circle cx={dot.x} cy={dot.y} r="6" fill={dot.color} stroke="#fff" stroke-width="0.8" />
  {/each}

  <!-- 彩度の変化矢印（V=5 グレイ円 → v14 bG）。両端は円のエッジから離して被りを防ぐ -->
  <line
    x1={satLineStartX}
    y1={cy}
    x2={satLineEndX}
    y2={cy}
    stroke="var(--canvas-pen-pink)"
    stroke-width="2"
    marker-start="url(#cs-aL-p)"
    marker-end="url(#cs-aR-p)"
  />

  <!-- 赤の等色相面の領域を示す薄い塗り（右半円） -->
  <path d={redPlanePath} fill="#e52838" fill-opacity="0.15" />

  <!-- 赤の等色相面（sRGBガモットに沿った自然な形でドットを配置）。
       V=5・ピーク彩度のドット（hex が #e52838）は色相環の num=2 (R) と同じ位置に重なるため、
       他の色相点と同様に白ストロークで強調する -->
  {#each denseRedDots as dot (dot.key)}
    {@const onHueRing = dot.hex === HUE_GRADIENT_END_COLOR}
    <circle
      cx={dot.x}
      cy={dot.y}
      r={LIGHTNESS_DOT_R}
      fill={dot.hex}
      stroke={onHueRing ? "#fff" : "#444"}
      stroke-width={onHueRing ? 1.2 : 0.8}
    />
  {/each}

  <!-- 明度軸（球の縦中心軸）。明度スケール円の背面に描画し、円の隙間から軸が覗くようにする -->
  <line x1={cx} y1={axisTopY} x2={cx} y2={axisBottomY} stroke="slategray" stroke-width="1" />

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
      stroke-width="0.8"
    />
  {/each}

  <!-- 色相変化の弧矢印（前面側の色相点の色で補間し、終端は #e52838 にする） -->
  <path
    d={hueArcPath}
    fill="none"
    stroke="url(#cs-hue-arc-gradient)"
    stroke-width="2"
    marker-end="url(#cs-aR-r)"
  />

  <!-- 明度の変化矢印（縦・両端矢印） -->
  <line
    x1={lightArrowX}
    y1={lightArrowYTop}
    x2={lightArrowX}
    y2={lightArrowYBot}
    stroke="var(--canvas-pen-water)"
    stroke-width="2"
    marker-start="url(#cs-aL-w)"
    marker-end="url(#cs-aR-w)"
  />

  <!-- 明度スケールの白/黒ラベル（明度スケール円(r=13)と被らないよう、円の上下端からさらに離す） -->
  <text class="cs-scale-mark" x={cx} y={axisTopY - LIGHTNESS_DOT_R - 8} text-anchor="middle">
    白
  </text>
  <text class="cs-scale-mark" x={cx} y={axisBottomY + LIGHTNESS_DOT_R + 18} text-anchor="middle">
    黒
  </text>

  <!-- 「明度の変化」ラベル（-90°回転して矢印に沿わせる。上部寄りで矢じり・色相環の塗りと被らない位置） -->
  <text
    class="cs-label"
    x={lightLabelPivotX}
    y={lightLabelPivotY}
    text-anchor="middle"
    transform="rotate(-90 {lightLabelPivotX} {lightLabelPivotY})"
    fill="var(--canvas-pen-water)"
  >
    明度の変化
  </text>

  <!-- 「色相の変化」ラベル（矢印の左半分の少し外側の弧に沿う）。
       gradient で塗った rect をテキスト形状のマスクで切り抜くことで、矢印と同じ gradient を適用する。
       <text> の fill に直接 url(#...) を指定すると Safari で末尾文字が見切れるための回避策（defs 内マスク参照） -->
  <rect
    x="0"
    y="0"
    width={W}
    height={H}
    fill="url(#cs-hue-arc-gradient)"
    mask="url(#cs-hue-arrow-label-mask)"
  />

  <!-- 「彩度の変化」ラベル（彩度矢印の中点・線の上側） -->
  <text class="cs-label" x={satMidX} y={cy - 12} text-anchor="middle" fill="var(--canvas-pen-pink)">
    彩度の変化
  </text>

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
    <textPath href="#cs-red-plane-label-path" startOffset="50%">等色相面</textPath>
  </text>
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .cs-label {
    font-size: 14px;
    font-weight: bold;
  }

  .cs-scale-mark {
    font-size: 13px;
    fill: var(--color-body);
  }

  .cs-plane-label {
    letter-spacing: 4px;
    font-size: 14px;
    fill: var(--color-body);
  }

  /* 色相環ラベルは平面上に貼り付くように垂直方向に圧縮するため、フォントを大きめに設定 */
  .cs-hue-ring-label {
    font-size: 16px;
    fill: var(--color-body);
    translate: 0 -0.45em;
    letter-spacing: 4px;
  }
</style>
