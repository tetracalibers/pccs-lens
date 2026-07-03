<script lang="ts">
  import Icon from "@iconify/svelte"
  import chroma from "chroma-js"

  // ===== レイアウト定数 =====
  const N_PANELS = 4
  const GROUND_SIZE = 120 // 地（外側の正方形）の一辺
  const ICON_ID = "mynaui:flower-solid" // 図（花アイコン）
  const ICON_SIZE = 84 // 図アイコンの一辺
  const GAP_X = 24 // パネル同士の隙間

  // ===== 矢印（彩度差＝彩度対比が増す方向を示す） =====
  const ARROW_GAP = 22 // パネル下端から矢印までの距離
  const ARROW_STROKE_WIDTH = 2.5

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 20 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色 =====
  // 明度・色相を固定し彩度（chroma）だけを変化させることで、
  // 明度対比・色相対比が混ざらない純粋な「彩度差」を作る
  const LCH_L = 62 // 明度（全色で共通）
  const LCH_H = 355 // 色相（ピンク系・全色で共通）
  const FIGURE_CHROMA = 28 // 図の彩度（全パネルで一定）
  // 左→右で地の彩度が上がる＝図との彩度差が段階的に大きくなる
  const GROUND_CHROMAS = [38, 54, 70, 88]

  const COL_ARROW = "var(--color-body)"

  const FIGURE_HEX = chroma.lch(LCH_L, FIGURE_CHROMA, LCH_H).hex()
  const GROUND_HEXES = GROUND_CHROMAS.map((c) => chroma.lch(LCH_L, c, LCH_H).hex())

  // ===== 座標計算 =====
  const STEP = GROUND_SIZE + GAP_X
  const CONTENT_W = N_PANELS * GROUND_SIZE + (N_PANELS - 1) * GAP_X
  const ICON_OFFSET = (GROUND_SIZE - ICON_SIZE) / 2

  const ARROW_Y = GROUND_SIZE + ARROW_GAP
  const ARROW_X1 = 0
  const ARROW_X2 = CONTENT_W

  // ===== viewBox（内容にフィット） =====
  const VB_PAD = 6
  const HEAD_HALF = ARROW_HEAD_SIZE / 2
  const VB_X = -VB_PAD
  const VB_Y = -VB_PAD
  const VB_W = CONTENT_W + HEAD_HALF + 2 * VB_PAD
  const VB_H = ARROW_Y + HEAD_HALF + 2 * VB_PAD
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VB_X} {VB_Y} {VB_W} {VB_H}">
  <defs>
    <marker
      id="saturation-contrast-arrow"
      viewBox="0 0 {ARROW_HEAD_VIEWBOX} {ARROW_HEAD_VIEWBOX}"
      refX={ARROW_HEAD_VIEWBOX / 2}
      refY={ARROW_HEAD_VIEWBOX / 2}
      markerWidth={ARROW_HEAD_SIZE}
      markerHeight={ARROW_HEAD_SIZE}
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <polyline
        points="0,3.5 3.5,1.75 0,0"
        fill="none"
        stroke={COL_ARROW}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 図（花アイコン）は全パネル共通の色。地（外側）の彩度だけを右へ向かって上げる -->
  {#each GROUND_HEXES as groundHex, i (i)}
    <rect x={i * STEP} y="0" width={GROUND_SIZE} height={GROUND_SIZE} fill={groundHex} />
    <foreignObject x={i * STEP + ICON_OFFSET} y={ICON_OFFSET} width={ICON_SIZE} height={ICON_SIZE}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {FIGURE_HEX}; display: grid; place-items: center;"
      >
        <Icon icon={ICON_ID} width={ICON_SIZE} height={ICON_SIZE} />
      </div>
    </foreignObject>
  {/each}

  <!-- 彩度差が大きくなる方向＝彩度対比が強まる方向 -->
  <line
    x1={ARROW_X1}
    y1={ARROW_Y}
    x2={ARROW_X2}
    y2={ARROW_Y}
    stroke={COL_ARROW}
    stroke-width={ARROW_STROKE_WIDTH}
    stroke-linecap="round"
    marker-end="url(#saturation-contrast-arrow)"
  />
</svg>
