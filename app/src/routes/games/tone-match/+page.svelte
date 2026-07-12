<script lang="ts">
  import { SvelteSet } from "svelte/reactivity"
  import Heading1 from "$lib/components/Heading1.svelte"
  import Mark from "$lib/components/m-directive/Mark.svelte"
  import ToneMatchCard from "$lib/components/tone-match/ToneMatchCard.svelte"
  import ToneMapSelector from "$lib/components/tone-match/ToneMapSelector.svelte"
  import HueWheelSelector from "$lib/components/tone-match/HueWheelSelector.svelte"
  import ClearOverlay from "$lib/components/games/ClearOverlay.svelte"
  import {
    generateRound,
    CANDIDATE_COUNT,
    TARGET_TONES,
    type Round
  } from "$lib/games/tone-match/round"

  // 有彩色 11 トーンからランダムに 1 つ選ぶ。
  const randomTone = (): string => TARGET_TONES[Math.floor(Math.random() * TARGET_TONES.length)]

  // 既定のお題はランダムなトーン。永続化しないためアクセスのたびに都度選び直される。
  const initialTone = randomTone()
  let target = $state<string>(initialTone)
  // 出題を絞り込む色相（null は全色相）。永続化しない。
  let selectedHue = $state<number | null>(null)
  let round = $state<Round>(generateRound(initialTone))
  let flipped = $state<boolean[]>(new Array(CANDIDATE_COUNT).fill(false))

  // クリア済みトーン集合（セッション内・自動出題の対象制御にのみ使用。マップ表示には反映しない）。
  const clearedTones = new SvelteSet<string>()

  const foundCount = $derived(
    round.candidates.reduce((n, c, i) => n + (flipped[i] && c.isCorrect ? 1 : 0), 0)
  )
  const remaining = $derived(round.correctCount - foundCount)
  const cleared = $derived(remaining === 0)

  // クリアしたトーンを記録する（自動出題で選ばないようにするため）。
  $effect(() => {
    if (cleared) clearedTones.add(target)
  })

  const startRound = (next: string, hue: number | null = selectedHue) => {
    target = next
    round = generateRound(next, hue)
    flipped = round.candidates.map(() => false)
  }

  // トーンマップからの手動選択。全トーンが常時選択可能で、いつでも選び直せる。
  const selectTone = (next: string) => {
    if (next === target) return
    startRound(next)
  }

  // 色相環からの絞り込み。同じ色相を再クリックしたら解除して全色相に戻す。
  const selectHue = (hue: number) => {
    selectedHue = selectedHue === hue ? null : hue
    startRound(target, selectedHue)
  }

  // クリア後「もっと続ける」。未クリアトーンからランダムに次のお題を選ぶ。
  const continueNext = () => {
    // 全 11 トーンをクリアしたらリセットして最初から（ランダムなトーン。演出は挟まない）。
    if (clearedTones.size >= TARGET_TONES.length) {
      clearedTones.clear()
      startRound(randomTone())
      return
    }
    const remainingTones = TARGET_TONES.filter((tone) => !clearedTones.has(tone))
    const next = remainingTones[Math.floor(Math.random() * remainingTones.length)]
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
  <title>PCCSのトーンを見分ける - Color Prism</title>
</svelte:head>

<main>
  <Heading1 icon="mdi:palette-swatch" grayscale compact>PCCSのトーンを見分ける</Heading1>

  <p class="lead">
    トーンマップで選んだ<Mark>
      1 つのトーン
    </Mark>に属する色を、候補の中から探すゲームです。清濁のグループではなく、<Mark>
      個々のトーン
    </Mark>を見分けます。紛らわしい隣接トーンに惑わされず、狙いのトーンだけを選びましょう。
  </p>

  <section class="board-section">
    <div class="prompt">
      <div class="prompt-body">
        <p class="prompt-title">
          <code>{target}</code>
          トーンのカードをすべて選ぼう
        </p>
        <p class="progress" aria-live="polite">
          残り <strong>{remaining}</strong>
          枚
        </p>
      </div>
    </div>

    <div class="board">
      <div class="grid" class:dimmed={cleared}>
        {#each round.candidates as candidate, i (candidate.color.notation)}
          <ToneMatchCard {candidate} {target} flipped={flipped[i]} index={i} {onselect} />
        {/each}
      </div>

      {#if cleared}
        <ClearOverlay oncontinue={continueNext}>
          <code>{target}</code>トーンのカードをすべて見つけました。
        </ClearOverlay>
      {/if}
    </div>
  </section>

  <section class="controls">
    <div class="picker">
      <p class="controls-label">探すトーンを選ぶ</p>
      <ToneMapSelector selected={target} onselect={selectTone} />
    </div>
    <div class="picker">
      <p class="controls-label">色相を絞り込む</p>
      <HueWheelSelector selected={selectedHue} onselect={selectHue} />
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

  /* ===== トーンマップ・色相環の選択 ===== */
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: center;
    gap: 1.5rem 2rem;
    padding: 1.25rem;
    border-radius: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    margin-top: 1.5rem;
  }

  .picker {
    flex: 1 1 200px;
    max-width: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
  }

  .controls-label {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-heading);
    letter-spacing: 0.04em;
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
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: var(--color-heading);
  }

  .prompt-title code {
    font-family: var(--font-mono);
    font-size: 1.3rem;
    font-weight: 900;
    color: var(--color-anki);
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
