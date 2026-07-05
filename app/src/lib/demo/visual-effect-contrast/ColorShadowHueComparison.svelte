<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== プレビュー（色陰現象の見本）のジオメトリ =====
  const RING_R = 90 // プレビュー正方形の中心が並ぶ円の半径
  const SQ = 76 // プレビュー正方形の一辺
  const ICON_SIZE = Math.round(SQ * 0.85) // プレビュー中央のアイコンサイズ

  // ===== 各プレビュー外側の「図アイコン → 矢印 → 補色の正方形」のサイズ =====
  // 正方形・図アイコンのサイズ基準（プレビュー一辺 SQ に対する比率で決める）
  const WHEEL_DIAMETER_RATIO = 1.25
  const WHEEL_RADIUS = (SQ * WHEEL_DIAMETER_RATIO) / 2
  const WHEEL_SQ_RADIUS_RATIO = 0.5
  const WHEEL_SQ = Math.round(WHEEL_RADIUS * WHEEL_SQ_RADIUS_RATIO) // 補色の正方形の一辺
  const WHEEL_ICON_SIZE = WHEEL_SQ // 図アイコンは正方形と同じサイズ

  // ===== 放射方向の並び（内側→外側）: プレビュー | 図アイコン | 矢印 | 補色正方形 =====
  // 図アイコンと補色正方形の距離は、矢印の長さ＋両端の隙間から決まる。
  const WHEEL_GAP = 9 // プレビュー外縁と図アイコンの隙間
  const FIG_TO_ARROW_GAP = 4.5 // 図アイコンと矢印（尾）の隙間
  const ARROW_LENGTH = 30 // 矢印（線）の長さ
  const ARROW_HEAD_GAP = 8 // 矢じりと補色正方形の隙間

  // ===== 矢じり（マーカー）形状 =====
  const ARROW_STROKE_WIDTH = 1.5
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 12 // 矢先のレンダリングサイズ（user space）
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE
  // 矢印の色は図アイコンと同じ（ICON_HEX を使用）

  const MARGIN = 10 // viewBox 外周の余白

  // ===== アイコン・色 =====
  const ICON_ID = "material-symbols-light:square"
  const GY_NOTATION = "Gy-6.0" // 図アイコンの色（PCCS 無彩色）
  const ICON_HEX = PCCS_HEX_MAP.get(GY_NOTATION) ?? "#C8C8C8"

  // ===== 放射方向の各要素の半径（合成の中心からの距離）=====
  const PREVIEW_OUTER = RING_R + SQ / 2
  const FIG_ICON_R = PREVIEW_OUTER + WHEEL_GAP + WHEEL_ICON_SIZE / 2 // 図アイコン中心
  const ARROW_START_R = FIG_ICON_R + WHEEL_ICON_SIZE / 2 + FIG_TO_ARROW_GAP // 矢印の尾
  const ARROW_END_R = ARROW_START_R + ARROW_LENGTH // 矢じり
  const COMP_R = ARROW_END_R + ARROW_HEAD_GAP + WHEEL_SQ / 2 // 補色正方形中心

  const HALF_EXTENT = COMP_R + WHEEL_SQ / 2 + MARGIN
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
    // 図アイコン（内側）
    figX: number
    figY: number
    // 矢印
    arrowX1: number
    arrowY1: number
    arrowX2: number
    arrowY2: number
    // 補色の正方形（外側）
    compX: number
    compY: number
    compHex: string
  }

  const CELLS: HueCell[] = HUES.map((hue) => {
    // プレビュー・図アイコン・補色は同じ放射方向（外向き）に一直線に並べる
    const dx = Math.cos(hueAngle(hue))
    const dy = Math.sin(hueAngle(hue))
    return {
      hue,
      px: CX + RING_R * dx,
      py: CY + RING_R * dy,
      hex: PCCS_HEX_MAP.get(`v${hue}`) ?? "#000000",
      figX: CX + FIG_ICON_R * dx,
      figY: CY + FIG_ICON_R * dy,
      arrowX1: CX + ARROW_START_R * dx,
      arrowY1: CY + ARROW_START_R * dy,
      arrowX2: CX + ARROW_END_R * dx,
      arrowY2: CY + ARROW_END_R * dy,
      compX: CX + COMP_R * dx,
      compY: CY + COMP_R * dy,
      compHex: PCCS_HEX_MAP.get(`v${complementHue(hue)}`) ?? "#000000"
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
    <!-- 補色の正方形（外側） -->
    <rect
      x={cell.compX - WHEEL_SQ / 2}
      y={cell.compY - WHEEL_SQ / 2}
      width={WHEEL_SQ}
      height={WHEEL_SQ}
      fill={cell.compHex}
    />

    <!-- 図アイコン → 補色の正方形 への矢印 -->
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

    <!-- 図アイコン（内側） -->
    {@render grayFlower(cell.figX, cell.figY, WHEEL_ICON_SIZE)}

    <!-- プレビュー：その色相の v トーンで塗りつぶした正方形 -->
    <rect x={cell.px - SQ / 2} y={cell.py - SQ / 2} width={SQ} height={SQ} fill={cell.hex} />

    <!-- プレビュー中央の Gy-8.0 アイコン -->
    {@render grayFlower(cell.px, cell.py, ICON_SIZE)}
  {/each}

  <!-- 4つのプレビュー中央の基準アイコン（プレビュー内の図と同じサイズ） -->
  {@render grayFlower(CX, CY, ICON_SIZE)}
</svg>
