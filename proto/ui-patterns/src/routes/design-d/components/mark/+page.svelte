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
  <p class="page-title">強調語（.mark）デザイン案</p>

  <!-- A: 現行案 — 「」括弧 + 黄色文字 -->
  <section class="pattern">
    <p class="pattern-label">A — 「」括弧 + 黄色文字（現行案）</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -a">色相</span>
      と
      <span class="mark -a">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">「」で語を括り、黄色で強調。装飾が本文に溶け込みやすい</p>
  </section>

  <!-- B: アンダーライン -->
  <section class="pattern">
    <p class="pattern-label">B — アンダーライン</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -b">色相</span>
      と
      <span class="mark -b">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">単色のborder-bottomで下線を引く。本文になじみつつ語を際立たせる</p>
  </section>

  <!-- C: 薄背景バッジ -->
  <section class="pattern">
    <p class="pattern-label">C — 薄背景バッジ</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -c">色相</span>
      と
      <span class="mark -c">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">角丸＋薄い背景でバッジ風。行高への影響を抑えるため padding は最小限</p>
  </section>

  <!-- D: ハイライター -->
  <section class="pattern">
    <p class="pattern-label">D — ハイライター</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -d">色相</span>
      と
      <span class="mark -d">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">linear-gradientで下半分だけ背景色を乗せる蛍光ペン風。padding不要で行高を保てる</p>
  </section>

  <!-- E: グラデーション下線 -->
  <section class="pattern">
    <p class="pattern-label">E — グラデーション下線</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -e">色相</span>
      と
      <span class="mark -e">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">レインボーグラデーションのborder-bottomで色感を演出</p>
  </section>

  <!-- F: ネオングロー -->
  <section class="pattern">
    <p class="pattern-label">F — ネオングロー</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -f">色相</span>
      と
      <span class="mark -f">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">text-shadowで文字がほんのり光る。ダークモードとの相性が良い</p>
  </section>

  <!-- G: 角付き括弧 -->
  <section class="pattern">
    <p class="pattern-label">G — 角付き括弧 [ ]</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -g">色相</span>
      と
      <span class="mark -g">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">コード的な印象の [ ] で囲む。技術文書らしいニュアンス</p>
  </section>

  <!-- H: ボールド + アクセントカラー -->
  <section class="pattern">
    <p class="pattern-label">H — ボールド + アクセントカラー</p>
    <p class="body">
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      <br />
      PCCSでは、1つの色を
      <span class="mark -h">色相</span>
      と
      <span class="mark -h">トーン</span>
      によって表します。
    </p>
    <p class="pattern-note">装飾なし・太字＋色変更のみ。最もシンプルで本文との一体感を保てる</p>
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

  /* ===== 本文テキスト ===== */
  .body {
    color: #9898b8;
    font-size: 0.9rem;
    line-height: 2;
    margin: 0;
  }

  main.light .body {
    color: #556070;
  }

  /* ===== 共通 .mark リセット ===== */
  .mark {
    font-style: normal;
  }

  /* =====================
     A: 「」括弧 + 黄色文字（現行案）
  ===================== */
  .mark.-a {
    font-weight: 600;
    color: #ffd93d;
    line-height: 1;
  }

  .mark.-a::before {
    content: "「";
    color: rgba(255, 217, 61, 0.5);
  }

  .mark.-a::after {
    content: "」";
    color: rgba(255, 217, 61, 0.5);
  }

  main.light .mark.-a {
    color: #9a6200;
  }

  main.light .mark.-a::before,
  main.light .mark.-a::after {
    color: rgba(154, 98, 0, 0.45);
  }

  /* =====================
     B: アンダーライン
  ===================== */
  .mark.-b {
    font-weight: 600;
    color: #c8c8e8;
    border-bottom: 1.5px solid #6bcb77;
    padding-bottom: 1px;
  }

  main.light .mark.-b {
    color: #2a2a3a;
    border-bottom-color: #2f9e44;
  }

  /* =====================
     C: 薄背景バッジ
  ===================== */
  .mark.-c {
    font-weight: 600;
    color: #c8e8ff;
    background: rgba(77, 150, 255, 0.12);
    border: 1px solid rgba(77, 150, 255, 0.22);
    border-radius: 3px;
    padding: 1px 4px;
  }

  main.light .mark.-c {
    color: #1558a8;
    background: rgba(77, 150, 255, 0.09);
    border-color: rgba(77, 150, 255, 0.28);
  }

  /* =====================
     D: ハイライター
  ===================== */
  .mark.-d {
    font-weight: 600;
    color: #ffe8a0;
    background: linear-gradient(
      to bottom,
      transparent 50%,
      rgba(255, 217, 61, 0.22) 50%
    );
  }

  main.light .mark.-d {
    color: #7a4800;
    background: linear-gradient(
      to bottom,
      transparent 50%,
      rgba(255, 200, 0, 0.28) 50%
    );
  }

  /* =====================
     E: グラデーション下線
  ===================== */
  .mark.-e {
    font-weight: 600;
    color: #d0d0f0;
    padding-bottom: 2px;
    background:
      linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff) no-repeat
      bottom / 100% 1.5px;
  }

  main.light .mark.-e {
    color: #2a2a3a;
  }

  /* =====================
     F: ネオングロー
  ===================== */
  .mark.-f {
    font-weight: 600;
    color: #b8e0ff;
    text-shadow:
      0 0 6px rgba(77, 150, 255, 0.7),
      0 0 14px rgba(77, 150, 255, 0.35);
  }

  main.light .mark.-f {
    color: #1558a8;
    text-shadow: 0 0 6px rgba(77, 150, 255, 0.35);
  }

  /* =====================
     G: 角付き括弧 [ ]
  ===================== */
  .mark.-g {
    font-weight: 600;
    color: #a8c8a8;
  }

  .mark.-g::before {
    content: "[";
    color: rgba(107, 203, 119, 0.55);
    font-weight: 400;
    margin-right: 1px;
  }

  .mark.-g::after {
    content: "]";
    color: rgba(107, 203, 119, 0.55);
    font-weight: 400;
    margin-left: 1px;
  }

  main.light .mark.-g {
    color: #2a6e2a;
  }

  main.light .mark.-g::before,
  main.light .mark.-g::after {
    color: rgba(42, 110, 42, 0.45);
  }

  /* =====================
     H: ボールド + アクセントカラー
  ===================== */
  .mark.-h {
    font-weight: 700;
    color: #e8c8ff;
  }

  main.light .mark.-h {
    color: #6b23a8;
  }
</style>
