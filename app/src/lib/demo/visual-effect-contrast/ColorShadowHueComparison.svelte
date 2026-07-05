<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== プレビュー（色陰現象の見本）のジオメトリ =====
  const RING_R = 90 // プレビュー正方形の中心が並ぶ円の半径
  const SQ = 76 // プレビュー正方形の一辺
  const ICON_SIZE = Math.round(SQ * 0.85) // プレビュー中央のアイコンサイズ

  // ===== 各プレビュー外側に描く色相環のジオメトリ =====
  const WHEEL_DIAMETER_RATIO = 1.25 // 色相環の直径をプレビューの一辺 SQ の何倍にするか（1 で SQ と同じ）
  const WHEEL_RADIUS = (SQ * WHEEL_DIAMETER_RATIO) / 2 // 色相環の半径
  const WHEEL_SQ_RADIUS_RATIO = 0.5 // 正方形の一辺を色相環の半径の何倍にするか（初期値 ≒ 0.62）
  const WHEEL_SQ = Math.round(WHEEL_RADIUS * WHEEL_SQ_RADIUS_RATIO) // 地・補色の正方形の一辺
  const WHEEL_ICON_SIZE = WHEEL_SQ // 図アイコンは正方形と同じサイズ
  const WHEEL_GAP = 18 // プレビュー外縁と色相環の隙間
  const WHEEL_STROKE_WIDTH = 1.2
  // 地→補色を結ぶ直線上での図の位置。7:3（補色寄り）= 地から 0.7。
  const FIGURE_RATIO = 0.7

  // ===== 色相環内の矢印（内側の正方形 → 図アイコン）=====
  const ARROW_STROKE_WIDTH = 1.5
  const ARROW_OFFSET = 3 // 正方形・アイコンの端から矢印端までの隙間
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 12 // 矢先のレンダリングサイズ（user space）
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE
  // 矢印の色は図アイコンと同じ（ICON_HEX を使用）

  const MARGIN = 10 // viewBox 外周の余白

  // ===== アイコン・色 =====
  const ICON_ID = "mynaui:flower-solid"
  const GY_NOTATION = "Gy-8.0" // 図アイコンの色（PCCS 無彩色）
  const ICON_HEX = PCCS_HEX_MAP.get(GY_NOTATION) ?? "#C8C8C8"
  const COL_WHEEL = "var(--color-body)"

  // ===== 半径・キャンバスサイズ =====
  const PREVIEW_OUTER = RING_R + SQ / 2
  const WHEEL_CENTER_R = PREVIEW_OUTER + WHEEL_GAP + WHEEL_RADIUS + WHEEL_SQ / 2
  const WHEEL_OUTER = WHEEL_CENTER_R + WHEEL_RADIUS + WHEEL_SQ / 2
  const HALF_EXTENT = WHEEL_OUTER + MARGIN
  const VIEW_SIZE = 2 * HALF_EXTENT
  const CX = HALF_EXTENT
  const CY = HALF_EXTENT

  // 対象とする PCCS 色相（v トーンで塗る）
  const HUES = [2, 8, 14, 20]

  // PCCS 番号 → SVG 角度（ラジアン）。番号 2 を 9時（180°）として 15° 刻みで時計回り。
  function hueAngle(hue: number): number {
    return ((180 + (hue - 2) * 15) * Math.PI) / 180
  }

  // 補色（色相環上で 12 反対の色相）
  const complementHue = (hue: number) => ((hue - 1 + 12) % 24) + 1

  type HueCell = {
    hue: number
    // プレビュー
    px: number
    py: number
    hex: string
    // 外側の色相環
    wx: number
    wy: number
    groundX: number
    groundY: number
    compX: number
    compY: number
    compHex: string
    figX: number
    figY: number
    arrowX1: number
    arrowY1: number
    arrowX2: number
    arrowY2: number
    wheelTransform: string
  }

  const CELLS: HueCell[] = HUES.map((hue) => {
    const a = hueAngle(hue)
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    // プレビュー中心
    const px = CX + RING_R * dx
    const py = CY + RING_R * dy
    // 色相環の中心（プレビューの外側・放射方向）
    const wx = CX + WHEEL_CENTER_R * dx
    const wy = CY + WHEEL_CENTER_R * dy
    // 地・補色は実際の色相角で円周上に配置（hue 8 が上）
    const compH = complementHue(hue)
    const groundA = hueAngle(hue)
    const compA = hueAngle(compH)
    const groundX = wx + WHEEL_RADIUS * Math.cos(groundA)
    const groundY = wy + WHEEL_RADIUS * Math.sin(groundA)
    const compX = wx + WHEEL_RADIUS * Math.cos(compA)
    const compY = wy + WHEEL_RADIUS * Math.sin(compA)
    // 図：地→補色の直線上 7:3（補色寄り）
    const figX = groundX + FIGURE_RATIO * (compX - groundX)
    const figY = groundY + FIGURE_RATIO * (compY - groundY)
    // 内側（地）の正方形から図アイコンへ向かう矢印（両端を少し内側に寄せる）
    const arrowLen = Math.hypot(compX - groundX, compY - groundY) || 1
    const aux = (compX - groundX) / arrowLen
    const auy = (compY - groundY) / arrowLen
    const arrowX1 = groundX + aux * (WHEEL_SQ / 2 + ARROW_OFFSET)
    const arrowY1 = groundY + auy * (WHEEL_SQ / 2 + ARROW_OFFSET)
    const arrowX2 = figX - aux * (WHEEL_ICON_SIZE / 2 + ARROW_OFFSET)
    const arrowY2 = figY - auy * (WHEEL_ICON_SIZE / 2 + ARROW_OFFSET)
    // プレビューの横（左右）にある色相環は左右反転、縦（上下）にある色相環は上下反転（環の中心まわり）
    const wheelTransform =
      Math.abs(dx) > Math.abs(dy)
        ? `translate(${2 * wx} 0) scale(-1 1)`
        : `translate(0 ${2 * wy}) scale(1 -1)`
    return {
      hue,
      px,
      py,
      hex: PCCS_HEX_MAP.get(`v${hue}`) ?? "#000000",
      wx,
      wy,
      groundX,
      groundY,
      compX,
      compY,
      compHex: PCCS_HEX_MAP.get(`v${compH}`) ?? "#000000",
      figX,
      figY,
      arrowX1,
      arrowY1,
      arrowX2,
      arrowY2,
      wheelTransform
    }
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}">
  <defs>
    <marker
      id="wheel-arrow"
      viewBox="0 0 {ARROW_HEAD_VIEWBOX} {ARROW_HEAD_VIEWBOX}"
      refX={ARROW_HEAD_VIEWBOX / 2}
      refY={ARROW_HEAD_VIEWBOX / 2}
      markerWidth={ARROW_HEAD_SIZE}
      markerHeight={ARROW_HEAD_SIZE}
      markerUnits="userSpaceOnUse"
      orient="auto"
    >
      <polyline
        points="0,3.5 3.5,1.75 0,0"
        fill="none"
        stroke={ICON_HEX}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  {#snippet grayFlower(x: number, y: number, size: number)}
    <foreignObject x={x - size / 2} y={y - size / 2} width={size} height={size}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {ICON_HEX}; display: grid; place-items: center;"
      >
        <Icon icon={ICON_ID} width={size} height={size} />
      </div>
    </foreignObject>
  {/snippet}

  {#each CELLS as cell (cell.hue)}
    <!-- 色相環（横は左右反転・上は上下反転） -->
    <g transform={cell.wheelTransform}>
      <!-- プレビュー外側の色相環（円） -->
      <circle
        cx={cell.wx}
        cy={cell.wy}
        r={WHEEL_RADIUS}
        fill="none"
        stroke={COL_WHEEL}
        stroke-width={WHEEL_STROKE_WIDTH}
      />

      <!-- 地の正方形（その色相の色相角） -->
      <rect
        x={cell.groundX - WHEEL_SQ / 2}
        y={cell.groundY - WHEEL_SQ / 2}
        width={WHEEL_SQ}
        height={WHEEL_SQ}
        fill={cell.hex}
      />

      <!-- 補色の正方形（補色の色相角） -->
      <rect
        x={cell.compX - WHEEL_SQ / 2}
        y={cell.compY - WHEEL_SQ / 2}
        width={WHEEL_SQ}
        height={WHEEL_SQ}
        fill={cell.compHex}
      />

      <!-- 内側（地）の正方形 → 図アイコン の矢印 -->
      <line
        x1={cell.arrowX1}
        y1={cell.arrowY1}
        x2={cell.arrowX2}
        y2={cell.arrowY2}
        stroke={ICON_HEX}
        stroke-width={ARROW_STROKE_WIDTH}
        stroke-linecap="round"
        marker-end="url(#wheel-arrow)"
      />

      <!-- 図のアイコン（地→補色の 7:3・補色寄り） -->
      {@render grayFlower(cell.figX, cell.figY, WHEEL_ICON_SIZE)}
    </g>

    <!-- プレビュー：その色相の v トーンで塗りつぶした正方形 -->
    <rect x={cell.px - SQ / 2} y={cell.py - SQ / 2} width={SQ} height={SQ} fill={cell.hex} />

    <!-- プレビュー中央の Gy-8.0 アイコン -->
    {@render grayFlower(cell.px, cell.py, ICON_SIZE)}
  {/each}
</svg>
