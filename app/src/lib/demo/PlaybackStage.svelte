<script lang="ts">
  import type { Snippet } from "svelte"
  import Icon from "@iconify/svelte"

  type Phase = "idle" | "playing" | "finished"

  interface Props {
    children: Snippet<[{ phase: Phase; remaining: number }]>
    duration?: number
    onPlay?: () => void
    onStop?: () => void
    onFinish?: () => void
    height?: number
  }

  let { children, duration = 30, onPlay, onStop, onFinish, height = 250 }: Props = $props()

  let phase: Phase = $state("idle")
  let remaining: number = $state(0)
  let timerId: ReturnType<typeof setInterval> | null = null

  function clearTimer() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function start() {
    clearTimer()
    remaining = duration
    phase = "playing"
    onPlay?.()
    timerId = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearTimer()
        phase = "finished"
        onFinish?.()
      }
    }, 1000)
  }

  function stop() {
    clearTimer()
    remaining = duration
    phase = "idle"
    onStop?.()
  }

  $effect(() => {
    return () => clearTimer()
  })
</script>

<div class="stage" style:--_height={height + "px"}>
  {@render children({ phase, remaining })}

  {#if phase === "idle"}
    <button class="corner-btn top-left" type="button" onclick={start} aria-label="再生">
      <Icon icon="mdi:motion-play-outline" width="32" height="32" />
    </button>
    <div class="countdown top-right">{duration}s</div>
  {:else if phase === "playing"}
    <button class="corner-btn top-left" type="button" onclick={stop} aria-label="停止">
      <Icon icon="mdi:motion-pause-outline" width="32" height="32" />
    </button>
    <div class="countdown top-right" aria-live="polite">{remaining}s</div>
  {:else if phase === "finished"}
    <button class="corner-btn top-left" type="button" onclick={start} aria-label="もう一度再生">
      <Icon icon="fluent:replay-28-regular" width="32" height="32" />
    </button>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: var(--_height);
    aspect-ratio: 16 / 9;
    background-color: #fff;
    border: 1px solid light-dark(#091e4221, #ffffff5e);
    overflow: hidden;
    box-sizing: border-box;
    margin-block: 1rem;
    border-radius: 6px;
    container-type: size;
  }

  .corner-btn {
    position: absolute;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-body--light);
    padding: 0;
    display: grid;
    place-items: center;
  }

  .top-left {
    top: 0.75rem;
    left: 0.75rem;
  }

  .top-right {
    top: 0.75rem;
    right: 0.75rem;
  }

  .countdown {
    position: absolute;
    color: var(--color-body--light);
    font-family: var(--font-mono);
    font-size: 1.2rem;
    padding: 0;
    padding-block-start: 0.25lh;
    min-width: 2.5rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
</style>
