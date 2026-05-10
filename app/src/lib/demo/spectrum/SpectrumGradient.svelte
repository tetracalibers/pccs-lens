<script lang="ts">
  interface GradientStop {
    nm: number
    color: string
  }

  const NM_MIN = 380
  const NM_MAX = 780

  // 波長と色の対応:
  //   紫 380〜430 / 藍 430〜460 / 青 460〜500 / 緑 500〜570
  //   黄 570〜590 / 橙 590〜610 / 赤 610〜780
  // 各色を範囲の中心付近に置き、隣接色との間で滑らかに遷移させる
  const gradientStops: GradientStop[] = [
    { nm: 405, color: "#4b0082" }, // 紫 中心
    { nm: 445, color: "#0000ff" }, // 藍 中心
    { nm: 480, color: "#00bfff" }, // 青 中心
    { nm: 535, color: "#00ff00" }, // 緑 中心
    { nm: 580, color: "#ffff00" }, // 黄 中心
    { nm: 600, color: "#ff7f00" }, // 橙 中心
    { nm: 620, color: "#ff0000" }, // 赤 入り口（純赤）
    { nm: 780, color: "#7a0000" }  // 赤 帯端
  ]

  const gradientOffset = (nm: number): number => (nm - NM_MIN) / (NM_MAX - NM_MIN)
</script>

<div class="wrapper">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 150">
    <defs>
      <linearGradient id="visibleSpectrumGradient" x1="0" y1="0" x2="1" y2="0">
        {#each gradientStops as stop, i (i)}
          <stop offset={gradientOffset(stop.nm)} stop-color={stop.color} />
        {/each}
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="960" height="150" fill="url(#visibleSpectrumGradient)" />
  </svg>
</div>

<style>
  .wrapper {
    width: 100%;
  }

  .wrapper svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
