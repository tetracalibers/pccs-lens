<script lang="ts">
  import ColorPicker from "$lib/components/ColorPicker.svelte"
  import CopyButton from "$lib/components/CopyButton.svelte"
  import { findClosestPccs, findClosestJis } from "$lib/color/approximate"
  import pccsColors from "$lib/data/pccs_colors.json"
  import jisColors from "$lib/data/jis_colors.json"
  import type {
    PCCSColor,
    JISColor,
    ApproximateResult,
    JISApproximateResult
  } from "$lib/data/types"
  import { page } from "$app/state"
  import { replaceState } from "$app/navigation"
  import { tick } from "svelte"
  import { isValidHexColor } from "$lib/color/validate"

  const colors = pccsColors as PCCSColor[]
  const jisColorList = jisColors as JISColor[]
  const TOP_N = 6
  const JIS_TOP_N = 6

  const urlColor = page.url.searchParams.get("color")
  const urlColorWithHash = urlColor ? `#${urlColor}` : null
  let inputColor = $state(
    isValidHexColor(urlColorWithHash) ? urlColorWithHash.toUpperCase() : "#EE0026"
  )

  $effect(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(inputColor)) {
      const url = new URL(window.location.href)
      url.searchParams.set("color", inputColor.slice(1).toUpperCase())
      // 次のエラーを解消するため、tick() を使用：
      // Cannot call replaceState(...) before router is initialized
      tick().then(() => replaceState(url, history.state))
    }
  })
  let results: ApproximateResult[] = $derived(findClosestPccs(inputColor, colors, TOP_N))
  let jisResults: JISApproximateResult[] = $derived(
    findClosestJis(inputColor, jisColorList, JIS_TOP_N)
  )
</script>

<svelte:head>
  <title>色のPCCS近似 - PCCS Lens</title>
</svelte:head>

<main>
  <h1>色のPCCS近似</h1>

  <section class="input-section">
    <h2>色を入力</h2>
    <ColorPicker bind:value={inputColor} />
  </section>

  <section class="results-section">
    <h2>PCCS近似結果（上位{TOP_N}件）</h2>
    {#if results.length > 0}
      <ul class="result-list">
        {#each results as result (result.color.notation)}
          <li class="result-card">
            <span
              class="swatch"
              style="background-color: {result.color.hex}"
              aria-label={result.color.hex}
            ></span>
            <span class="notation">{result.color.notation}</span>
            <span class="hex-code">{result.color.hex}</span>
            <CopyButton text={result.color.hex} />
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="results-section">
    <h2>似ている慣用色（上位{JIS_TOP_N}件）</h2>
    {#if jisResults.length > 0}
      <ul class="result-list">
        {#each jisResults as result (result.color.name)}
          <li class="result-card">
            <span
              class="swatch"
              style="background-color: {result.color.hex}"
              aria-label={result.color.hex}
            ></span>
            <span class="jis-name">{result.color.name}</span>
            <span class="jis-reading">{result.color.reading}</span>
            {#if result.color.examLevel !== null}
              <span class="exam-level">{result.color.examLevel}級</span>
            {/if}
            <span class="hex-code">{result.color.hex}</span>
            <CopyButton text={result.color.hex} />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
  }

  section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.75rem;
    color: var(--color-text-secondary, #555);
  }

  .result-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .result-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    background: var(--color-surface, #fff);
  }

  .swatch {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    border-radius: 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .notation {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 600;
    min-width: 5rem;
  }

  .hex-code {
    font-family: monospace;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #777);
    margin-left: auto;
  }

  .jis-name {
    font-size: 1rem;
    font-weight: 600;
  }

  .jis-reading {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #777);
  }

  .exam-level {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    background: var(--color-border, #ddd);
    color: var(--color-text-secondary, #555);
  }

  .exam-level + .hex-code {
    margin-left: 0;
  }
</style>
