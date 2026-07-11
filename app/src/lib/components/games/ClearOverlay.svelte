<script lang="ts">
  import type { Snippet } from "svelte"
  import Icon from "@iconify/svelte"
  import { portal } from "$lib/actions/portal"

  interface Props {
    /** 「もっと続ける」を押したときのハンドラ。 */
    oncontinue: () => void
    /** 見出し。 */
    title?: string
    /** 続行ボタンのラベル。 */
    continueLabel?: string
    /** クリア内容の説明本文（ゲームごとに異なる）。 */
    children: Snippet
  }

  let { oncontinue, title = "クリア！", continueLabel = "もっと続ける", children }: Props = $props()
</script>

<!--
  games 配下の各ゲームで共通利用するクリア演出オーバーレイ。
  レイアウトの .container は container-type を持ち position: fixed の包含ブロックに
  なるため、その内側では fixed がビューポート基準にならない。portal で body 直下へ
  逃がすことで、スクロール位置に関わらず画面中央へ固定表示する。
  表示制御（マウント／アンマウント）は呼び出し側の {#if} に委ねる。
-->
<div class="clear-overlay" role="status" aria-live="assertive" use:portal>
  <div class="clear-card">
    <Icon icon="mdi:party-popper" />
    <p class="clear-title">{title}</p>
    <p class="clear-desc">{@render children()}</p>
    <button type="button" class="continue-btn" onclick={oncontinue}>
      {continueLabel}
    </button>
  </div>
</div>

<style>
  .clear-overlay {
    /* portal で body 直下へ出るため fixed はビューポート基準。overlay 自体は
       クリックを透過し、カードのみ操作可能。main の外へ出る分、カードが参照する
       局所トークンをここで補う。 */
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
