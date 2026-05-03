<script lang="ts">
  import PlaybackStage from "$lib/demo/PlaybackStage.svelte"
  import BenhamsTop from "./BenhamsTop.svelte"

  const FIRST_PHASE_SEC = 10
  const TOTAL_DURATION_SEC = 20
  const ROT_SPEED_DEG_PER_SEC = 720

  let angle = $state(0)
  let rafId: number | null = null
  let startTime = 0
  let prevTime = 0

  function tick(time: number) {
    if (startTime === 0) {
      startTime = time
      prevTime = time
    }
    const dt = (time - prevTime) / 1000
    const elapsed = (time - startTime) / 1000
    const direction = elapsed < FIRST_PHASE_SEC ? 1 : -1
    angle += direction * dt * ROT_SPEED_DEG_PER_SEC
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
    startTime = 0
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
    <BenhamsTop />
  </div>
</PlaybackStage>

<style>
  .rotator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80cqh;
    aspect-ratio: 1 / 1;
    translate: -50% -50%;
  }

  .rotator :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
