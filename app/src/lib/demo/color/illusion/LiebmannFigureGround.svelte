<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト =====
  const SIZE = 320 // 地（正方形）の一辺
  const DRAGON_W = 240 // ドラゴンの幅
  const DRAGON_H = DRAGON_W * (512 / 640) // fa6-solid:dragon の縦横比（640×512）を維持

  // ===== 色 =====
  // 地は v13（鮮やかな緑）、図は v3（鮮やかな赤）。
  // 色相・彩度は大きく異なるが明度がほぼ揃っているため、ドラゴン（図）の輪郭が
  // 地に溶けてちらつき、どちらが地でどちらが図か関係が不安定になる（リープマン効果）。
  const COL_GROUND = PCCS_HEX_MAP.get("v13")! // 地
  const COL_FIGURE = PCCS_HEX_MAP.get("v3")! // 図

  // ===== 図 =====
  const ICON_ID = "game-icons:dragon-shield"

  // 中央にドラゴンを1体だけ配置
  const dragonX = (SIZE - DRAGON_W) / 2
  const dragonY = (SIZE - DRAGON_H) / 2
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 地：v13 の正方形で塗りつぶす -->
  <rect x="0" y="0" width={SIZE} height={SIZE} fill={COL_GROUND} />

  <!-- 図：v3 のドラゴンを中央に大きく配置 -->
  <foreignObject x={dragonX} y={dragonY} width={DRAGON_W} height={DRAGON_H}>
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style="width: 100%; height: 100%; color: {COL_FIGURE}; display: grid; place-items: center;"
    >
      <Icon icon={ICON_ID} width={DRAGON_W} height={DRAGON_H} />
    </div>
  </foreignObject>
</svg>
