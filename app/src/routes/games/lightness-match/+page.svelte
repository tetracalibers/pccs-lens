<script lang="ts">
  import Icon from "@iconify/svelte"
  import Heading1 from "$lib/components/Heading1.svelte"
  import Mark from "$lib/components/m-directive/Mark.svelte"
  import LightnessCard from "$lib/components/lightness-match/LightnessCard.svelte"
  import { portal } from "$lib/actions/portal"
  import {
    generateRound,
    generateRoundForBase,
    CANDIDATE_COUNT,
    type Mode,
    type Round
  } from "$lib/games/lightness-match/round"

  const MODES: { id: Mode; label: string; hint: string }[] = [
    { id: "hue", label: "色相が近い色", hint: "似た色相の中から明度で見分ける" },
    { id: "chroma", label: "彩度が近い色", hint: "似た彩度の中から明度で見分ける" }
  ]

  let mode = $state<Mode>("hue")
  let round = $state<Round>(generateRound("hue"))
  let flipped = $state<boolean[]>(new Array(CANDIDATE_COUNT).fill(false))

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
    // 基準色は変えず、候補だけを新モードで組み直す。
    const base = round.base
    mode = next
    round = generateRoundForBase(next, base)
    flipped = round.candidates.map(() => false)
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
  <title>明度を見分ける - Color Prism</title>
</svelte:head>

<main>
  <Heading1 icon="mdi:contrast-circle" grayscale compact>明度を見分ける</Heading1>

  <p class="lead">
    基準色と
    <Mark>明度が同じ</Mark>
    カードを探すゲームです。同じ明度でも鮮やかな色ほど明るく見えます。色相や彩度の印象に惑わされず、明度だけを見抜きましょう。
  </p>

  <section class="controls">
    <div class="difficulty" role="group" aria-label="出題モード">
      {#each MODES as m (m.id)}
        <button
          type="button"
          class="difficulty-btn"
          class:active={mode === m.id}
          aria-pressed={mode === m.id}
          onclick={() => selectMode(m.id)}
        >
          <span class="difficulty-label">{m.label}</span>
          <span class="difficulty-hint">{m.hint}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="board-section">
    <div class="prompt">
      <div class="base-card" style="background: {round.base._hex}"></div>
      <div class="prompt-body">
        <p class="prompt-title">同じ明度の色を探そう</p>
        <p class="base-meta">
          <span class="base-name">{round.base.name}</span>
          <span class="base-munsell">{round.base.munsell}</span>
        </p>
        <p class="progress" aria-live="polite">
          残り <strong>{remaining}</strong>
          枚
        </p>
      </div>
    </div>

    <div class="board">
      <div class="grid" class:dimmed={cleared}>
        {#each round.candidates as candidate, i (candidate.color.id)}
          <LightnessCard
            {candidate}
            baseValue={round.baseValue}
            baseColor={round.base._hex}
            baseName={round.base.name}
            baseNameSegments={round.base.nameSegments}
            flipped={flipped[i]}
            index={i}
            {onselect}
          />
        {/each}
      </div>

      {#if cleared}
        <div class="clear-overlay" role="status" aria-live="assertive" use:portal>
          <div class="clear-card">
            <Icon icon="mdi:party-popper" />
            <p class="clear-title">クリア！</p>
            <p class="clear-desc">同じ明度の色を{round.correctCount}枚すべて見つけました。</p>
            <button type="button" class="continue-btn" onclick={() => startRound()}>
              もっと続ける
            </button>
          </div>
        </div>
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

  /* ===== 難易度切替 ===== */
  .controls {
    margin-bottom: 1.5rem;
  }

  .difficulty {
    display: inline-flex;
    gap: 0.4rem;
    padding: 0.3rem;
    border-radius: 14px;
    /* 明度軸のガイド線と共有する --color-muted とは切り離し、トラックだけ独立の地色にする */
    background: light-dark(#f0f0f3, #33333f);
    border: 1px solid var(--color-border);
  }

  .difficulty-btn {
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

  .difficulty-btn:hover {
    color: var(--color-heading);
  }

  .difficulty-btn.active {
    background: light-dark(#ffffff, #52526a);
    color: var(--color-heading);
    box-shadow: 0 1px 6px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.5));
  }

  .difficulty-btn:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 2px;
  }

  .difficulty-label {
    font-size: 0.95rem;
    font-weight: 800;
  }

  .difficulty-hint {
    font-size: 0.68rem;
    color: var(--color-body);
  }

  /* ===== 基準色 ===== */
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

  .base-card {
    flex-shrink: 0;
    width: 84px;
    height: 100px;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
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

  .base-meta {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin: 0;
  }

  .base-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-heading);
  }

  .base-munsell {
    font-size: 0.78rem;
    font-family: var(--font-mono, monospace);
    color: var(--color-body);
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

  /* ===== クリア演出 ===== */
  .clear-overlay {
    /* body 直下へ portal しているので fixed はビューポート基準。スクロール位置に
       関わらず画面中央に表示する。overlay 自体はクリックを透過し、カードのみ操作可能。 */
    /* portal で main の外へ出るため、カードが参照する局所トークンをここで補う */
    --color-surface: light-dark(#ffffff, #16161f);
    --color-border: light-dark(#e0e0e0, #2e2e3e);
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
  }

  .clear-card {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1.5rem 2rem;
    border-radius: 18px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: 0 12px 40px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.55));
    text-align: center;
    animation: pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1);
  }

  .clear-card :global(svg) {
    font-size: 2.5rem;
    color: light-dark(#f59f00, #ffd43b);
  }

  .clear-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--color-heading);
  }

  .clear-desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-body);
  }

  .continue-btn {
    margin-top: 0.6rem;
    padding: 0.6rem 1.6rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #7c3aed, #4d96ff);
    color: #fff;
    font-size: 0.95rem;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .continue-btn:hover {
    transform: translateY(-1px);
  }

  .continue-btn:focus-visible {
    outline: 3px solid light-dark(#7c3aed, #c4b5fd);
    outline-offset: 3px;
  }

  @keyframes pop {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .clear-card {
      animation: none;
    }
  }
</style>
