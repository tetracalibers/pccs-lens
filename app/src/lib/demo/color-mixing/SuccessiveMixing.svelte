<script lang="ts">
  import PlaybackStage from "$lib/demo/PlaybackStage.svelte"
  import SuccessiveMixingDisc from "./SuccessiveMixingDisc.svelte"

  const TOTAL_DURATION_SEC = 2
  const ROT_SPEED_RPM = 600
  const ROT_SPEED_DEG_PER_SEC = (ROT_SPEED_RPM * 360) / 60

  let angle = $state(0)
  let rafId: number | null = null
  let prevTime = 0

  function tick(time: number) {
    if (prevTime === 0) prevTime = time
    const dt = (time - prevTime) / 1000
    angle += dt * ROT_SPEED_DEG_PER_SEC
    prevTime = time
    rafId = requestAnimationFrame(tick)
  }

  function cancelRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function handlePlay() {
    cancelRaf()
    angle = 0
    prevTime = 0
    rafId = requestAnimationFrame(tick)
  }

  function handleStop() {
    cancelRaf()
    angle = 0
  }

  function handleFinish() {
    cancelRaf()
  }

  $effect(() => {
    return () => cancelRaf()
  })
</script>

<PlaybackStage
  duration={TOTAL_DURATION_SEC}
  onPlay={handlePlay}
  onStop={handleStop}
  onFinish={handleFinish}
>
  <div class="rotator" style:transform="rotate({angle}deg)">
    <SuccessiveMixingDisc />
  </div>
</PlaybackStage>

<style>
  .rotator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 70cqh;
    aspect-ratio: 1 / 1;
    translate: -50% -50%;
  }

  .rotator :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
