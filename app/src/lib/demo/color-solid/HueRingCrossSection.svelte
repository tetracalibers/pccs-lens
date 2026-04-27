<script lang="ts">
  import { PCCS_HUE_MAP } from "$lib/data/pccs"

  // ===== レイアウト定数 =====
  const R = 200 // 色相環の半径
  const HUE_DOT_R = 14 // 各色相点の半径
  const CENTER_DOT_R = 13 // 中心の無彩色（V=5 グレイ）の半径
  const PAD = 8

  // ===== SVG サイズ =====
  const HALF = R + HUE_DOT_R + PAD
  const W = HALF * 2
  const H = HALF * 2
  const cx = HALF
  const cy = HALF

  // ===== 色相番号 → 角度 =====
  // ColorSolidSphere と同じ配置: num 20 (V) を 12 時方向、num 2 (R) を 3 時方向
  const TOP_HUE_NUM = 20
  const HUE_COUNT = 24
  const ANGLE_PER_HUE = (2 * Math.PI) / HUE_COUNT

  function hueAngle(num: number): number {
    return -Math.PI / 2 + (num - TOP_HUE_NUM) * ANGLE_PER_HUE
  }

  type HueDot = {
    num: number
    color: string
    dotX: number
    dotY: number
  }

  const dots: HueDot[] = Array.from(PCCS_HUE_MAP.entries()).map(([num, data]) => {
    const a = hueAngle(num)
    return {
      num,
      color: data.color,
      dotX: cx + R * Math.cos(a),
      dotY: cy + R * Math.sin(a)
    }
  })

  // 中心の無彩色（明度スケールの V=5 と同じグレイ）
  const NEUTRAL_GRAY = "#808080"
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
  <!-- 円盤の薄い塗り（断面が平面であることを示す） -->
  <circle {cx} {cy} r={R} fill="lightslategray" fill-opacity="0.15" />

  <!-- 円盤の境界 -->
  <circle {cx} {cy} r={R} fill="none" stroke="slategray" stroke-width="1.5" />

  <!-- 中心の無彩色（V=5 グレイ）。明度軸が紙面と垂直に貫いている断面の中心点 -->
  <circle {cx} {cy} r={CENTER_DOT_R} fill={NEUTRAL_GRAY} stroke="#444" stroke-width="0.8" />

  <!-- 24 色相の点（最大彩度 v トーン）。明度スケール円と同じ半径で円周上に配置 -->
  {#each dots as dot (dot.num)}
    <circle
      cx={dot.dotX}
      cy={dot.dotY}
      r={HUE_DOT_R}
      fill={dot.color}
      stroke="#fff"
      stroke-width="0.8"
    />
  {/each}
</svg>
