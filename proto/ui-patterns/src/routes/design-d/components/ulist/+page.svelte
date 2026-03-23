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
    { id: "a", label: "A — ダッシュ（—）", note: "エムダッシュを絶対配置で左端に置く。シンプルで読みやすく、本文との調和が高い" },
    { id: "b", label: "B — グロウドット", note: "紫のグロー（box-shadow）付きの丸ドット。ネオン世界観と調和し、アクセントとして目を引く" },
    { id: "c", label: "C — シェブロン（›）", note: "›（シェブロン）をアクセントカラーで表示。矢印的なニュアンスで「次へ進む」感を演出" },
    { id: "d", label: "D — アクセントバー", note: "左ボーダーラインを各 li に引く。バレット文字なしで静かに区切り、コンテンツを際立たせる" },
    { id: "e", label: "E — ゼロパディング番号", note: "01 / 02 形式の番号をアクセントカラーで前置。順序の意識がうまれ、手順系コンテンツにも転用できる" },
    { id: "f", label: "F — ダイヤモンド（◆）", note: "小さなダイヤモンド形をバレットに。ダッシュより装飾性があり、用語解説のような改まった文脈に馴染む" },
    { id: "g", label: "G — カラースクエア", note: "塗りつぶし正方形をバレットに。ドットより幾何学的で、グリッドレイアウトと相性がよい" },
    { id: "h", label: "H — アンダーライン区切り", note: "バレットを持たず、各 li の下辺を薄いラインで区切る。最もテキスト優先なスタイル" },
  ]
</script>

<svelte:head>
  <title>リスト - 案D</title>
</svelte:head>

<main class:light={theme.isLight}>
  <p class="page-title">ul リスト デザイン案</p>

  {#each patterns as p}
    <section class="pattern">
      <p class="pattern-label">{p.label}</p>
      <div class="preview">
        <p>
          PCCSでは、1つの色を
          <span class="mark -brackets">色相</span>
          と
          <span class="mark -brackets">トーン</span>
          によって表します。
        </p>
        <ul class="ul-{p.id}">
          <li>
            <span class="mark -brackets">色相</span>
            … 赤・黄・緑・青・紫など、どの色みをもたせるか
          </li>
          <li>
            <span class="mark -brackets">トーン</span>
            … どんなイメージをもたせるか
          </li>
        </ul>
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
    margin: 0.75rem 0 0;
    line-height: 1.6;
  }

  main.light .pattern-note {
    color: #8888aa;
  }

  /* ===== プレビュー p ===== */
  .preview p {
    color: #9090b0;
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main.light .preview p {
    color: #556070;
  }

  /* ===== .mark.-brackets（guide-2 からコピー）===== */
  .mark.-brackets {
    font-weight: 700;
    color: #c4b5fd;
    background: rgba(196, 181, 253, 0.15);
    border-radius: 999px;
    padding: 0.1em 0.65em;
    display: inline-block;
    transition: color 0.4s, background 0.4s;
  }

  main.light .mark.-brackets {
    color: #6d28d9;
    background: rgba(109, 40, 217, 0.1);
  }

  /* ===== ul 共通ベース ===== */
  .preview ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .preview li {
    font-size: 0.9rem;
    color: #9090b0;
    line-height: 1.7;
    position: relative;
    transition: color 0.4s;
  }

  main.light .preview li {
    color: #556070;
  }

  /* =====================
     A: ダッシュ（—）
     - エムダッシュを絶対配置で左端に配置
  ===================== */
  .preview .ul-a li {
    padding-left: 1.4rem;
  }

  .preview .ul-a li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: #555570;
    transition: color 0.4s;
  }

  main.light .preview .ul-a li::before {
    color: #b0b8c0;
  }

  /* =====================
     B: グロウドット
     - 紫のグロー付き丸ドット（pseudo-element）
  ===================== */
  .preview .ul-b li {
    padding-left: 1.4rem;
  }

  .preview .ul-b li::before {
    content: "";
    position: absolute;
    left: 0.22rem;
    top: 0.55em;
    width: 0.44em;
    height: 0.44em;
    border-radius: 50%;
    background: #c4b5fd;
    box-shadow: 0 0 7px rgba(196, 181, 253, 0.7);
    transition: background 0.4s, box-shadow 0.4s;
  }

  main.light .preview .ul-b li::before {
    background: #6d28d9;
    box-shadow: 0 0 5px rgba(109, 40, 217, 0.35);
  }

  /* =====================
     C: シェブロン（›）
     - ›記号をアクセントカラーで左端に
  ===================== */
  .preview .ul-c li {
    padding-left: 1.2rem;
  }

  .preview .ul-c li::before {
    content: "›";
    position: absolute;
    left: 0;
    color: #c4b5fd;
    font-size: 1.2em;
    line-height: 1.4;
    font-weight: 700;
    transition: color 0.4s;
  }

  main.light .preview .ul-c li::before {
    color: #6d28d9;
  }

  /* =====================
     D: アクセントバー
     - 各 li の左辺にボーダーライン、バレット文字なし
  ===================== */
  .preview .ul-d {
    gap: 0.5rem;
  }

  .preview .ul-d li {
    padding-left: 0.85rem;
    border-left: 2px solid rgba(196, 181, 253, 0.45);
    transition: color 0.4s, border-color 0.4s;
  }

  .preview .ul-d li::before {
    display: none;
  }

  main.light .preview .ul-d li {
    border-left-color: rgba(109, 40, 217, 0.3);
  }

  /* =====================
     E: ゼロパディング番号
     - CSS counter で 01 / 02 形式の番号を前置
  ===================== */
  .preview .ul-e {
    counter-reset: ul-num;
    gap: 0.5rem;
  }

  .preview .ul-e li {
    counter-increment: ul-num;
    padding-left: 2.2rem;
  }

  .preview .ul-e li::before {
    content: counter(ul-num, decimal-leading-zero);
    position: absolute;
    left: 0;
    font-size: 0.72em;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #c4b5fd;
    top: 0.2em;
    transition: color 0.4s;
  }

  main.light .preview .ul-e li::before {
    color: #6d28d9;
  }

  /* =====================
     F: ダイヤモンド（◆）
     - 小さなダイヤモンド形のバレット
  ===================== */
  .preview .ul-f li {
    padding-left: 1.4rem;
  }

  .preview .ul-f li::before {
    content: "◆";
    position: absolute;
    left: 0.05rem;
    top: 0;
    color: #c4b5fd;
    font-size: 0.5em;
    line-height: 3.4;
    transition: color 0.4s;
  }

  main.light .preview .ul-f li::before {
    color: #6d28d9;
  }

  /* =====================
     G: カラースクエア
     - 塗りつぶし正方形の pseudo-element バレット
  ===================== */
  .preview .ul-g li {
    padding-left: 1.4rem;
  }

  .preview .ul-g li::before {
    content: "";
    position: absolute;
    left: 0.15rem;
    top: 0.54em;
    width: 0.42em;
    height: 0.42em;
    background: #c4b5fd;
    border-radius: 2px;
    transition: background 0.4s;
  }

  main.light .preview .ul-g li::before {
    background: #6d28d9;
    opacity: 0.65;
  }

  /* =====================
     H: アンダーライン区切り
     - バレットなし、li 下辺を薄いラインで区切る
  ===================== */
  .preview .ul-h {
    gap: 0;
  }

  .preview .ul-h li {
    padding: 0.55rem 0 0.55rem 0.5rem;
    border-bottom: 1px solid rgba(196, 181, 253, 0.15);
    transition: color 0.4s, border-color 0.4s;
  }

  .preview .ul-h li:last-child {
    border-bottom: none;
  }

  .preview .ul-h li::before {
    display: none;
  }

  main.light .preview .ul-h li {
    border-bottom-color: rgba(109, 40, 217, 0.12);
  }
</style>
