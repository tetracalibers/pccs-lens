<script lang="ts">
  import Heading1 from "$lib/components/Heading1.svelte"
  import Mark from "$lib/components/m-directive/Mark.svelte"
  import ToneHuntCard from "$lib/components/tone-hunt/ToneHuntCard.svelte"
  import ClearOverlay from "$lib/components/games/ClearOverlay.svelte"
  import ClearSwatches from "$lib/components/games/ClearSwatches.svelte"
  import { generateRound, CANDIDATE_COUNT, type Mode, type Round } from "$lib/games/tone-hunt/round"

  const MODES: { id: Mode; label: string; hint: string; prompt: string }[] = [
    {
      id: "tint",
      label: "明清色",
      hint: "純色＋白",
      prompt: "明清色のカードをすべて選ぼう"
    },
    {
      id: "shade",
      label: "暗清色",
      hint: "純色＋黒",
      prompt: "暗清色のカードをすべて選ぼう"
    },
    {
      id: "mid",
      label: "中間色",
      hint: "純色＋灰",
      prompt: "中間色のカードをすべて選ぼう"
    }
  ]

  // 既定モードは「明清色を探す」。永続化しないためアクセスのたびに都度リセットされる。
  let mode = $state<Mode>("tint")
  let round = $state<Round>(generateRound("tint"))
  let flipped = $state<boolean[]>(new Array(CANDIDATE_COUNT).fill(false))

  const activeMode = $derived(MODES.find((m) => m.id === mode) ?? MODES[0])

  const foundCount = $derived(
    round.candidates.reduce((n, c, i) => n + (flipped[i] && c.isCorrect ? 1 : 0), 0)
  )
  const remaining = $derived(round.correctCount - foundCount)
  const cleared = $derived(remaining === 0)

  const startRound = (next: Mode = mode) => {
    round = generateRound(next)
    flipped = round.candidates.map(() => false)
  }

  const selectMode = (next: Mode) => {
    if (next === mode) return
    // モード切替でそのモードの新しいラウンドを配り直す（基準色を持たないので候補ごと作り直す）。
    mode = next
    startRound(next)
  }

  const onselect = (index: number) => {
    const candidate = round.candidates[index]
    if (flipped[index]) {
      // 見つけた正解は確定。不正解は表に戻して選び直せる。
      if (candidate.isCorrect) return
      flipped[index] = false
    } else {
      flipped[index] = true
    }
  }
</script>

<svelte:head>
  <title>PCCSの清色・濁色を見分ける - Color Prism</title>
</svelte:head>

<main>
  <Heading1 icon="mdi:invert-colors" grayscale compact>PCCSの清色・濁色を見分ける</Heading1>

  <p class="lead">
    色そのものを見て、白が混ざった<Mark>明清色</Mark>・黒が混ざった<Mark>
      暗清色
    </Mark>・灰が混ざった<Mark>
      中間色（濁色）
    </Mark>のどれに属すかを見分けるゲームです。鮮やかさを明るさと思い込まず、トーンの位置で判断しましょう。
  </p>

  <section class="controls">
    <div class="modes" role="group" aria-label="探すトーン群">
      {#each MODES as m (m.id)}
        <button
          type="button"
          class="mode-btn"
          class:active={mode === m.id}
          aria-pressed={mode === m.id}
          onclick={() => selectMode(m.id)}
        >
          <span class="mode-label">{m.label}</span>
          <span class="mode-hint">{m.hint}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="board-section">
    <div class="prompt">
      <div class="prompt-body">
        <p class="prompt-title">{activeMode.prompt}</p>
        <p class="progress" aria-live="polite">
          残り <strong>{remaining}</strong>
          枚
        </p>
      </div>
    </div>

    <div class="board">
      <div class="grid" class:dimmed={cleared}>
        {#each round.candidates as candidate, i (candidate.color.notation)}
          <ToneHuntCard {candidate} {mode} flipped={flipped[i]} index={i} {onselect} />
        {/each}
      </div>

      {#if cleared}
        <ClearOverlay oncontinue={() => startRound()}>
          {activeMode.label}のカードをすべて見つけました。
          <ClearSwatches
            colors={round.candidates.filter((c) => c.isCorrect).map((c) => c.color.hex)}
          />
        </ClearOverlay>
      {/if}
    </div>
  </section>
</main>

<style>
  main {
    --color-surface: light-dark(#ffffff, #16161f);
    --color-border: light-dark(#e0e0e0, #2e2e3e);
    --color-muted: light-dark(#f0f0f3, #22222e);

    max-width: 720px;
    margin: 0 auto;
  }

  .lead {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--color-body);
    margin: 0 0 1.75rem;
  }

  /* ===== モード切替 ===== */
  .controls {
    margin-bottom: 1.5rem;
  }

  .modes {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.3rem;
    border-radius: 14px;
    background: light-dark(#f0f0f3, #33333f);
    border: 1px solid var(--color-border);
  }

  .mode-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--color-body);
    cursor: pointer;
    font: inherit;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .mode-btn:hover {
    color: var(--color-heading);
  }

  .mode-btn.active {
    background: light-dark(#ffffff, #52526a);
    color: var(--color-heading);
    box-shadow: 0 1px 6px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.5));
  }

  .mode-btn:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 2px;
  }

  .mode-label {
    font-size: 0.95rem;
    font-weight: 800;
  }

  .mode-hint {
    font-size: 0.68rem;
    color: var(--color-body);
  }

  /* ===== 指示・進捗 ===== */
  .prompt {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1rem 1.25rem;
    border-radius: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    margin-bottom: 1.5rem;
  }

  .prompt-body {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .prompt-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: var(--color-heading);
  }

  .progress {
    margin: 0.2rem 0 0;
    font-size: 0.9rem;
    color: var(--color-body);
  }

  .progress strong {
    font-size: 1.4rem;
    font-weight: 900;
    color: var(--color-anki);
  }

  /* ===== 候補ボード ===== */
  .board {
    position: relative;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    transition: filter 0.3s;
  }

  .grid.dimmed {
    filter: blur(2px) saturate(0.7);
    pointer-events: none;
  }

  @media (max-width: 540px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
