<script lang="ts">
  import { browser } from "$app/environment"
  import { onMount, tick } from "svelte"
  import { generateBauhaus } from "$lib/patterns/generators/bauhaus.js"
  import { generateGeometric } from "$lib/patterns/generators/geometric.js"
  import { updateSvgColors } from "$lib/patterns/generators/utils.js"

  interface Props {
    colors: [string, string, string]
    themeId: string
    themeName: string
    accentActive: boolean
  }

  let { colors, themeId, themeName, accentActive }: Props = $props()

  // ===== 端末判定 =====
  let useShareApi = $state(false)

  onMount(() => {
    const isTouchPrimary = window.matchMedia("(pointer: coarse) and (hover: none)").matches
    const dummyFile = new File([""], "test.png", { type: "image/png" })
    const canShareFiles =
      typeof navigator.canShare === "function" && navigator.canShare({ files: [dummyFile] })
    useShareApi = isTouchPrimary && canShareFiles
  })

  // ===== 描画用（$state） =====
  let bauhausSvg = $state("")
  let bauhausLoading = $state(false)
  let geometricSvg = $state("")
  let geometricLoading = $state(false)

  // ===== 内部追跡用（plain変数 — $effectの依存に含めない） =====
  // $state にすると $effect 内での読み書きが再トリガーを起こすため plain 変数で管理する
  let _bauhausSvg = ""
  let _bauhausColors: [string, string, string] | null = null
  let _geometricSvg = ""
  let _geometricColors: [string, string, string] | null = null
  let _accentActive: boolean | null = null

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
  // 依存: colors（変更検知）, accentActive（追加・削除検知）,
  //       bauhausLoading / geometricLoading（再生成完了後の色適用）
  $effect(() => {
    if (!browser) return
    const c = colors
    const accent = accentActive

    // アクセントの追加・削除は配色構造が変わるため再生成する
    const accentChanged = _accentActive !== null && _accentActive !== accent

    if (_bauhausColors === null || accentChanged) {
      setBauhaus(generateBauhaus(c), c)
    } else if (!bauhausLoading) {
      setBauhaus(updateSvgColors(_bauhausSvg, _bauhausColors, c), c)
    }

    if (_geometricColors === null || accentChanged) {
      setGeometric(generateGeometric(c), c)
    } else if (!geometricLoading) {
      setGeometric(updateSvgColors(_geometricSvg, _geometricColors, c), c)
    }

    _accentActive = accent
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

  // ===== 表示用 data URI =====
  const bauhausSrc = $derived(
    bauhausSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bauhausSvg)}` : ""
  )
  const geometricSrc = $derived(
    geometricSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(geometricSvg)}` : ""
  )

  // ===== PNG Blob 生成 =====
  async function generatePngBlob(svgString: string): Promise<Blob> {
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.src = url
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
    })

    const canvas = document.createElement("canvas")
    canvas.width = 300
    canvas.height = 300
    canvas.getContext("2d")!.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error("toBlob failed"))
      }, "image/png")
    })
  }

  // ===== PNG 保存 =====
  async function downloadPng(svgString: string, filename: string) {
    const pngBlob = await generatePngBlob(svgString)
    const a = document.createElement("a")
    a.href = URL.createObjectURL(pngBlob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ===== PNG 共有 =====
  async function sharePng(svgString: string, filename: string, title: string) {
    try {
      const pngBlob = await generatePngBlob(svgString)
      const file = new File([pngBlob], filename, { type: "image/png" })
      if (!navigator.canShare({ files: [file] })) return
      await navigator.share({ files: [file], title })
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      console.error(e)
    }
  }
</script>

<section class="geo-patterns">
  <h2>幾何パターン</h2>
  <p class="touch-hint">※画像を長押しすると保存できます。</p>
  <div class="patterns-grid">
    <!-- バウハウス風 -->
    <div class="pattern-card">
      <h3 class="pattern-label">バウハウス風</h3>
      <div class="pattern-preview">
        {#if bauhausLoading}
          <div class="loading-overlay" aria-label="生成中">
            <span class="spinner" aria-hidden="true"></span>
          </div>
        {/if}
        <div class="svg-wrapper">
          {#if bauhausSrc}
            <img src={bauhausSrc} alt="バウハウス風パターン" />
          {/if}
        </div>
      </div>
      <div class="pattern-actions">
        <button class="btn-regen" disabled={bauhausLoading} onclick={regenerateBauhaus}>
          画像を再生成
        </button>
        <button
          class="btn-download"
          disabled={!bauhausSvg || bauhausLoading}
          onclick={() =>
            useShareApi
              ? sharePng(bauhausSvg, `${themeId}-bauhaus.png`, `${themeName}なバウハウス風パターン`)
              : downloadPng(bauhausSvg, `${themeId}-bauhaus.png`)}
        >
          {useShareApi ? "画像を共有" : "画像を保存"}
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
          {#if geometricSrc}
            <img src={geometricSrc} alt="ジオメトリックパターン" />
          {/if}
        </div>
      </div>
      <div class="pattern-actions">
        <button class="btn-regen" disabled={geometricLoading} onclick={regenerateGeometric}>
          画像を再生成
        </button>
        <button
          class="btn-download"
          disabled={!geometricSvg || geometricLoading}
          onclick={() =>
            useShareApi
              ? sharePng(
                  geometricSvg,
                  `${themeId}-geometric.png`,
                  `${themeName}なジオメトリックパターン`
                )
              : downloadPng(geometricSvg, `${themeId}-geometric.png`)}
        >
          {useShareApi ? "画像を共有" : "画像を保存"}
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  .geo-patterns {
    margin-bottom: 2rem;
  }

  .touch-hint {
    display: none;
    font-size: 0.78rem;
    color: var(--color-text-secondary, #888);
    margin: 0 0 1.5rem;
  }

  @media (any-pointer: coarse) {
    .touch-hint {
      display: block;
    }
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

  .svg-wrapper img {
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
    to {
      transform: rotate(360deg);
    }
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
