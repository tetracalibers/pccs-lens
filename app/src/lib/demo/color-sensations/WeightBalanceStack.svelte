<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  interface Props {
    /** PCCS記号（例: "v2"） */
    topPCCS: string
    /** PCCS記号（例: "v2"） */
    bottomPCCS: string
  }

  let { topPCCS, bottomPCCS }: Props = $props()

  const topHex = $derived(PCCS_HEX_MAP.get(topPCCS)!)
  const bottomHex = $derived(PCCS_HEX_MAP.get(bottomPCCS)!)

  // ===== 台形の形状 =====
  // 上段・下段で共通の等脚台形（上辺＜下辺）
  const TRAP_TOP_W = 5.632 // 上辺の長さ
  const TRAP_BOT_W = 10.488 // 下辺の長さ
  const TRAP_H = 8.5 // 高さ
  const SLANT = (TRAP_BOT_W - TRAP_TOP_W) / 2 // 片側の張り出し（= 2.428）

  // ===== 台形の配置 =====
  // 上段（中央）
  const TOP_X = 9.184 // 上辺左端
  const TOP_Y = 2.75
  // 下段
  const BOTTOM_L_X = 3.434
  const BOTTOM_R_X = 14.934
  const BOTTOM_Y = 12.75

  // ===== viewBox =====
  // 図形群にフィット
  const VB_X = 1
  const VB_Y = 2.5
  const VB_W = 22
  const VB_H = 19

  // 上辺左端を起点に時計回りで台形を描く
  function trapezoidPath(x: number, y: number): string {
    return `M${x} ${y}h${TRAP_TOP_W}l${SLANT} ${TRAP_H}h-${TRAP_BOT_W}z`
  }
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VB_X} {VB_Y} {VB_W} {VB_H}">
  <path d={trapezoidPath(TOP_X, TOP_Y)} fill={topHex} />
  <path d={trapezoidPath(BOTTOM_L_X, BOTTOM_Y)} fill={bottomHex} />
  <path d={trapezoidPath(BOTTOM_R_X, BOTTOM_Y)} fill={bottomHex} />
</svg>
