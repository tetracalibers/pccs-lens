<script lang="ts">
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  // 各案の暗記/解説モード状態（true = 暗記モード）
  let modes = $state([true, true, true, true, true, true, true, true])

  function toggleMode(i: number) {
    modes[i] = !modes[i]
  }

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
      note: "ピル型トラック上でノブがスライドするクラシックなスイッチ。暗記は紫、解説は青緑で色が切り替わり、状態が直感的に伝わる"
    },
    {
      id: "b",
      label: "B — セグメントコントロール",
      note: "「暗記」「解説」を常に両方表示し、選択中に背景が乗る。選択肢が常に見えるため誤操作しにくく、切り替えコストが低い"
    },
    {
      id: "c",
      label: "C — モードバッジボタン",
      note: "現在のモード名を太字で示し、クリックで相手モードへ切り替えるシンプルなバッジ型。「今どっち？」が一目で把握できる"
    },
    {
      id: "d",
      label: "D — アイコン丸ボタン",
      note: "円形ボタンにモードアイコンを表示。コンパクトで場所を取らず、ホバー時のグローが視線を誘導する。ツールバー向き"
    },
    {
      id: "e",
      label: "E — スライドテキスト",
      note: "「暗記モード」「解説モード」のラベルが横にスライドインするボタン。押すと次のモード名が見え、クリック先が予測できる"
    },
    {
      id: "f",
      label: "F — グラデーションシフト",
      note: "背景グラデーションがモードに連動して変化。暗記は紫系の深い夜空、解説は青緑の水面を想起させ、雰囲気で状態を伝える"
    },
    {
      id: "g",
      label: "G — アンダーライン付き2択",
      note: "横並びのテキストにアクティブ側だけアンダーラインが引かれるタブ風デザイン。テキストのみで視覚的ノイズを最小化"
    },
    {
      id: "h",
      label: "H — ゴーストカプセル",
      note: "枠線（ゴースト）スタイルのカプセル型ボタン。暗記は紫の光彩、解説は青緑の光彩で、押した状態を色で強調する"
    }
  ]
</script>

<svelte:head>
  <title>暗記/解説 切替トグル - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <p class="page-title">暗記 / 解説 切替トグル デザイン案</p>
  <p class="page-desc">クリックでモードの切り替えをプレビューできます</p>

  {#each patterns as p, i (p.id)}
    <section class="pattern">
      <p class="pattern-label">{p.label}</p>
      <div class="preview">
        <div class="preview-inner">
          {#if p.id === "a"}
            <!-- A: ピルトグル -->
            <button
              class="btn-a"
              class:is-kaisetsu={!modes[i]}
              onclick={() => toggleMode(i)}
              aria-label={modes[i] ? "解説モードに切替" : "暗記モードに切替"}
            >
              <span class="btn-a-label" class:active={modes[i]}>暗記</span>
              <span class="btn-a-track">
                <span class="btn-a-knob"></span>
              </span>
              <span class="btn-a-label" class:active={!modes[i]}>解説</span>
            </button>
          {:else if p.id === "b"}
            <!-- B: セグメントコントロール -->
            <div class="btn-b" class:is-kaisetsu={!modes[i]}>
              <button
                class="btn-b-seg"
                class:active={modes[i]}
                onclick={() => {
                  if (!modes[i]) toggleMode(i)
                }}
              >
                暗記
              </button>
              <button
                class="btn-b-seg"
                class:active={!modes[i]}
                onclick={() => {
                  if (modes[i]) toggleMode(i)
                }}
              >
                解説
              </button>
            </div>
          {:else if p.id === "c"}
            <!-- C: モードバッジボタン -->
            <button
              class="btn-c"
              class:is-kaisetsu={!modes[i]}
              onclick={() => toggleMode(i)}
              aria-label={modes[i] ? "解説モードに切替" : "暗記モードに切替"}
            >
              <span class="btn-c-mode">{modes[i] ? "暗記モード" : "解説モード"}</span>
              <span class="btn-c-arrow">⇄</span>
            </button>
          {:else if p.id === "d"}
            <!-- D: アイコン丸ボタン -->
            <button
              class="btn-d"
              class:is-kaisetsu={!modes[i]}
              onclick={() => toggleMode(i)}
              aria-label={modes[i] ? "解説モードに切替" : "暗記モードに切替"}
            >
              <svg class="btn-d-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {#if modes[i]}
                  <!-- 暗記: 本アイコン -->
                  <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <line
                    x1="9"
                    y1="7"
                    x2="15"
                    y2="7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <line
                    x1="9"
                    y1="10"
                    x2="15"
                    y2="10"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                {:else}
                  <!-- 解説: 電球アイコン -->
                  <path
                    d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <line
                    x1="9"
                    y1="21"
                    x2="15"
                    y2="21"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <line
                    x1="10"
                    y1="18"
                    x2="14"
                    y2="18"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                {/if}
              </svg>
            </button>
          {:else if p.id === "e"}
            <!-- E: スライドテキスト -->
            <button class="btn-e" class:is-kaisetsu={!modes[i]} onclick={() => toggleMode(i)}>
              <span class="btn-e-current">{modes[i] ? "暗記モード" : "解説モード"}</span>
              <span class="btn-e-divider">|</span>
              <span class="btn-e-next">{modes[i] ? "解説へ →" : "暗記へ →"}</span>
            </button>
          {:else if p.id === "f"}
            <!-- F: グラデーションシフト -->
            <button class="btn-f" class:is-kaisetsu={!modes[i]} onclick={() => toggleMode(i)}>
              <span class="btn-f-icon">{modes[i] ? "📖" : "💡"}</span>
              <span class="btn-f-text">{modes[i] ? "暗記" : "解説"}</span>
            </button>
          {:else if p.id === "g"}
            <!-- G: アンダーライン付き2択 -->
            <div class="btn-g" class:is-kaisetsu={!modes[i]}>
              <button
                class="btn-g-tab"
                class:active={modes[i]}
                onclick={() => {
                  if (!modes[i]) toggleMode(i)
                }}
              >
                暗記
              </button>
              <span class="btn-g-sep">/</span>
              <button
                class="btn-g-tab"
                class:active={!modes[i]}
                onclick={() => {
                  if (modes[i]) toggleMode(i)
                }}
              >
                解説
              </button>
            </div>
          {:else if p.id === "h"}
            <!-- H: ゴーストカプセル -->
            <button class="btn-h" class:is-kaisetsu={!modes[i]} onclick={() => toggleMode(i)}>
              <span class="btn-h-dot"></span>
              <span class="btn-h-text">{modes[i] ? "暗記モード" : "解説モード"}</span>
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
    color: #f0f0f0;
    transition: color 0.4s;
  }

  main.light {
    color: #1a1a1a;
  }

  .page-title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5050a0;
    margin: 0 0 0.4rem;
    transition: color 0.4s;
  }

  main.light .page-title {
    color: #8888aa;
  }

  .page-desc {
    font-size: 0.82rem;
    color: #555;
    margin: 0 0 2.5rem;
    transition: color 0.4s;
  }

  main.light .page-desc {
    color: #888;
  }

  .pattern {
    margin-bottom: 3rem;
    padding-bottom: 2.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: border-color 0.4s;
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
    transition: color 0.4s;
  }

  main.light .pattern-label {
    color: #9999cc;
  }

  .pattern-note {
    font-size: 0.8rem;
    color: #5858a0;
    margin: 0.75rem 0 0;
    line-height: 1.6;
    transition: color 0.4s;
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

  .preview-inner {
    display: flex;
    align-items: center;
  }

  /* 共通ボタンリセット */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    line-height: 1;
  }

  /* ==========================
     カラー変数
     暗記: #9333ea (紫)
     解説: #0891b2 (青緑)
  ========================== */

  /* ========================
     A: ピルトグル
  ======================== */
  .btn-a {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .btn-a-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #4848a0;
    transition: color 0.3s;
  }

  .btn-a-label.active {
    color: #c4b5fd;
  }

  .btn-a.is-kaisetsu .btn-a-label.active {
    color: #22d3ee;
  }

  main.light .btn-a-label {
    color: #aaaacc;
  }

  main.light .btn-a-label.active {
    color: #7c3aed;
  }

  main.light .btn-a.is-kaisetsu .btn-a-label.active {
    color: #0e7490;
  }

  .btn-a-track {
    display: inline-block;
    position: relative;
    width: 2.8rem;
    height: 1.4rem;
    border-radius: 999px;
    background: rgba(196, 181, 253, 0.2);
    border: 1px solid rgba(196, 181, 253, 0.4);
    transition:
      background 0.35s,
      border-color 0.35s;
  }

  .btn-a.is-kaisetsu .btn-a-track {
    background: rgba(34, 211, 238, 0.15);
    border-color: rgba(34, 211, 238, 0.4);
  }

  main.light .btn-a-track {
    background: rgba(124, 58, 237, 0.12);
    border-color: rgba(124, 58, 237, 0.35);
  }

  main.light .btn-a.is-kaisetsu .btn-a-track {
    background: rgba(14, 116, 144, 0.12);
    border-color: rgba(14, 116, 144, 0.35);
  }

  .btn-a-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #c4b5fd;
    box-shadow: 0 0 8px rgba(196, 181, 253, 0.7);
    transition:
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      background 0.35s,
      box-shadow 0.35s;
  }

  .btn-a.is-kaisetsu .btn-a-knob {
    transform: translateX(1.4rem);
    background: #22d3ee;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
  }

  main.light .btn-a-knob {
    background: #7c3aed;
    box-shadow: 0 0 8px rgba(124, 58, 237, 0.4);
  }

  main.light .btn-a.is-kaisetsu .btn-a-knob {
    background: #0e7490;
    box-shadow: 0 0 8px rgba(14, 116, 144, 0.35);
  }

  /* ========================
     B: セグメントコントロール
  ======================== */
  .btn-b {
    display: inline-flex;
    border-radius: 999px;
    padding: 3px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition:
      background 0.3s,
      border-color 0.3s;
  }

  main.light .btn-b {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .btn-b-seg {
    padding: 0.38rem 1rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 500;
    color: #5050a0;
    transition:
      background 0.25s,
      color 0.25s,
      box-shadow 0.25s;
  }

  main.light .btn-b-seg {
    color: #aaa;
  }

  .btn-b .btn-b-seg.active {
    background: rgba(196, 181, 253, 0.18);
    color: #c4b5fd;
    box-shadow: 0 1px 6px rgba(196, 181, 253, 0.25);
  }

  main.light .btn-b .btn-b-seg.active {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
    box-shadow: 0 1px 6px rgba(124, 58, 237, 0.15);
  }

  .btn-b.is-kaisetsu .btn-b-seg.active {
    background: rgba(34, 211, 238, 0.14);
    color: #22d3ee;
    box-shadow: 0 1px 6px rgba(34, 211, 238, 0.2);
  }

  main.light .btn-b.is-kaisetsu .btn-b-seg.active {
    background: rgba(14, 116, 144, 0.1);
    color: #0e7490;
    box-shadow: 0 1px 6px rgba(14, 116, 144, 0.12);
  }

  /* ========================
     C: モードバッジボタン
  ======================== */
  .btn-c {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1rem;
    border-radius: 6px;
    background: rgba(196, 181, 253, 0.12);
    border: 1px solid rgba(196, 181, 253, 0.3) !important;
    color: #c4b5fd;
    transition:
      background 0.35s,
      border-color 0.35s,
      color 0.35s;
  }

  .btn-c:hover {
    background: rgba(196, 181, 253, 0.2);
  }

  .btn-c.is-kaisetsu {
    background: rgba(34, 211, 238, 0.1);
    border-color: rgba(34, 211, 238, 0.3) !important;
    color: #22d3ee;
  }

  .btn-c.is-kaisetsu:hover {
    background: rgba(34, 211, 238, 0.18);
  }

  main.light .btn-c {
    background: rgba(124, 58, 237, 0.08);
    border-color: rgba(124, 58, 237, 0.3) !important;
    color: #7c3aed;
  }

  main.light .btn-c:hover {
    background: rgba(124, 58, 237, 0.14);
  }

  main.light .btn-c.is-kaisetsu {
    background: rgba(14, 116, 144, 0.07);
    border-color: rgba(14, 116, 144, 0.3) !important;
    color: #0e7490;
  }

  main.light .btn-c.is-kaisetsu:hover {
    background: rgba(14, 116, 144, 0.13);
  }

  .btn-c-mode {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .btn-c-arrow {
    font-size: 1rem;
    opacity: 0.6;
  }

  /* ========================
     D: アイコン丸ボタン
  ======================== */
  .btn-d {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: rgba(196, 181, 253, 0.1);
    border: 1.5px solid rgba(196, 181, 253, 0.35) !important;
    color: #c4b5fd;
    transition:
      background 0.35s,
      border-color 0.35s,
      color 0.35s,
      box-shadow 0.3s,
      transform 0.2s;
  }

  .btn-d:hover {
    background: rgba(196, 181, 253, 0.18);
    box-shadow: 0 0 16px rgba(196, 181, 253, 0.45);
    transform: scale(1.07);
  }

  .btn-d.is-kaisetsu {
    background: rgba(34, 211, 238, 0.1);
    border-color: rgba(34, 211, 238, 0.35) !important;
    color: #22d3ee;
  }

  .btn-d.is-kaisetsu:hover {
    background: rgba(34, 211, 238, 0.18);
    box-shadow: 0 0 16px rgba(34, 211, 238, 0.4);
  }

  main.light .btn-d {
    background: rgba(124, 58, 237, 0.07);
    border-color: rgba(124, 58, 237, 0.3) !important;
    color: #7c3aed;
  }

  main.light .btn-d:hover {
    background: rgba(124, 58, 237, 0.14);
    box-shadow: 0 0 14px rgba(124, 58, 237, 0.3);
  }

  main.light .btn-d.is-kaisetsu {
    background: rgba(14, 116, 144, 0.07);
    border-color: rgba(14, 116, 144, 0.3) !important;
    color: #0e7490;
  }

  main.light .btn-d.is-kaisetsu:hover {
    background: rgba(14, 116, 144, 0.13);
    box-shadow: 0 0 14px rgba(14, 116, 144, 0.25);
  }

  .btn-d-icon {
    width: 22px;
    height: 22px;
  }

  /* ========================
     E: スライドテキスト
  ======================== */
  .btn-e {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 1rem;
    border-radius: 6px;
    background: rgba(196, 181, 253, 0.08);
    color: #c4b5fd;
    font-size: 0.84rem;
    transition:
      background 0.35s,
      color 0.35s;
  }

  .btn-e:hover {
    background: rgba(196, 181, 253, 0.15);
  }

  .btn-e.is-kaisetsu {
    background: rgba(34, 211, 238, 0.07);
    color: #22d3ee;
  }

  .btn-e.is-kaisetsu:hover {
    background: rgba(34, 211, 238, 0.14);
  }

  main.light .btn-e {
    background: rgba(124, 58, 237, 0.07);
    color: #7c3aed;
  }

  main.light .btn-e:hover {
    background: rgba(124, 58, 237, 0.13);
  }

  main.light .btn-e.is-kaisetsu {
    background: rgba(14, 116, 144, 0.07);
    color: #0e7490;
  }

  main.light .btn-e.is-kaisetsu:hover {
    background: rgba(14, 116, 144, 0.13);
  }

  .btn-e-current {
    font-weight: 700;
  }

  .btn-e-divider {
    opacity: 0.25;
    font-weight: 300;
  }

  .btn-e-next {
    font-size: 0.78rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .btn-e:hover .btn-e-next {
    opacity: 1;
  }

  /* ========================
     F: グラデーションシフト
  ======================== */
  .btn-f {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.6rem 1.3rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #1e0548, #3b0764);
    color: #e9d5ff;
    font-size: 0.9rem;
    font-weight: 700;
    box-shadow: 0 3px 14px rgba(147, 51, 234, 0.4);
    transition:
      background 0.5s,
      color 0.3s,
      box-shadow 0.3s;
  }

  .btn-f:hover {
    box-shadow: 0 5px 22px rgba(147, 51, 234, 0.55);
  }

  .btn-f.is-kaisetsu {
    background: linear-gradient(135deg, #042f2e, #134e4a);
    color: #a5f3fc;
    box-shadow: 0 3px 14px rgba(8, 145, 178, 0.4);
  }

  .btn-f.is-kaisetsu:hover {
    box-shadow: 0 5px 22px rgba(8, 145, 178, 0.55);
  }

  main.light .btn-f {
    background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    color: #5b21b6;
    box-shadow: 0 3px 14px rgba(124, 58, 237, 0.2);
  }

  main.light .btn-f:hover {
    box-shadow: 0 5px 22px rgba(124, 58, 237, 0.3);
  }

  main.light .btn-f.is-kaisetsu {
    background: linear-gradient(135deg, #ecfeff, #cffafe);
    color: #164e63;
    box-shadow: 0 3px 14px rgba(14, 116, 144, 0.2);
  }

  main.light .btn-f.is-kaisetsu:hover {
    box-shadow: 0 5px 22px rgba(14, 116, 144, 0.3);
  }

  .btn-f-icon {
    font-size: 1.1rem;
  }

  .btn-f-text {
    letter-spacing: 0.04em;
  }

  /* ========================
     G: アンダーライン付き2択
  ======================== */
  .btn-g {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  .btn-g-sep {
    font-size: 0.85rem;
    color: #333380;
    opacity: 0.4;
  }

  main.light .btn-g-sep {
    color: #ccc;
    opacity: 1;
  }

  .btn-g-tab {
    font-size: 0.9rem;
    font-weight: 600;
    color: #4040a0;
    padding-bottom: 3px;
    border-bottom: 2px solid transparent;
    transition:
      color 0.25s,
      border-color 0.25s;
  }

  main.light .btn-g-tab {
    color: #ccc;
  }

  .btn-g .btn-g-tab.active {
    color: #c4b5fd;
    border-bottom-color: #c4b5fd;
  }

  main.light .btn-g .btn-g-tab.active {
    color: #7c3aed;
    border-bottom-color: #7c3aed;
  }

  .btn-g.is-kaisetsu .btn-g-tab.active {
    color: #22d3ee;
    border-bottom-color: #22d3ee;
  }

  main.light .btn-g.is-kaisetsu .btn-g-tab.active {
    color: #0e7490;
    border-bottom-color: #0e7490;
  }

  .btn-g-tab:not(.active):hover {
    color: #7070c0;
  }

  main.light .btn-g-tab:not(.active):hover {
    color: #999;
  }

  /* ========================
     H: ゴーストカプセル
  ======================== */
  .btn-h {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 1.1rem;
    border-radius: 999px;
    border: 1.5px solid rgba(196, 181, 253, 0.4) !important;
    color: #c4b5fd;
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 0 10px rgba(196, 181, 253, 0.12);
    transition:
      border-color 0.35s,
      color 0.35s,
      box-shadow 0.35s,
      background 0.35s;
  }

  .btn-h:hover {
    border-color: rgba(196, 181, 253, 0.7) !important;
    box-shadow: 0 0 18px rgba(196, 181, 253, 0.3);
    background: rgba(196, 181, 253, 0.07);
  }

  .btn-h.is-kaisetsu {
    border-color: rgba(34, 211, 238, 0.4) !important;
    color: #22d3ee;
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.12);
  }

  .btn-h.is-kaisetsu:hover {
    border-color: rgba(34, 211, 238, 0.7) !important;
    box-shadow: 0 0 18px rgba(34, 211, 238, 0.28);
    background: rgba(34, 211, 238, 0.06);
  }

  main.light .btn-h {
    border-color: rgba(124, 58, 237, 0.35) !important;
    color: #7c3aed;
    box-shadow: 0 0 8px rgba(124, 58, 237, 0.1);
  }

  main.light .btn-h:hover {
    border-color: rgba(124, 58, 237, 0.65) !important;
    box-shadow: 0 0 14px rgba(124, 58, 237, 0.22);
    background: rgba(124, 58, 237, 0.05);
  }

  main.light .btn-h.is-kaisetsu {
    border-color: rgba(14, 116, 144, 0.35) !important;
    color: #0e7490;
    box-shadow: 0 0 8px rgba(14, 116, 144, 0.1);
  }

  main.light .btn-h.is-kaisetsu:hover {
    border-color: rgba(14, 116, 144, 0.65) !important;
    box-shadow: 0 0 14px rgba(14, 116, 144, 0.2);
    background: rgba(14, 116, 144, 0.05);
  }

  .btn-h-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
    transition: background 0.35s;
  }

  .btn-h-text {
    letter-spacing: 0.02em;
  }
</style>
