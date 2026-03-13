<script lang="ts">
  import { resolve } from "$app/paths"
  import type { PCCSColor } from "$lib/data/types"
  import type { SelectedColor } from "$lib/patterns/types"
  import { computeSuggest } from "$lib/patterns/suggest"
  import { lookupPCCSColor, pickRandomSuggest } from "$lib/patterns/lookup"
  import ThemeColorPicker from "$lib/components/patterns/ThemeColorPicker.svelte"
  import ThemeColorSchemePreview from "$lib/components/patterns/ThemeColorSchemePreview.svelte"
  import GeoPatternSection from "$lib/components/patterns/GeoPatternSection.svelte"

  let { data } = $props()
  const theme = $derived(data.theme)

  // 未発見の組み合わせ用フォールバック
  const FALLBACK: PCCSColor = {
    notation: "—",
    hex: "#cccccc",
    toneSymbol: null,
    hueNumber: null,
    isNeutral: true,
    achromaticBucket: null
  }

  // ===== 初期値の設定（サジェスト内からランダム、data.theme で直接初期化） =====
  const _t = data.theme
  const initBaseSuggest = computeSuggest({ theme: _t.id, role: "base" })
  const initBase = pickRandomSuggest(initBaseSuggest) ?? {
    hueNumber: _t.allowedHues[0] ?? null,
    toneSymbol: _t.allowedTones[0] ?? "p"
  }

  const initAssortSuggest = computeSuggest({
    theme: _t.id,
    role: "assort",
    baseColor: initBase
  })
  const initAssort = pickRandomSuggest(initAssortSuggest) ?? {
    hueNumber: _t.allowedHues[0] ?? null,
    toneSymbol: _t.allowedTones[1] ?? _t.allowedTones[0] ?? "p"
  }

  // ===== リアクティブ状態 =====
  let baseColor = $state<SelectedColor>(initBase)
  let assortColor = $state<SelectedColor>(initAssort)
  let accentColor = $state<SelectedColor | null>(null)
  let showAccent = $state(false)

  // ===== サジェスト（リアクティブ） =====
  const baseSuggest = $derived(
    computeSuggest({ theme: theme.id, role: "base", baseColor, assortColor })
  )
  const assortSuggest = $derived(
    computeSuggest({ theme: theme.id, role: "assort", baseColor, assortColor })
  )
  const accentSuggest = $derived(
    computeSuggest({ theme: theme.id, role: "accent", baseColor, assortColor })
  )

  // ===== PCCSColor ルックアップ（リアクティブ） =====
  const basePCCS = $derived(lookupPCCSColor(baseColor.hueNumber, baseColor.toneSymbol) ?? FALLBACK)
  const assortPCCS = $derived(
    lookupPCCSColor(assortColor.hueNumber, assortColor.toneSymbol) ?? FALLBACK
  )
  const accentPCCS = $derived(
    accentColor
      ? (lookupPCCSColor(accentColor.hueNumber, accentColor.toneSymbol) ?? FALLBACK)
      : null
  )

  // ===== ジェネレーター用カラー引数 =====
  const geoColors = $derived<[string, string, string]>(
    showAccent && accentPCCS
      ? [basePCCS.hex, assortPCCS.hex, accentPCCS.hex]
      : [basePCCS.hex, assortPCCS.hex, assortPCCS.hex]
  )

  function addAccent() {
    const accentSug = computeSuggest({
      theme: theme.id,
      role: "accent",
      baseColor,
      assortColor
    })
    accentColor = pickRandomSuggest(accentSug) ?? {
      hueNumber: theme.allowedHues[0] ?? null,
      toneSymbol: theme.allowedTones[0] ?? "p"
    }
    showAccent = true
  }

  function removeAccent() {
    showAccent = false
    accentColor = null
  }
</script>

<svelte:head>
  <title>{theme.labelJa} — 配色シミュレータ — PCCS Lens</title>
</svelte:head>

<main>
  <nav class="breadcrumb">
    <a href={resolve("/patterns")}>配色シミュレータ</a>
    <span>›</span>
    <span>{theme.labelJa}</span>
  </nav>

  <header class="theme-header">
    <div class="theme-title">
      <h1>{theme.labelJa}</h1>
      <span class="theme-en">{theme.labelEn}</span>
    </div>
    <p class="theme-image">{theme.imageDescription}</p>
  </header>

  <section class="description">
    <h2>配色の特徴</h2>
    <p>{theme.coloringDescription}</p>
  </section>

  <section class="color-pickers">
    <h2>色を選ぶ</h2>

    <div class="pickers-list">
      <ThemeColorPicker
        label="ベースカラー"
        description={theme.roleDescriptions.base}
        selectedColor={baseColor}
        suggest={baseSuggest}
        allowedHues={theme.allowedHues}
        allowedTones={theme.allowedTones}
        onchange={(c) => (baseColor = c)}
      />

      <hr class="divider" />

      <ThemeColorPicker
        label="アソートカラー"
        description={theme.roleDescriptions.assort}
        selectedColor={assortColor}
        suggest={assortSuggest}
        allowedHues={theme.allowedHues}
        allowedTones={theme.allowedTones}
        onchange={(c) => (assortColor = c)}
      />

      {#if showAccent && accentColor}
        <hr class="divider" />

        <div class="accent-section">
          <ThemeColorPicker
            label="アクセントカラー"
            description={theme.roleDescriptions.accent}
            selectedColor={accentColor}
            suggest={accentSuggest}
            allowedHues={theme.allowedHues}
            allowedTones={theme.allowedTones}
            onchange={(c) => (accentColor = c)}
          />
          <button class="remove-accent" onclick={removeAccent}>アクセントカラーを削除する</button>
        </div>
      {:else}
        <div class="add-accent-row">
          <button class="add-accent" onclick={addAccent}>＋ アクセントカラーを追加する</button>
        </div>
      {/if}
    </div>
  </section>

  <section class="preview-section">
    <h2>配色プレビュー</h2>
    <ThemeColorSchemePreview
      base={basePCCS}
      assort={assortPCCS}
      accent={showAccent ? accentPCCS : null}
      isDynamic={theme.isDynamic}
    />
    <p class="preview-hint">
      ★ マークはサジェスト（推奨）の色相・トーンです。範囲外の色も自由に選べます。
    </p>
  </section>

  <GeoPatternSection
    colors={geoColors}
    themeId={theme.id}
    accentActive={showAccent && !!accentPCCS}
  />
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #777);
    margin-bottom: 1.5rem;
  }

  .breadcrumb a {
    color: var(--color-text-secondary, #777);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    color: var(--color-text, #111);
    text-decoration: underline;
  }

  .theme-header {
    margin-bottom: 1.5rem;
    display: grid;
    gap: 0.6rem;
  }

  .theme-title {
    display: flex;
    align-items: baseline;
    column-gap: 1rem;
    row-gap: 2px;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }

  .theme-en {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--color-text-secondary, #888);
    text-indent: 0.2rem;
  }

  .theme-image {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #666);
    margin: 0;
  }

  section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-secondary, #888);
    margin: 0 0 0.75rem;
    border-bottom: 1px solid var(--color-border, #eee);
    padding-bottom: 0.4rem;
  }

  .description p {
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 0;
  }

  .pickers-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .divider {
    border: none;
    border-top: 1px solid var(--color-border, #eee);
    margin: 1.5rem 0;
  }

  .accent-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .add-accent-row {
    margin-top: 1.75rem;
  }

  .add-accent {
    background: none;
    border: 1.5px dashed var(--color-border, #ccc);
    border-radius: 6px;
    padding: 0.55rem 1rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary, #666);
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;
  }

  .add-accent:hover {
    border-color: var(--color-text, #333);
    color: var(--color-text, #333);
  }

  .remove-accent {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #999);
    cursor: pointer;
    text-decoration: underline;
    align-self: flex-start;
  }

  .remove-accent:hover {
    color: var(--color-text, #333);
  }

  .preview-hint {
    font-size: 0.78rem;
    color: var(--color-text-secondary, #999);
    margin: 0.5rem 0 0;
  }
</style>
