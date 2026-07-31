<script lang="ts" generics="P extends object">
  import { browser } from "$app/environment"
  import { Pane } from "tweakpane"
  import { WEBGL_CONTEXT_LOST_MESSAGE, WEBGL_UNSUPPORTED_MESSAGE } from "./constants"
  import { mountThreeDemo, type CameraOptions, type OrbitOptions, type ThreeDemo } from "./mount"
  import type { ThreeSceneFactory } from "./types"

  interface Props {
    /** ラッパに付ける説明（何が描かれていて、どう操作するか） */
    ariaLabel: string
    /** `scene.ts` が公開する `createXxxScene` */
    createScene: ThreeSceneFactory<P>
    /** Tweakpane と `scene.ts` が共有するパラメータ。$state ではなくプレーンオブジェクトを渡す */
    params: P
    /** canvas の `aspect-ratio`。既定は正方形（変換・投影のデモでは横長にしてよい） */
    aspectRatio?: string
    /** 背景色。既定は `DEMO_BACKGROUND`（ライト／ダーク共通の固定色） */
    background?: string
    camera?: CameraOptions
    /** `false` で OrbitControls を付けない */
    orbit?: OrbitOptions | false
    /** Tweakpane のバインディングを組み立てる。省略するとパネル自体を作らない */
    buildPane?: (pane: Pane, params: P) => void
  }

  let {
    ariaLabel,
    createScene,
    params,
    aspectRatio = "1 / 1",
    background,
    camera,
    orbit,
    buildPane
  }: Props = $props()

  let canvasEl: HTMLCanvasElement | undefined = $state()
  let paneEl: HTMLDivElement | undefined = $state()
  let errorMessage: string | null = $state(null)

  $effect(() => {
    const canvas = canvasEl
    if (!canvas) return

    let demo: ThreeDemo
    try {
      demo = mountThreeDemo({
        canvas,
        createScene,
        params,
        background,
        camera,
        orbit,
        onContextLost: () => {
          errorMessage = WEBGL_CONTEXT_LOST_MESSAGE
        }
      })
    } catch {
      // WebGL のコンテキストが取れない環境。案内だけ出して何も描かない
      errorMessage = WEBGL_UNSUPPORTED_MESSAGE
      return
    }

    let pane: Pane | undefined
    if (buildPane && paneEl) {
      pane = new Pane({ container: paneEl })
      buildPane(pane, params)
      // パラメータが動いたときだけ描き直す（常時ループは回さない）
      pane.on("change", () => demo.invalidate())
    }

    return () => {
      pane?.dispose()
      demo.dispose()
    }
  })
</script>

{#if browser}
  <!-- 枠・アスペクト比はページ側の見た目なので、シーンではなく CSS で持つ。
       描画できなかったときも canvas は DOM に残す（{#if} で外すと bind:this が切れる） -->
  <div
    class="three-demo-frame"
    class:is-failed={errorMessage !== null}
    style:aspect-ratio={aspectRatio}
    role="img"
    aria-label={ariaLabel}
  >
    <canvas bind:this={canvasEl}></canvas>
  </div>

  {#if errorMessage}
    <p class="three-demo-fallback">{errorMessage}</p>
  {/if}

  <!-- Tweakpane は canvas の外（下）に置く。狭い画面で図が隠れず、touch-action の領域も混ざらない -->
  {#if buildPane}
    <div class="three-demo-pane" bind:this={paneEl}></div>
  {/if}
{/if}

<style>
  .three-demo-frame {
    width: 100%;
    border: 1px solid light-dark(var(--color-body--dark), var(--color-body--light));
    /* OrbitControls のドラッグ中にページがスクロールしないようにする */
    touch-action: none;
    cursor: grab;
  }

  .three-demo-frame:active {
    cursor: grabbing;
  }

  .three-demo-frame.is-failed {
    display: none;
  }

  .three-demo-frame canvas {
    display: block;
    width: 100%;
    height: 100%;
    /* ドラッグの起点は canvas なので、枠側の指定に頼らず canvas 自体にも効かせる */
    touch-action: none;
  }

  .three-demo-fallback {
    margin-block: 0.75rem 0;
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--color-body);
  }

  .three-demo-pane {
    margin-block-start: 0.75rem;

    /* Tweakpane の配色をサイトのライト／ダークに追従させる。
       文字色はグローバルの色トークンを直接参照し、面の色はそこから color-mix で作る。 */
    --tp-base-background-color: color-mix(in oklab, var(--color-body) 8%, var(--color-bg));
    --tp-base-shadow-color: light-dark(rgb(0 0 0 / 8%), rgb(0 0 0 / 40%));
    --tp-base-border-radius: 4px;

    --tp-label-foreground-color: color-mix(in oklab, var(--color-body) 80%, transparent);
    --tp-container-foreground-color: var(--color-body);
    --tp-input-foreground-color: var(--color-body);
    --tp-monitor-foreground-color: var(--color-body);

    --tp-container-background-color: color-mix(in oklab, var(--color-body) 12%, var(--color-bg));
    --tp-container-background-color-hover: color-mix(
      in oklab,
      var(--color-body) 18%,
      var(--color-bg)
    );
    --tp-container-background-color-focus: color-mix(
      in oklab,
      var(--color-body) 22%,
      var(--color-bg)
    );
    --tp-container-background-color-active: color-mix(
      in oklab,
      var(--color-body) 26%,
      var(--color-bg)
    );

    --tp-input-background-color: color-mix(in oklab, var(--color-body) 12%, var(--color-bg));
    --tp-input-background-color-hover: color-mix(in oklab, var(--color-body) 18%, var(--color-bg));
    --tp-input-background-color-focus: color-mix(in oklab, var(--color-body) 22%, var(--color-bg));
    --tp-input-background-color-active: color-mix(in oklab, var(--color-body) 26%, var(--color-bg));

    --tp-monitor-background-color: color-mix(in oklab, var(--color-body) 10%, var(--color-bg));
    --tp-groove-foreground-color: color-mix(in oklab, var(--color-body) 20%, var(--color-bg));

    /* つまみ・ボタンは前景色をそのまま使い、面との明暗差を確保する */
    --tp-button-background-color: color-mix(in oklab, var(--color-body) 55%, var(--color-bg));
    --tp-button-background-color-hover: color-mix(in oklab, var(--color-body) 65%, var(--color-bg));
    --tp-button-background-color-focus: color-mix(in oklab, var(--color-body) 70%, var(--color-bg));
    --tp-button-background-color-active: color-mix(
      in oklab,
      var(--color-body) 80%,
      var(--color-bg)
    );
    --tp-button-foreground-color: var(--color-bg);
  }
</style>
