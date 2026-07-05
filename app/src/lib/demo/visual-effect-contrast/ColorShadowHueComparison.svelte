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
      figY
    }
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}">
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

    <!-- 図のアイコン（地→補色の 7:3・補色寄り） -->
    {@render grayFlower(cell.figX, cell.figY, WHEEL_ICON_SIZE)}

    <!-- プレビュー：その色相の v トーンで塗りつぶした正方形 -->
    <rect x={cell.px - SQ / 2} y={cell.py - SQ / 2} width={SQ} height={SQ} fill={cell.hex} />

    <!-- プレビュー中央の Gy-8.0 アイコン -->
    {@render grayFlower(cell.px, cell.py, ICON_SIZE)}
  {/each}
</svg>
