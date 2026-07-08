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
    <h3 class="h3-a">色相とトーンの体系</h3>
    <h4 class="h4-a">有彩色と無彩色</h4>
    <p class="pattern-note">
      左側に太いカラーボーダーを置くシンプルな強調。h3は細め、h4はさらに細くて薄い色で階層を表現
    </p>
  </section>

  <!-- B: グラデーション下線 -->
  <section class="pattern">
    <p class="pattern-label">B — グラデーション下線</p>
    <h2 class="h2-b">PCCSとは？</h2>
    <h3 class="h3-b">色相とトーンの体系</h3>
    <h4 class="h4-b">有彩色と無彩色</h4>
    <p class="pattern-note">
      全幅のレインボーグラデーション下線で色感を演出。h3は短めのグラデーション、h4はドット線で階層を表現
    </p>
  </section>

  <!-- C: ハッシュプレフィックス -->
  <section class="pattern">
    <p class="pattern-label">C — ハッシュプレフィックス</p>
    <h2 class="h2-c">PCCSとは？</h2>
    <h3 class="h3-c">色相とトーンの体系</h3>
    <h4 class="h4-c">有彩色と無彩色</h4>
    <p class="pattern-note">
      「#」記号を前置してセクション感を出す。h3は「##」、h4は「###」で深さを表現
    </p>
  </section>

  <!-- D: ダブルライン -->
  <section class="pattern">
    <p class="pattern-label">D — ダブルライン</p>
    <h2 class="h2-d">PCCSとは？</h2>
    <h3 class="h3-d">色相とトーンの体系</h3>
    <h4 class="h4-d">有彩色と無彩色</h4>
    <p class="pattern-note">
      上下に細いラインを引いてテキストを挟む。h3は下線のみ、h4は細い下線1本で階層を表現
    </p>
  </section>

  <!-- E: 静的グラデーション文字 -->
  <section class="pattern">
    <p class="pattern-label">E — グラデーション文字</p>
    <h2 class="h2-e">PCCSとは？</h2>
    <h3 class="h3-e">色相とトーンの体系</h3>
    <h4 class="h4-e">有彩色と無彩色</h4>
    <p class="pattern-note">
      文字そのものをレインボーグラデーションで塗る。h3は彩度を落としたグラデーション、h4は単色で階層を表現
    </p>
  </section>

  <!-- F: キャップス + レタースペーシング -->
  <section class="pattern">
    <p class="pattern-label">F — 大文字 + 字間</p>
    <h2 class="h2-f">PCCSとは？</h2>
    <h3 class="h3-f">色相とトーンの体系</h3>
    <h4 class="h4-f">有彩色と無彩色</h4>
    <p class="pattern-note">
      広めの字間で落ち着いたタイポグラフィを表現。h3は字間をやや縮め、h4はウェイトを上げて引き締める
    </p>
  </section>

  <!-- G: ドット装飾 -->
  <section class="pattern">
    <p class="pattern-label">G — ドット装飾</p>
    <h2 class="h2-g">PCCSとは？</h2>
    <h3 class="h3-g">色相とトーンの体系</h3>
    <h4 class="h4-g">有彩色と無彩色</h4>
    <p class="pattern-note">
      カラーのドットを前置してリズム感を与える。h3・h4も同じ丸ドットをサイズ（10px→7px→5px）と透明度で段階的に小さくして階層を表現
    </p>
  </section>

  <!-- H: アウトライン文字 -->
  <section class="pattern">
    <p class="pattern-label">H — アウトライン文字</p>
    <h2 class="h2-h">PCCSとは？</h2>
    <h3 class="h3-h">色相とトーンの体系</h3>
    <h4 class="h4-h">有彩色と無彩色</h4>
    <p class="pattern-note">
      塗りなし・線のみで文字を描き、軽やかさを出す。h3は線を細く、h4は薄い塗りと線を組み合わせて階層を表現
    </p>
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

  /* ===== 共通 h2/h3/h4 リセット ===== */
  h2,
  h3,
  h4 {
    margin: 0;
    padding: 0;
  }

  h3 {
    margin-top: 1.1rem;
  }

  h4 {
    margin-top: 0.75rem;
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
    background: linear-gradient(
      90deg,
      #ff6b6b 0%,
      #ffd93d 30%,
      #6bcb77 55%,
      #4d96ff 80%,
      #c77dff 100%
    );
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
    align-items: flex-start;
    gap: 0.55rem;
    line-height: 1.3;
  }

  .h2-g::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    margin-top: calc(0.65em - 5px);
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

  /* =====================
     A: ボーダー左 — h3/h4
  ===================== */
  .h3-a {
    font-size: 1.2rem;
    font-weight: 700;
    color: #eeeef8;
    padding-left: 0.7rem;
    border-left: 2px solid #6bcb77;
    line-height: 1.3;
  }

  main.light .h3-a {
    color: #1a1a1a;
    border-left-color: #2f9e44;
  }

  .h4-a {
    font-size: 0.95rem;
    font-weight: 600;
    color: #b0b0cc;
    padding-left: 0.65rem;
    border-left: 2px solid rgba(107, 203, 119, 0.4);
    line-height: 1.3;
  }

  main.light .h4-a {
    color: #5a5a6a;
    border-left-color: rgba(47, 158, 68, 0.35);
  }

  /* =====================
     B: グラデーション下線 — h3/h4
  ===================== */
  .h3-b {
    font-size: 1.2rem;
    font-weight: 700;
    color: #eeeef8;
    padding-bottom: 0.4rem;
    border-bottom: 1.5px solid transparent;
    border-image: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) 1;
    line-height: 1.3;
  }

  main.light .h3-b {
    color: #1a1a1a;
  }

  .h4-b {
    font-size: 0.95rem;
    font-weight: 600;
    color: #b0b0cc;
    padding-bottom: 0.3rem;
    border-bottom: 1px dashed rgba(107, 150, 255, 0.45);
    line-height: 1.3;
  }

  main.light .h4-b {
    color: #5a5a6a;
    border-bottom-color: rgba(25, 113, 194, 0.35);
  }

  /* =====================
     C: ハッシュプレフィックス — h3/h4
  ===================== */
  .h3-c {
    font-size: 1.2rem;
    font-weight: 700;
    color: #eeeef8;
    line-height: 1.3;
  }

  .h3-c::before {
    content: "## ";
    color: #4d96ff;
    font-weight: 400;
    opacity: 0.6;
  }

  main.light .h3-c {
    color: #1a1a1a;
  }

  main.light .h3-c::before {
    color: #1971c2;
  }

  .h4-c {
    font-size: 0.95rem;
    font-weight: 600;
    color: #b0b0cc;
    line-height: 1.3;
  }

  .h4-c::before {
    content: "### ";
    color: #4d96ff;
    font-weight: 400;
    opacity: 0.45;
  }

  main.light .h4-c {
    color: #5a5a6a;
  }

  main.light .h4-c::before {
    color: #1971c2;
  }

  /* =====================
     D: ダブルライン — h3/h4
  ===================== */
  .h3-d {
    font-size: 1.2rem;
    font-weight: 700;
    color: #eeeef8;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    line-height: 1.3;
  }

  main.light .h3-d {
    color: #1a1a1a;
    border-bottom-color: rgba(0, 0, 0, 0.18);
  }

  .h4-d {
    font-size: 0.95rem;
    font-weight: 600;
    color: #b0b0cc;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    line-height: 1.3;
  }

  main.light .h4-d {
    color: #5a5a6a;
    border-bottom-color: rgba(0, 0, 0, 0.1);
  }

  /* =====================
     E: グラデーション文字 — h3/h4
  ===================== */
  .h3-e {
    font-size: 1.2rem;
    font-weight: 800;
    background: linear-gradient(90deg, #c084bb 0%, #a0a8e0 40%, #7abfdd 70%, #8ecb9e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.3;
  }

  .h4-e {
    font-size: 0.95rem;
    font-weight: 700;
    color: #8888cc;
    line-height: 1.3;
  }

  main.light .h4-e {
    color: #6868aa;
  }

  /* =====================
     F: 大文字 + 字間 — h3/h4
  ===================== */
  .h3-f {
    font-size: 1.1rem;
    font-weight: 300;
    color: #d0d0e8;
    letter-spacing: 0.16em;
    line-height: 1.4;
  }

  main.light .h3-f {
    color: #2a2a3a;
  }

  .h4-f {
    font-size: 0.88rem;
    font-weight: 500;
    color: #9090b8;
    letter-spacing: 0.1em;
    line-height: 1.4;
  }

  main.light .h4-f {
    color: #4a4a6a;
  }

  /* =====================
     G: ドット装飾 — h3/h4
  ===================== */
  .h3-g {
    font-size: 1.2rem;
    font-weight: 700;
    color: #eeeef8;
    display: flex;
    align-items: flex-start;
    gap: calc(0.55rem + 3px);
    line-height: 1.3;
  }

  .h3-g::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    margin-top: calc(0.65em - 3.5px);
    margin-left: 1.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }

  main.light .h3-g {
    color: #1a1a1a;
  }

  .h4-g {
    font-size: 0.95rem;
    font-weight: 600;
    color: #b0b0cc;
    display: flex;
    align-items: flex-start;
    gap: calc(0.55rem + 5px);
    line-height: 1.3;
  }

  .h4-g::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 5px;
    height: 5px;
    margin-top: calc(0.65em - 2.5px);
    margin-left: 2.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.5), rgba(199, 125, 255, 0.5));
  }

  main.light .h4-g {
    color: #5a5a6a;
  }

  /* =====================
     H: アウトライン文字 — h3/h4
  ===================== */
  .h3-h {
    font-size: 1.2rem;
    font-weight: 800;
    color: transparent;
    -webkit-text-stroke: 1px #9898c8;
    line-height: 1.3;
  }

  main.light .h3-h {
    -webkit-text-stroke-color: #5a5a8a;
  }

  .h4-h {
    font-size: 0.95rem;
    font-weight: 700;
    color: rgba(152, 152, 200, 0.25);
    -webkit-text-stroke: 0.75px rgba(152, 152, 200, 0.6);
    line-height: 1.3;
  }

  main.light .h4-h {
    color: rgba(58, 58, 106, 0.15);
    -webkit-text-stroke-color: rgba(58, 58, 106, 0.45);
  }
</style>
