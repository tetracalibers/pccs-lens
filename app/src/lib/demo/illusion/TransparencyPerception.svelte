<script lang="ts">
  // ===== レイアウト =====
  const MARGIN = 20 // 図の外周の余白
  const SQ = 190 // 正方形の一辺
  const TRI = 190 // 正三角形の一辺
  const TRI_H = (Math.sqrt(3) / 2) * TRI // 正三角形の高さ

  // ===== 色（ピンク・薄紫系）=====
  // 淡すぎると単色部分まで「白地越し」に見えて半透明に感じるため、彩度を上げて不透明感を出す
  const COL_BG = "#ffffff" // 白背景
  const COL_SQUARE = "#e86a9e" // 正方形：ピンク
  const COL_TRIANGLE = "#9776cf" // 正三角形：薄紫（ラベンダー）
  // 重なり部分：上2色の乗算値。透明なフィルムが重なったように見える色
  const COL_OVERLAP = "#893180"

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
  <defs>
    <!-- 正方形の領域。三角形をこの範囲に切り抜いて重なり部分だけを塗る -->
    <clipPath id="transparency-overlap-clip">
      <rect x={SQ_X} y={SQ_Y} width={SQ} height={SQ} />
    </clipPath>
  </defs>

  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_BG} />

  <!-- 正方形・正三角形はどちらも不透明の単色 -->
  <rect x={SQ_X} y={SQ_Y} width={SQ} height={SQ} fill={COL_SQUARE} />
  <polygon points={trianglePoints} fill={COL_TRIANGLE} />

  <!-- 重なり部分（正方形と三角形の交差領域）だけを透明に見える色で塗る -->
  <polygon points={trianglePoints} fill={COL_OVERLAP} clip-path="url(#transparency-overlap-clip)" />
</svg>
