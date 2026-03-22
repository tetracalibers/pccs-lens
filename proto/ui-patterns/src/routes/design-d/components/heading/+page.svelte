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
</script>

<main class:light={theme.isLight}>
  <p class="page-title">見出しデザイン案</p>

  <!-- A: ボーダー左 -->
  <section class="pattern">
    <p class="pattern-label">A — ボーダー左</p>
    <h2 class="h2-a">PCCSとは？</h2>
    <p class="pattern-note">左側に太いカラーボーダーを置くシンプルな強調</p>
  </section>

  <!-- B: グラデーション下線 -->
  <section class="pattern">
    <p class="pattern-label">B — グラデーション下線</p>
    <h2 class="h2-b">PCCSとは？</h2>
    <p class="pattern-note">全幅のレインボーグラデーション下線で色感を演出</p>
  </section>

  <!-- C: ハッシュプレフィックス -->
  <section class="pattern">
    <p class="pattern-label">C — ハッシュプレフィックス</p>
    <h2 class="h2-c">PCCSとは？</h2>
    <p class="pattern-note">「#」記号を前置してセクション感を出す</p>
  </section>

  <!-- D: ダブルライン -->
  <section class="pattern">
    <p class="pattern-label">D — ダブルライン</p>
    <h2 class="h2-d">PCCSとは？</h2>
    <p class="pattern-note">上下に細いラインを引いてテキストを挟む</p>
  </section>

  <!-- E: 静的グラデーション文字 -->
  <section class="pattern">
    <p class="pattern-label">E — グラデーション文字</p>
    <h2 class="h2-e">PCCSとは？</h2>
    <p class="pattern-note">文字そのものをレインボーグラデーションで塗る</p>
  </section>

  <!-- F: キャップス + レタースペーシング -->
  <section class="pattern">
    <p class="pattern-label">F — 大文字 + 字間</p>
    <h2 class="h2-f">PCCSとは？</h2>
    <p class="pattern-note">広めの字間で落ち着いたタイポグラフィを表現</p>
  </section>

  <!-- G: ドット装飾 -->
  <section class="pattern">
    <p class="pattern-label">G — ドット装飾</p>
    <h2 class="h2-g">PCCSとは？</h2>
    <p class="pattern-note">カラーのドットを前置してリズム感を与える</p>
  </section>

  <!-- H: アウトライン文字 -->
  <section class="pattern">
    <p class="pattern-label">H — アウトライン文字</p>
    <h2 class="h2-h">PCCSとは？</h2>
    <p class="pattern-note">塗りなし・線のみで文字を描き、軽やかさを出す</p>
  </section>
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

  /* ===== パターン共通ラッパー ===== */
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
    margin: 0.6rem 0 0;
    line-height: 1.6;
  }

  main.light .pattern-note {
    color: #8888aa;
  }

  /* ===== 共通 h2 リセット ===== */
  h2 {
    margin: 0;
    padding: 0;
  }

  /* =====================
     A: ボーダー左
  ===================== */
  .h2-a {
    font-size: 1.6rem;
    font-weight: 700;
    color: #eeeef8;
    padding-left: 0.85rem;
    border-left: 3px solid #6bcb77;
    line-height: 1.3;
  }

  main.light .h2-a {
    color: #1a1a1a;
    border-left-color: #2f9e44;
  }

  /* =====================
     B: グラデーション下線
  ===================== */
  .h2-b {
    font-size: 1.6rem;
    font-weight: 700;
    color: #eeeef8;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) 1;
    line-height: 1.3;
  }

  main.light .h2-b {
    color: #1a1a1a;
  }

  /* =====================
     C: ハッシュプレフィックス
  ===================== */
  .h2-c {
    font-size: 1.6rem;
    font-weight: 700;
    color: #eeeef8;
    line-height: 1.3;
  }

  .h2-c::before {
    content: "# ";
    color: #4d96ff;
    font-weight: 400;
    opacity: 0.7;
  }

  main.light .h2-c {
    color: #1a1a1a;
  }

  main.light .h2-c::before {
    color: #1971c2;
  }

  /* =====================
     D: ダブルライン
  ===================== */
  .h2-d {
    font-size: 1.6rem;
    font-weight: 700;
    color: #eeeef8;
    padding: 0.55rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
    line-height: 1.3;
  }

  main.light .h2-d {
    color: #1a1a1a;
    border-top-color: rgba(0, 0, 0, 0.2);
    border-bottom-color: rgba(0, 0, 0, 0.2);
  }

  /* =====================
     E: グラデーション文字
  ===================== */
  .h2-e {
    font-size: 1.6rem;
    font-weight: 800;
    background: linear-gradient(90deg, #ff6b6b 0%, #ffd93d 30%, #6bcb77 55%, #4d96ff 80%, #c77dff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.3;
  }

  /* グラデーション文字はライトでも同様 */

  /* =====================
     F: 大文字 + 字間
  ===================== */
  .h2-f {
    font-size: 1.45rem;
    font-weight: 300;
    color: #d0d0e8;
    letter-spacing: 0.22em;
    line-height: 1.4;
  }

  main.light .h2-f {
    color: #2a2a3a;
  }

  /* =====================
     G: ドット装飾
  ===================== */
  .h2-g {
    font-size: 1.6rem;
    font-weight: 700;
    color: #eeeef8;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    line-height: 1.3;
  }

  .h2-g::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }

  main.light .h2-g {
    color: #1a1a1a;
  }

  /* =====================
     H: アウトライン文字
  ===================== */
  .h2-h {
    font-size: 1.6rem;
    font-weight: 800;
    color: transparent;
    -webkit-text-stroke: 1.5px #9898c8;
    line-height: 1.3;
  }

  main.light .h2-h {
    -webkit-text-stroke-color: #3a3a6a;
  }
</style>
