<script lang="ts">
  // ===== レイアウト =====
  const MARGIN = 20 // 図の外周の余白
  const SQ = 190 // 正方形の一辺
  const TRI = 190 // 正三角形の一辺
  const TRI_H = (Math.sqrt(3) / 2) * TRI // 正三角形の高さ

  // ===== 色（ピンク・薄紫系）=====
  const COL_BG = "#ffffff" // 白背景
  const COL_SQUARE = "#fba5c0" // 正方形：ピンク
  const COL_TRIANGLE = "#b9a3e8" // 正三角形：薄紫（ラベンダー）

  // ===== 正方形（左）=====
  const SQ_X = MARGIN
  const SQ_Y = MARGIN

  // ===== 正三角形（頂点が上・底辺が下、正方形の右側に一部重ねる）=====
  const OVERLAP = 140 // 三角形を左へ寄せて重なりを大きくする（値が大きいほど左）
  const TRI_SHIFT_Y = 55 // 正三角形を正方形より下方向にずらす量
  const TRI_BASE_LEFT = SQ_X + SQ - OVERLAP // 底辺の左端x
  const TRI_BASE_RIGHT = TRI_BASE_LEFT + TRI // 底辺の右端x
  const TRI_BASE_Y = SQ_Y + SQ + TRI_SHIFT_Y // 底辺のy（正方形の底辺より下へずらす）
  const TRI_APEX_X = TRI_BASE_LEFT + TRI / 2 // 頂点x
  const TRI_APEX_Y = TRI_BASE_Y - TRI_H // 頂点y

  const trianglePoints = `${TRI_BASE_LEFT},${TRI_BASE_Y} ${TRI_BASE_RIGHT},${TRI_BASE_Y} ${TRI_APEX_X},${TRI_APEX_Y}`

  const WIDTH = TRI_BASE_RIGHT + MARGIN
  const HEIGHT = TRI_BASE_Y + MARGIN
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- isolation で重なりの乗算混色を図の内部だけで完結させる（背景色の影響を受けない） -->
  <g style="isolation: isolate">
    <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_BG} />
    <!-- 正方形と正三角形を乗算で重ねる。重なった部分は透明なフィルムが重なったように見える -->
    <rect x={SQ_X} y={SQ_Y} width={SQ} height={SQ} fill={COL_SQUARE} style="mix-blend-mode: multiply" />
    <polygon points={trianglePoints} fill={COL_TRIANGLE} style="mix-blend-mode: multiply" />
  </g>
</svg>
