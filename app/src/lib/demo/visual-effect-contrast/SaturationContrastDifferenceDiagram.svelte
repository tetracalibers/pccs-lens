<script lang="ts">
  import Icon from "@iconify/svelte"
  import chroma from "chroma-js"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト定数 =====
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
  // 図と最高彩度の地を PCCS 記号で指定し、他の地の色・図の彩度はここから算出する。
  // 純度優先：全体を最高彩度地の明度・色相 (L,H) に固定し、彩度だけを変化させることで
  // 明度対比・色相対比が混ざらない純粋な「彩度差」を作る。
  // 色選びの制約：
  // - 図と最高彩度地は同系色相・明度が近いものを選ぶ（L・H は地に合わせるため、
  //   図はその L・H 上に「図PCCSの彩度」だけを反映＝厳密な PCCS 色にはならない）
  // - 最高彩度地の彩度 ＞ 図の彩度（図がランプの内側に入り「地が鮮やか→図がくすむ」を示す）
  const FIGURE_PCCS = "d2" // 図（この色の彩度だけを使う）
  const GROUND_MAX_PCCS = "v2" // 最も彩度の高い地（図の L・H・彩度上限の基準）
  const N_PANELS = 5 // 地のパネル数（先頭は彩度0＝無彩色グレイ）

  // 最高彩度地から明度 L・色相 H・彩度上限 C を取得
  const [LCH_L, GROUND_MAX_CHROMA, LCH_H] = chroma(
    PCCS_HEX_MAP.get(GROUND_MAX_PCCS) ?? "#000000"
  ).lch()
  // 図は L・H を地に合わせ、図PCCSの彩度だけを採用
  const FIGURE_CHROMA = chroma(PCCS_HEX_MAP.get(FIGURE_PCCS) ?? "#000000").lch()[1]
  // 彩度0（無彩色グレイ）→ 最高彩度まで等間隔
  const GROUND_CHROMAS = Array.from(
    { length: N_PANELS },
    (_, i) => (GROUND_MAX_CHROMA * i) / (N_PANELS - 1)
  )

  const FIGURE_HEX = chroma.lch(LCH_L, FIGURE_CHROMA, LCH_H).hex()
  const GROUND_HEXES = GROUND_CHROMAS.map((c) => chroma.lch(LCH_L, c, LCH_H).hex())
  // 矢印は地の彩度グラデーション。矢先は最も鮮やかな右端の地の色に合わせる
  const COL_ARROW_HEAD = GROUND_HEXES[GROUND_HEXES.length - 1]

  // ===== 座標計算 =====
  const STEP = GROUND_SIZE + GAP_X
  const CONTENT_W = N_PANELS * GROUND_SIZE + (N_PANELS - 1) * GAP_X
  const ICON_OFFSET = (GROUND_SIZE - ICON_SIZE) / 2

  // 軸（矢印＋左右ラベル）は全パネルにわたって配置する
  const ARROW_Y = GROUND_SIZE + ARROW_GAP
  const AXIS_X1 = 0 // 軸の左端（「低」の位置）
  const AXIS_X2 = (N_PANELS - 1) * STEP + GROUND_SIZE // 軸の右端（「高」の位置）

  // グラデーションの端点は各パネルの中心に合わせ、地の色がその位置に並ぶようにする
  const GRAD_X1 = GROUND_SIZE / 2
  const GRAD_X2 = (N_PANELS - 1) * STEP + GROUND_SIZE / 2

  // ===== ラベル =====
  const FONT_SIZE_AXIS_TITLE = 18 // 「地の彩度」
  const FONT_SIZE_SIDE_LABEL = 18 // 「低」「高」
  const SIDE_LABEL_W = FONT_SIZE_SIDE_LABEL // 「低」「高」1文字分の目安の幅
  const SIDE_LABEL_GAP = 12 // 「低」「高」と矢印の間隔
  // 「低」「高」を左右に置く分、矢印を内側へ短くする（右端は矢先の張り出しも考慮）
  const ARROW_X1 = AXIS_X1 + SIDE_LABEL_W + SIDE_LABEL_GAP
  const ARROW_X2 = AXIS_X2 - SIDE_LABEL_W - SIDE_LABEL_GAP - ARROW_HEAD_SIZE / 2
  const BOTTOM_LABEL_GAP = 14 // 矢印から「地の彩度」上端までの距離
  const BOTTOM_LABEL_Y = ARROW_Y + BOTTOM_LABEL_GAP
  const LABEL_CENTER_X = (AXIS_X1 + AXIS_X2) / 2 // 「地の彩度」を中央に
  const COL_LABEL = "var(--color-body)" // 「地の彩度」
  const COL_LABEL_LOW = GROUND_HEXES[0] // 「低」＝最左（無彩色グレイ）の地の色
  const COL_LABEL_HIGH = GROUND_HEXES[GROUND_HEXES.length - 1] // 「高」＝最右の地の色

  // ===== viewBox（内容にフィット） =====
  const VB_PAD = 6
  const HEAD_HALF = ARROW_HEAD_SIZE / 2
  const VB_X = -VB_PAD
  const VB_Y = -VB_PAD
  const VB_W = CONTENT_W + 2 * VB_PAD
  const VB_BOTTOM = Math.max(ARROW_Y + HEAD_HALF, BOTTOM_LABEL_Y + FONT_SIZE_AXIS_TITLE)
  const VB_H = VB_BOTTOM - VB_Y + VB_PAD
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
        stroke={COL_ARROW_HEAD}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>

    <linearGradient
      id="saturation-contrast-gradient"
      gradientUnits="userSpaceOnUse"
      x1={GRAD_X1}
      y1={ARROW_Y}
      x2={GRAD_X2}
      y2={ARROW_Y}
    >
      {#each GROUND_HEXES as hex, i (i)}
        <stop offset="{(i / (GROUND_HEXES.length - 1)) * 100}%" stop-color={hex} />
      {/each}
    </linearGradient>
  </defs>

  {#snippet figureIcon(colX: number)}
    <foreignObject x={colX + ICON_OFFSET} y={ICON_OFFSET} width={ICON_SIZE} height={ICON_SIZE}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {FIGURE_HEX}; display: grid; place-items: center;"
      >
        <Icon icon={ICON_ID} width={ICON_SIZE} height={ICON_SIZE} />
      </div>
    </foreignObject>
  {/snippet}

  <!-- 地（外側）の彩度を左（無彩色）→右へ上げる。図の色は全パネル共通 -->
  {#each GROUND_HEXES as groundHex, i (i)}
    {@const colX = i * STEP}
    <rect x={colX} y="0" width={GROUND_SIZE} height={GROUND_SIZE} fill={groundHex} />
    {@render figureIcon(colX)}
  {/each}

  <!-- 彩度差が大きくなる方向＝彩度対比が強まる方向 -->
  <line
    x1={ARROW_X1}
    y1={ARROW_Y}
    x2={ARROW_X2}
    y2={ARROW_Y}
    stroke="url(#saturation-contrast-gradient)"
    stroke-width={ARROW_STROKE_WIDTH}
    stroke-linecap="round"
    marker-end="url(#saturation-contrast-arrow)"
  />

  <!-- 矢印中央下に「地の彩度」 -->
  <text
    x={LABEL_CENTER_X}
    y={BOTTOM_LABEL_Y}
    text-anchor="middle"
    dominant-baseline="hanging"
    font-size={FONT_SIZE_AXIS_TITLE}
    fill={COL_LABEL}
  >
    地の彩度
  </text>

  <!-- 矢印の左右に「低」「高」（それぞれ最左・最右の地の色） -->
  <text
    x={AXIS_X1}
    y={ARROW_Y}
    text-anchor="start"
    dominant-baseline="central"
    font-size={FONT_SIZE_SIDE_LABEL}
    font-weight="bold"
    fill={COL_LABEL_LOW}
  >
    低
  </text>
  <text
    x={AXIS_X2}
    y={ARROW_Y}
    text-anchor="end"
    dominant-baseline="central"
    font-size={FONT_SIZE_SIDE_LABEL}
    font-weight="bold"
    fill={COL_LABEL_HIGH}
  >
    高
  </text>
</svg>
