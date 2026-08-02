<script lang="ts">
  import chroma from "chroma-js"

  type Patch = {
    /** パッチ名（識別用。図には描画しない） */
    name: string
    hex: string
    /** 無彩色のパッチ。彩度の底上げの対象外にする */
    neutral?: boolean
  }

  // ===== パッチのレイアウト =====
  const COLS = 6
  const ROWS = 4
  const PATCH_SIZE = 100
  const PATCH_GAP = 14
  const PATCH_RADIUS = 4

  // ===== 台紙（フレーム） =====
  const FRAME_PADDING = 22 // 台紙の縁とパッチ群の隙間

  // ===== 彩度 =====
  // 演色性が低い場合との対比を出すため、基準の色より彩度を上げる
  const SATURATE_AMOUNT = 1

  // ===== 色 =====
  const COL_FRAME = "#2b2b2b" // ColorChecker の黒い台紙

  // ===== パッチの色（ColorChecker Classic 24色・基準光下での見え方） =====
  const PATCHES: Patch[] = [
    // 1行目
    { name: "dark skin", hex: "#735244" },
    { name: "light skin", hex: "#c29682" },
    { name: "blue sky", hex: "#627a9d" },
    { name: "foliage", hex: "#576c43" },
    { name: "blue flower", hex: "#8580b1" },
    { name: "bluish green", hex: "#67bdaa" },
    // 2行目
    { name: "orange", hex: "#d67e2c" },
    { name: "purplish blue", hex: "#505ba6" },
    { name: "moderate red", hex: "#c15a63" },
    { name: "purple", hex: "#5e3c6c" },
    { name: "yellow green", hex: "#9dbc40" },
    { name: "orange yellow", hex: "#e0a32e" },
    // 3行目
    { name: "blue", hex: "#383d96" },
    { name: "green", hex: "#469449" },
    { name: "red", hex: "#af363c" },
    { name: "yellow", hex: "#e7c71f" },
    { name: "magenta", hex: "#bb5695" },
    { name: "cyan", hex: "#0885a1" },
    // 4行目（無彩色のグレースケール）
    { name: "white", hex: "#f3f3f3", neutral: true },
    { name: "neutral 8", hex: "#c8c8c8", neutral: true },
    { name: "neutral 6.5", hex: "#a0a0a0", neutral: true },
    { name: "neutral 5", hex: "#7a7a7a", neutral: true },
    { name: "neutral 3.5", hex: "#555555", neutral: true },
    { name: "black", hex: "#343434", neutral: true }
  ]

  // ===== 台紙の大きさ（パッチ群から自動算出） =====
  const GRID_WIDTH = COLS * PATCH_SIZE + (COLS - 1) * PATCH_GAP
  const GRID_HEIGHT = ROWS * PATCH_SIZE + (ROWS - 1) * PATCH_GAP
  const WIDTH = GRID_WIDTH + FRAME_PADDING * 2
  const HEIGHT = GRID_HEIGHT + FRAME_PADDING * 2

  // ===== 各パッチの色と座標 =====
  const cells = PATCHES.map((patch, i) => ({
    name: patch.name,
    hex: patch.neutral ? patch.hex : chroma(patch.hex).saturate(SATURATE_AMOUNT).hex(),
    x: FRAME_PADDING + (i % COLS) * (PATCH_SIZE + PATCH_GAP),
    y: FRAME_PADDING + Math.floor(i / COLS) * (PATCH_SIZE + PATCH_GAP)
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 台紙 -->
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_FRAME} />

  <!-- カラーパッチ -->
  {#each cells as cell (cell.name)}
    <rect
      x={cell.x}
      y={cell.y}
      width={PATCH_SIZE}
      height={PATCH_SIZE}
      rx={PATCH_RADIUS}
      fill={cell.hex}
    />
  {/each}
</svg>
