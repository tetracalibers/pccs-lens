<script lang="ts" generics="P extends object">
  import { browser } from "$app/environment"
  import { Pane } from "tweakpane"
  import {
    DEMO_BACKGROUND,
    WEBGL_CONTEXT_LOST_MESSAGE,
    WEBGL_UNSUPPORTED_MESSAGE
  } from "./constants"
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
  <!-- Tweakpane は canvas の外（上）に置く。図より先に目に入るので操作できることに気づきやすく、
       canvas に重ねないので狭い画面で図が隠れず、touch-action の領域も混ざらない -->
  {#if buildPane}
    <!-- パネルの面色は canvas の背景と同じ色にする（CSS からは定数を参照できないので inline で渡す） -->
    <div
      class="three-demo-pane"
      style:--pane-surface={background ?? DEMO_BACKGROUND}
      bind:this={paneEl}
    ></div>
  {/if}

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
{/if}

<style>
  .three-demo-frame {
    width: 100%;
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
    border-radius: 0 0 4px 4px;
    /* ドラッグの起点は canvas なので、枠側の指定に頼らず canvas 自体にも効かせる */
    touch-action: none;
    user-select: none;
  }

  .three-demo-fallback {
    margin-block: 0.75rem 0;
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--color-body);
  }

  .three-demo-pane {
    /* Tweakpane はルート要素の内側余白を変数で公開していない（--tp-container-*-padding は
       各行の余白）。面色がラッパと同じなので、外周の余白はこちら側で持たせて 1 枚に見せる */
    padding: 0.2rem;
    background: var(--pane-surface);
    /* 下辺は canvas と地続きなので角を立てたまま、上部の 2 つの角だけ丸める */
    border-radius: 4px 4px 0 0;

    /* Tweakpane の面色（--pane-surface）は canvas の背景と同じ色をインラインで受け取る。
       既定は DEMO_BACKGROUND で、これはライト／ダーク共通の固定色。パネルと図が地続きに見え、
       ライトモードではページの地色と明暗が逆になるので操作パネルとして見分けやすい。
       面がモードに追従しない以上、文字（--pane-ink）も固定の明色にする必要がある。
       サイトの配色から外れないよう、ダークモード用のトークンを直接参照する。 */
    --pane-ink: var(--color-heading--dark);

    /* 面はデモの背景と完全に一致させる。段差はこの上に重なるコンテナ・入力欄側だけで付ける */
    --tp-base-background-color: var(--pane-surface);
    /* 影はパネルの外周（ラッパ）に付いていてほしい。Tweakpane 側に残すと、
       余白の内側に影が落ちて同色の面に切れ目が見えてしまうので消す */
    --tp-base-shadow-color: transparent;
    /* 角丸は落とす。パネル外周（base）と各ブレード（blade）で変数が分かれているので両方指定する */
    --tp-base-border-radius: 0;
    --tp-blade-border-radius: 0;

    --tp-label-foreground-color: color-mix(in oklab, var(--pane-ink) 80%, transparent);
    --tp-container-foreground-color: var(--pane-ink);
    --tp-input-foreground-color: var(--pane-ink);
    --tp-monitor-foreground-color: var(--pane-ink);

    --tp-container-background-color: color-mix(in oklab, var(--pane-ink) 12%, var(--pane-surface));
    --tp-container-background-color-hover: color-mix(
      in oklab,
      var(--pane-ink) 18%,
      var(--pane-surface)
    );
    --tp-container-background-color-focus: color-mix(
      in oklab,
      var(--pane-ink) 22%,
      var(--pane-surface)
    );
    --tp-container-background-color-active: color-mix(
      in oklab,
      var(--pane-ink) 26%,
      var(--pane-surface)
    );

    --tp-input-background-color: color-mix(in oklab, var(--pane-ink) 12%, var(--pane-surface));
    --tp-input-background-color-hover: color-mix(
      in oklab,
      var(--pane-ink) 18%,
      var(--pane-surface)
    );
    --tp-input-background-color-focus: color-mix(
      in oklab,
      var(--pane-ink) 22%,
      var(--pane-surface)
    );
    --tp-input-background-color-active: color-mix(
      in oklab,
      var(--pane-ink) 26%,
      var(--pane-surface)
    );

    --tp-monitor-background-color: color-mix(in oklab, var(--pane-ink) 10%, var(--pane-surface));
    --tp-groove-foreground-color: color-mix(in oklab, var(--pane-ink) 20%, var(--pane-surface));

    /* つまみ・ボタンは前景色をそのまま使い、面との明暗差を確保する */
    --tp-button-background-color: color-mix(in oklab, var(--pane-ink) 55%, var(--pane-surface));
    --tp-button-background-color-hover: color-mix(
      in oklab,
      var(--pane-ink) 65%,
      var(--pane-surface)
    );
    --tp-button-background-color-focus: color-mix(
      in oklab,
      var(--pane-ink) 70%,
      var(--pane-surface)
    );
    --tp-button-background-color-active: color-mix(
      in oklab,
      var(--pane-ink) 80%,
      var(--pane-surface)
    );
    --tp-button-foreground-color: var(--pane-surface);
  }
</style>
