<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  type Phase = "idle" | "playing" | "finished"

  const RED = PCCS_HEX_MAP.get("v2")!
  const DURATION_SEC = 30

  let phase: Phase = $state("idle")
  let remaining: number = $state(DURATION_SEC)
  let timerId: ReturnType<typeof setInterval> | null = null

  function clearTimer() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function start() {
    clearTimer()
    remaining = DURATION_SEC
    phase = "playing"
    timerId = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearTimer()
        phase = "finished"
      }
    }, 1000)
  }

  function stop() {
    clearTimer()
    remaining = DURATION_SEC
    phase = "idle"
  }

  $effect(() => {
    return () => clearTimer()
  })
</script>

<div class="stage">
  {#if phase !== "finished"}
    <div class="circle" style:background-color={RED}></div>
  {/if}

  {#if phase === "idle"}
    <button class="corner-btn top-left" type="button" onclick={start} aria-label="再生">
      <Icon icon="mdi:motion-play-outline" width="32" height="32" />
    </button>
    <div class="countdown top-right">{DURATION_SEC}s</div>
  {:else if phase === "playing"}
    <button class="corner-btn top-left" type="button" onclick={stop} aria-label="停止">
      <Icon icon="mdi:motion-pause-outline" width="32" height="32" />
    </button>
    <div class="countdown top-right" aria-live="polite">{remaining}s</div>
  {:else if phase === "finished"}
    <button class="corner-btn top-left" type="button" onclick={start} aria-label="もう一度再生">
      <Icon icon="solar:restart-circle-bold" width="32" height="32" />
    </button>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    max-width: 450px;
    aspect-ratio: 16 / 9;
    background-color: #ffffff;
    border: 1px solid #000000;
    overflow: hidden;
    box-sizing: border-box;
    margin-block: 1rem;
  }

  .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 38%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
  }

  .corner-btn {
    position: absolute;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    color: #2a2a2a;
    display: grid;
    place-items: center;
  }

  .top-left {
    top: 0.5rem;
    left: 0.5rem;
  }

  .top-right {
    top: 0.5rem;
    right: 0.5rem;
  }

  .countdown {
    position: absolute;
    color: #2a2a2a;
    font-family: var(--font-mono);
    font-size: 1.4rem;
    padding: 0.4rem 0.75rem;
    min-width: 2.5rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
</style>
