<script lang="ts">
  import { browser } from '$app/environment'
  import { tick } from 'svelte'
  import { generateBauhaus } from '$lib/patterns/generators/bauhaus.js'
  import { generateGeometric } from '$lib/patterns/generators/geometric.js'
  import { updateSvgColors } from '$lib/patterns/generators/utils.js'

  interface Props {
    colors: [string, string, string]
    themeId: string
  }

  let { colors, themeId }: Props = $props()

  // ===== 描画用（$state） =====
  let bauhausSvg = $state('')
  let bauhausLoading = $state(false)
  let geometricSvg = $state('')
  let geometricLoading = $state(false)

  // ===== 内部追跡用（plain変数 — $effectの依存に含めない） =====
  // $state にすると $effect 内での読み書きが再トリガーを起こすため plain 変数で管理する
  let _bauhausSvg = ''
  let _bauhausColors: [string, string, string] | null = null
  let _geometricSvg = ''
  let _geometricColors: [string, string, string] | null = null

  function setBauhaus(svg: string, c: [string, string, string]) {
    bauhausSvg = svg
    _bauhausSvg = svg
    _bauhausColors = c
  }

  function setGeometric(svg: string, c: [string, string, string]) {
    geometricSvg = svg
    _geometricSvg = svg
    _geometricColors = c
  }

  // ===== 色変更の検知と更新 =====
  // 依存: colors（変更検知）, bauhausLoading / geometricLoading（再生成完了後の色適用）
  $effect(() => {
    if (!browser) return
    const c = colors

    if (_bauhausColors === null) {
      setBauhaus(generateBauhaus(c), c)
    } else if (!bauhausLoading) {
      setBauhaus(updateSvgColors(_bauhausSvg, _bauhausColors, c), c)
    }

    if (_geometricColors === null) {
      setGeometric(generateGeometric(c), c)
    } else if (!geometricLoading) {
      setGeometric(updateSvgColors(_geometricSvg, _geometricColors, c), c)
    }
  })

  // ===== 再生成 =====
  async function regenerateBauhaus() {
    bauhausLoading = true
    await tick()
    setBauhaus(generateBauhaus(colors), colors)
    bauhausLoading = false
  }

  async function regenerateGeometric() {
    geometricLoading = true
    await tick()
    setGeometric(generateGeometric(colors), colors)
    geometricLoading = false
  }

  // ===== PNG 保存 =====
  async function downloadPng(svgString: string, filename: string) {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.src = url
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
    })

    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(pngBlob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
</script>

<section class="geo-patterns">
  <h2>幾何パターン</h2>
  <div class="patterns-grid">

    <!-- バウハウス -->
    <div class="pattern-card">
      <h3 class="pattern-label">バウハウス</h3>
      <div class="pattern-preview">
        {#if bauhausLoading}
          <div class="loading-overlay" aria-label="生成中">
            <span class="spinner" aria-hidden="true"></span>
          </div>
        {/if}
        <div class="svg-wrapper">
          {@html bauhausSvg}
        </div>
      </div>
      <div class="pattern-actions">
        <button
          class="btn-regen"
          disabled={bauhausLoading}
          onclick={regenerateBauhaus}
        >
          画像を再生成
        </button>
        <button
          class="btn-download"
          disabled={!bauhausSvg}
          onclick={() => downloadPng(bauhausSvg, `${themeId}-bauhaus.png`)}
        >
          PNG保存
        </button>
      </div>
    </div>

    <!-- ジオメトリック -->
    <div class="pattern-card">
      <h3 class="pattern-label">ジオメトリック</h3>
      <div class="pattern-preview">
        {#if geometricLoading}
          <div class="loading-overlay" aria-label="生成中">
            <span class="spinner" aria-hidden="true"></span>
          </div>
        {/if}
        <div class="svg-wrapper">
          {@html geometricSvg}
        </div>
      </div>
      <div class="pattern-actions">
        <button
          class="btn-regen"
          disabled={geometricLoading}
          onclick={regenerateGeometric}
        >
          画像を再生成
        </button>
        <button
          class="btn-download"
          disabled={!geometricSvg}
          onclick={() => downloadPng(geometricSvg, `${themeId}-geometric.png`)}
        >
          PNG保存
        </button>
      </div>
    </div>

  </div>
</section>

<style>
  .geo-patterns {
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

  .patterns-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  @media (max-width: 480px) {
    .patterns-grid {
      grid-template-columns: 1fr;
    }
  }

  .pattern-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .pattern-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-secondary, #888);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .pattern-preview {
    position: relative;
    aspect-ratio: 1;
    background: var(--color-surface, #f5f5f5);
    border-radius: 6px;
    overflow: hidden;
  }

  .svg-wrapper {
    width: 100%;
    height: 100%;
  }

  .svg-wrapper :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-surface, #f5f5f5) 80%, transparent);
    z-index: 1;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--color-border, #ddd);
    border-top-color: var(--color-text-secondary, #888);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .pattern-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-regen,
  .btn-download {
    flex: 1;
    padding: 0.45rem 0.5rem;
    font-size: 0.78rem;
    border-radius: 5px;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-regen:disabled,
  .btn-download:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-regen {
    background: none;
    border: 1.5px solid var(--color-border, #ccc);
    color: var(--color-text, #333);
  }

  .btn-regen:not(:disabled):hover {
    border-color: var(--color-text, #333);
  }

  .btn-download {
    background: var(--color-text, #111);
    border: 1.5px solid var(--color-text, #111);
    color: #fff;
  }

  .btn-download:not(:disabled):hover {
    opacity: 0.8;
  }
</style>
