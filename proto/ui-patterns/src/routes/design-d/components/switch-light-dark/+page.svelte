<script lang="ts">
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  $effect(() => {
    document.body.style.background = theme.isLight ? "#ffffff" : "#0c0c14"
    document.body.style.color = theme.isLight ? "#1a1a1a" : "#d8d8e8"
    return () => {
      document.body.style.background = ""
      document.body.style.color = ""
    }
  })

  const patterns = [
    {
      id: "a",
      label: "A — ピルトグル",
      note: "ピル型のトラック上でノブがスライドするクラシックなトグル。ON/OFFの状態が直感的に把握でき、モバイルとデスクトップ両方に馴染む定番スタイル"
    },
    {
      id: "b",
      label: "B — アイコン丸ボタン",
      note: "円形ボタンに現在のモードを示すアイコン（☀/☽）を表示。小さなフットプリントでどこにでも置ける。ホバー時のグロー演出で視線を誘導"
    },
    {
      id: "c",
      label: "C — セグメントスイッチ",
      note: "ライト・ダークの2択をセグメントコントロールで並列表示。現在選択中の項目に背景が乗り、選択肢が常に見えるため誤操作しにくい"
    },
    {
      id: "d",
      label: "D — ゴーストボタン",
      note: "アウトライン（枠線）だけのゴーストボタンにアイコンとテキストを組み合わせ。主張が少なくコンテンツの邪魔をしないが、確実に存在を示す"
    },
    {
      id: "e",
      label: "E — グロウリングアイコン",
      note: "リング（光輪）に囲まれたアイコンボタン。ライトモード時は太陽のコロナ、ダークモード時は月の後光を想起させる、テーマと意味が一致したビジュアル"
    },
    {
      id: "f",
      label: "F — スライドテキスト",
      note: "「Light」「Dark」のテキストが現在モードに応じてスライドインするボタン。文字だけで状態を説明するためアイコン非対応の環境でも機能する"
    },
    {
      id: "g",
      label: "G — グラデーションシフト",
      note: "ボタン背景のグラデーションがモードに連動して変化。ライトは暖色（朝焼け）、ダークは寒色（夜空）で、押すたびに昼夜が切り替わる感覚を演出"
    },
    {
      id: "h",
      label: "H — ミニマルテキストリンク",
      note: "テキストのみのトグルで視覚的ノイズを最小化。現在のモードを小さなドットで示し、アンダーラインなしのリンクとして読み取れる最もシンプルな実装"
    }
  ]
</script>

<svelte:head>
  <title>ライト／ダーク切替ボタン - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <p class="page-title">ライト / ダーク 切替ボタン デザイン案</p>

  {#each patterns as p (p.id)}
    <section class="pattern">
      <p class="pattern-label">{p.label}</p>
      <div class="preview">
        <div class="preview-inner btn-{p.id}-wrap">
          {#if p.id === "a"}
            <!-- A: ピルトグル -->
            <button
              class="btn-a"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
              aria-label={theme.isLight ? "ダークモードに切替" : "ライトモードに切替"}
            >
              <span class="btn-a-icon sun">☀</span>
              <span class="btn-a-track">
                <span class="btn-a-knob"></span>
              </span>
              <span class="btn-a-icon moon">☽</span>
            </button>

          {:else if p.id === "b"}
            <!-- B: アイコン丸ボタン -->
            <button
              class="btn-b"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
              aria-label={theme.isLight ? "ダークモードに切替" : "ライトモードに切替"}
            >
              {#if theme.isLight}☽{:else}☀{/if}
            </button>

          {:else if p.id === "c"}
            <!-- C: セグメントスイッチ -->
            <div class="btn-c" class:is-light={!theme.isLight}>
              <button
                class="btn-c-seg"
                class:active={!theme.isLight}
                onclick={() => { if (!theme.isLight) theme.toggle() }}
              >☀ ライト</button>
              <button
                class="btn-c-seg"
                class:active={theme.isLight}
                onclick={() => { if (theme.isLight) theme.toggle() }}
              >☽ ダーク</button>
            </div>

          {:else if p.id === "d"}
            <!-- D: ゴーストボタン -->
            <button
              class="btn-d"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
            >
              <span class="btn-d-icon">{theme.isLight ? "☽" : "☀"}</span>
              <span class="btn-d-text">{theme.isLight ? "ダークモード" : "ライトモード"}</span>
            </button>

          {:else if p.id === "e"}
            <!-- E: グロウリングアイコン -->
            <button
              class="btn-e"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
              aria-label={theme.isLight ? "ダークモードに切替" : "ライトモードに切替"}
            >
              <span class="btn-e-ring"></span>
              <span class="btn-e-icon">{theme.isLight ? "☽" : "☀"}</span>
            </button>

          {:else if p.id === "f"}
            <!-- F: スライドテキスト -->
            <button
              class="btn-f"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
            >
              <span class="btn-f-label">{theme.isLight ? "Dark" : "Light"}</span>
              <span class="btn-f-arrow">→</span>
            </button>

          {:else if p.id === "g"}
            <!-- G: グラデーションシフト -->
            <button
              class="btn-g"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
            >
              <span class="btn-g-icon">{theme.isLight ? "☽" : "☀"}</span>
              <span class="btn-g-text">{theme.isLight ? "Night" : "Day"}</span>
            </button>

          {:else if p.id === "h"}
            <!-- H: ミニマルテキストリンク -->
            <button
              class="btn-h"
              class:is-light={!theme.isLight}
              onclick={theme.toggle}
            >
              <span class="btn-h-dot"></span>
              <span class="btn-h-text">{theme.isLight ? "ダークモード" : "ライトモード"}</span>
            </button>
          {/if}
        </div>
      </div>
      <p class="pattern-note">{p.note}</p>
    </section>
  {/each}
</main>

<style>
  main {
    max-width: 700px;
    margin: 2.75rem auto 0;
    padding: 0 1rem 4rem;
  }

  .page-title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5050a0;
    margin: 0 0 2.5rem;
  }

  main.light .page-title {
    color: #8888aa;
  }

  .pattern {
    margin-bottom: 3rem;
    padding-bottom: 2.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  main.light .pattern {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  .pattern:last-child {
    border-bottom: none;
  }

  .pattern-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: #4848a0;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  main.light .pattern-label {
    color: #9999cc;
  }

  .pattern-note {
    font-size: 0.8rem;
    color: #5858a0;
    margin: 0.75rem 0 0;
    line-height: 1.6;
  }

  main.light .pattern-note {
    color: #8888aa;
  }

  .preview {
    display: flex;
    align-items: center;
    min-height: 72px;
    padding: 1rem 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    transition:
      background 0.4s,
      border-color 0.4s;
  }

  main.light .preview {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.06);
  }

  /* ========================
     共通ボタンリセット
  ======================== */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    line-height: 1;
  }

  /* ========================
     A: ピルトグル
  ======================== */
  .btn-a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-a-icon {
    font-size: 0.9rem;
    transition: opacity 0.3s;
  }

  .btn-a .sun {
    opacity: 0.35;
  }

  .btn-a .moon {
    opacity: 1;
    color: #c4b5fd;
  }

  .btn-a.is-light .sun {
    opacity: 1;
    color: #f59e0b;
  }

  .btn-a.is-light .moon {
    opacity: 0.35;
    color: inherit;
  }

  .btn-a-track {
    display: inline-block;
    position: relative;
    width: 2.6rem;
    height: 1.4rem;
    border-radius: 999px;
    background: rgba(196, 181, 253, 0.25);
    border: 1px solid rgba(196, 181, 253, 0.35);
    transition:
      background 0.3s,
      border-color 0.3s;
  }

  .btn-a.is-light .btn-a-track {
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.4);
  }

  .btn-a-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #c4b5fd;
    box-shadow: 0 0 8px rgba(196, 181, 253, 0.6);
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      background 0.3s,
      box-shadow 0.3s;
  }

  .btn-a.is-light .btn-a-knob {
    transform: translateX(1.2rem);
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  }

  /* ========================
     B: アイコン丸ボタン
  ======================== */
  .btn-b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    font-size: 1.15rem;
    background: rgba(196, 181, 253, 0.12);
    border: 1px solid rgba(196, 181, 253, 0.3) !important;
    color: #c4b5fd;
    transition:
      background 0.3s,
      border-color 0.3s,
      box-shadow 0.3s,
      transform 0.2s;
  }

  .btn-b:hover {
    background: rgba(196, 181, 253, 0.2);
    box-shadow: 0 0 16px rgba(196, 181, 253, 0.4);
    transform: scale(1.08);
  }

  .btn-b.is-light {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.35) !important;
    color: #f59e0b;
  }

  .btn-b.is-light:hover {
    background: rgba(245, 158, 11, 0.18);
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);
  }

  /* ========================
     C: セグメントスイッチ
  ======================== */
  .btn-c {
    display: inline-flex;
    border-radius: 999px;
    padding: 3px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition:
      background 0.3s,
      border-color 0.3s;
  }

  main.light .btn-c {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .btn-c-seg {
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    font-size: 0.8rem;
    color: #6060a0;
    transition:
      background 0.25s,
      color 0.25s,
      box-shadow 0.25s;
  }

  .btn-c-seg.active {
    background: rgba(196, 181, 253, 0.18);
    color: #c4b5fd;
    box-shadow: 0 1px 6px rgba(196, 181, 253, 0.25);
  }

  main.light .btn-c-seg.active {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
    box-shadow: 0 1px 6px rgba(245, 158, 11, 0.2);
  }

  /* ========================
     D: ゴーストボタン
  ======================== */
  .btn-d {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid rgba(196, 181, 253, 0.35) !important;
    color: #c4b5fd;
    font-size: 0.85rem;
    transition:
      border-color 0.25s,
      color 0.25s,
      background 0.25s;
  }

  .btn-d:hover {
    background: rgba(196, 181, 253, 0.08);
    border-color: rgba(196, 181, 253, 0.55) !important;
  }

  .btn-d.is-light {
    border-color: rgba(217, 119, 6, 0.4) !important;
    color: #d97706;
  }

  .btn-d.is-light:hover {
    background: rgba(217, 119, 6, 0.06);
    border-color: rgba(217, 119, 6, 0.6) !important;
  }

  .btn-d-icon {
    font-size: 1rem;
  }

  .btn-d-text {
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* ========================
     E: グロウリングアイコン
  ======================== */
  .btn-e {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
  }

  .btn-e-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid rgba(196, 181, 253, 0.5);
    box-shadow:
      0 0 12px rgba(196, 181, 253, 0.3),
      inset 0 0 8px rgba(196, 181, 253, 0.1);
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
  }

  .btn-e.is-light .btn-e-ring {
    border-color: rgba(245, 158, 11, 0.55);
    box-shadow:
      0 0 14px rgba(245, 158, 11, 0.35),
      inset 0 0 8px rgba(245, 158, 11, 0.12);
  }

  .btn-e:hover .btn-e-ring {
    border-color: rgba(196, 181, 253, 0.8);
    box-shadow:
      0 0 20px rgba(196, 181, 253, 0.5),
      inset 0 0 10px rgba(196, 181, 253, 0.15);
  }

  .btn-e.is-light:hover .btn-e-ring {
    border-color: rgba(245, 158, 11, 0.9);
    box-shadow:
      0 0 22px rgba(245, 158, 11, 0.5),
      inset 0 0 10px rgba(245, 158, 11, 0.18);
  }

  .btn-e-icon {
    font-size: 1.15rem;
    color: #c4b5fd;
    transition: color 0.3s;
    position: relative;
    z-index: 1;
  }

  .btn-e.is-light .btn-e-icon {
    color: #f59e0b;
  }

  /* ========================
     F: スライドテキスト
  ======================== */
  .btn-f {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1.1rem;
    border-radius: 4px;
    background: rgba(196, 181, 253, 0.1);
    color: #c4b5fd;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    transition:
      background 0.3s,
      color 0.3s;
    overflow: hidden;
  }

  .btn-f:hover {
    background: rgba(196, 181, 253, 0.18);
  }

  .btn-f.is-light {
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
  }

  .btn-f.is-light:hover {
    background: rgba(245, 158, 11, 0.2);
  }

  .btn-f-label {
    transition:
      transform 0.3s,
      opacity 0.3s;
  }

  .btn-f-arrow {
    font-size: 0.75rem;
    opacity: 0.6;
    transition: transform 0.2s;
  }

  .btn-f:hover .btn-f-arrow {
    transform: translateX(3px);
  }

  /* ========================
     G: グラデーションシフト
  ======================== */
  .btn-g {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #1a1a3e, #2d2060);
    color: #e0d8ff;
    font-size: 0.85rem;
    font-weight: 600;
    transition:
      background 0.5s,
      color 0.3s,
      box-shadow 0.3s;
    box-shadow: 0 2px 12px rgba(109, 40, 217, 0.35);
  }

  .btn-g:hover {
    box-shadow: 0 4px 20px rgba(109, 40, 217, 0.5);
  }

  .btn-g.is-light {
    background: linear-gradient(135deg, #fff3cd, #ffe082);
    color: #92400e;
    box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
  }

  .btn-g.is-light:hover {
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.5);
  }

  .btn-g-icon {
    font-size: 1rem;
  }

  .btn-g-text {
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.78rem;
  }

  /* ========================
     H: ミニマルテキストリンク
  ======================== */
  .btn-h {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #6060a0;
    font-size: 0.82rem;
    transition: color 0.3s;
  }

  .btn-h:hover {
    color: #c4b5fd;
  }

  .btn-h.is-light {
    color: #aaaacc;
  }

  .btn-h.is-light:hover {
    color: #d97706;
  }

  .btn-h-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
    transition: background 0.3s;
  }

  .btn-h-text {
    font-weight: 500;
    letter-spacing: 0.02em;
  }
</style>
