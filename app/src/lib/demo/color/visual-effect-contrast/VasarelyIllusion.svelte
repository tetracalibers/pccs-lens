<script lang="ts">
  // ===== 重ねる正方形の段階数 =====
  const STEP_COUNT = 9

  // ===== 無彩色の明るさ範囲（0–255 のグレイ値。外＝暗、内＝明） =====
  const GRAY_MIN = 40 // 最も外側の正方形の明るさ
  const GRAY_MAX = 235 // 最も内側の正方形の明るさ

  // ===== レイアウト =====
  const OUTER_SIZE = 480 // 最も外側の正方形の一辺
  // 隣り合う正方形の一辺の差の半分（＝各正方形の見えている縁の幅）。
  // 全ての正方形を中心に揃えて重ねるため、この幅は全段で一定になる
  const FRAME = 26

  // ===== 派生値 =====
  const WIDTH = OUTER_SIZE
  const HEIGHT = OUTER_SIZE

  // 0–255 のグレイ値を #rrggbb に変換する
  function grayHex(value: number): string {
    const clamped = Math.max(0, Math.min(255, Math.round(value)))
    const h = clamped.toString(16).padStart(2, "0")
    return `#${h}${h}${h}`
  }

  // 外側（暗）から内側（明）へ均等に明るくなる正方形。
  // i=0 が最も外側で最大・最暗、i=STEP_COUNT-1 が最も内側で最小・最明。
  // 全て中心を揃えて重ねるため、外側の正方形は縁だけが見え、
  // 内側の正方形ほど手前に描かれる
  const SQUARES = Array.from({ length: STEP_COUNT }, (_, i) => {
    const size = OUTER_SIZE - 2 * FRAME * i
    const offset = FRAME * i
    const gray = grayHex(GRAY_MIN + ((GRAY_MAX - GRAY_MIN) * i) / (STEP_COUNT - 1))
    return { size, offset, gray }
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 中心を揃えて重ねた正方形。外側ほど暗く、内側ほど明るい。
       各正方形の縁が交わる対角線上で縁辺対比が強まり、
       角から中心へ向かう明るい対角線（ヴァザレリ錯視）が見える -->
  {#each SQUARES as square, i (i)}
    <rect
      x={square.offset}
      y={square.offset}
      width={square.size}
      height={square.size}
      fill={square.gray}
    />
  {/each}
</svg>
