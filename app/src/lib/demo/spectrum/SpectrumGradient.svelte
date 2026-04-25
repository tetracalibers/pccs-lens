<script lang="ts">
  interface GradientStop {
    nm: number
    color: string
  }

  const NM_MIN = 380
  const NM_MAX = 780

  const gradientStops: GradientStop[] = [
    { nm: 380, color: "#4b0082" },
    { nm: 430, color: "#0000ff" },
    { nm: 480, color: "#00bfff" },
    { nm: 510, color: "#00ff80" },
    { nm: 550, color: "#00ff00" },
    { nm: 600, color: "#ffff00" },
    { nm: 640, color: "#ffb000" },
    { nm: 670, color: "#ff7f00" },
    { nm: 700, color: "#ff0000" },
    { nm: 780, color: "#7a0000" }
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
