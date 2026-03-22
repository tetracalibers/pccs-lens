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
  <h2>PCCSとは？</h2>
  <p>
    PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
    <br />
    PCCSでは、1つの色を
    <span class="mark -brackets">色相</span>
    と
    <span class="mark -brackets">トーン</span>
    によって表します。
  </p>
  <ul>
    <li>
      <span class="mark -brackets">色相</span>
      … 赤・黄・緑・青・紫など、どの色みをもたせるか
    </li>
    <li>
      <span class="mark -brackets">トーン</span>
      … どんなイメージをもたせるか
    </li>
  </ul>
  <div class="example">
    <p>
      色相が
      <code>2</code>
      （赤）で、トーンが
      <code>v</code>
      （vivid）の色は
      <span class="mark -brackets"><code>v2</code></span>
      と表す
    </p>
  </div>
  <p>
    PCCSのトーンは、色のイメージごとに明度・彩度の領域をまとめたものです。
    <br />
    同じトーンであれば、色相が違っても、似たイメージを演出することができます。
  </p>
  <div class="tips"><p>トーンをクリックしてイメージを確認してみよう</p></div>
  <div>
    <img src="https://placehold.jp/700x500.png" alt="ダミー画像" />
  </div>
  <p>
    たとえば、dトーンは明度が低めなのでやや暗く、彩度も中間くらいであまり鮮やかとはいえず、「くすんだ」といったイメージになります。
  </p>
  <p>PCCSでは、トーンを調整することで、色のイメージを調整することができます。</p>
  <h2>色の分類とトーンの位置関係</h2>
  <div class="term-grid">
    <div class="term-card -items-centering">
      <h3>純色</h3>
      <p>
        白も黒もグレイも混ざっていない純粋な色を
        <span class="mark -brackets">純色</span>
        といいます。PCCSではvトーンが純色で、色みが最もわかりやすいです。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <div class="term-card -items-centering">
      <h3>明清色</h3>
      <p>
        純色に白を混ぜてできる色を
        <span class="mark -brackets">明清色</span>
        といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <div class="term-card -items-centering">
      <h3>暗清色</h3>
      <p>
        純色に黒を混ぜてできる色を
        <span class="mark -brackets">暗清色</span>
        といいます。黒を多く混ぜていくにつれ、だんだんと明度が低く、彩度も低くなっていきます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <div class="term-card -items-centering">
      <h3>中間色（濁色）</h3>
      <p>
        純色に白と黒の両方（＝グレイ）を混ぜてできる色を
        <span class="mark -brackets">中間色</span>
        といいます。グレイを混ぜると濁った色になるため、
        <span class="mark -brackets">濁色</span>
        とも呼ばれます。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
    <div class="term-card -items-centering">
      <h3>無彩色</h3>
      <p>
        白、黒、グレイは
        <span class="mark -brackets">無彩色</span>
        と呼ばれ、色相や彩度はもたず、明度の高さだけで区別します。
      </p>
      <div class="diagram-wrapper">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
  </div>
</main>

<style>
  /* ===== エディトリアルスタイル（番号付き見出し） ===== */
  main {
    counter-reset: section;
    max-width: 680px;
    margin: 2.5rem auto 0;
    padding: 0 1.5rem 5rem;
    transition: background 0.4s, color 0.4s;
  }

  /* ===== 見出し：大きな番号 + エディトリアル ===== */
  main h2 {
    counter-increment: section;
    font-size: 2.2rem;
    font-weight: 900;
    margin: 3.5rem 0 1.25rem;
    color: #dde8f0;
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    transition: color 0.4s;
  }

  main h2::before {
    content: counter(section, decimal-leading-zero);
    font-size: 3.5rem;
    font-weight: 900;
    line-height: 1;
    color: #c4b5fd;
    opacity: 0.8;
    flex-shrink: 0;
    margin-right: 0.1em;
  }

  main h2:first-of-type {
    margin-block-start: 0;
  }

  main h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: #d0d0e8;
    transition: color 0.4s;
  }

  /* ===== 本文・ダッシュリスト ===== */
  main p {
    color: #9090b0;
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main ul {
    margin: 0.75rem 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  main li {
    font-size: 0.9rem;
    color: #9090b0;
    line-height: 1.7;
    padding-left: 1.4rem;
    position: relative;
    transition: color 0.4s;
  }

  main li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: #555570;
  }

  /* ===== コード：パステルアンバー ===== */
  main code {
    font-size: 0.88em;
    color: #fcd34d;
    background: rgba(252, 211, 77, 0.1);
    border: 1px solid rgba(252, 211, 77, 0.2);
    border-radius: 3px;
    padding: 1px 5px;
  }

  /* ===== .mark.-brackets：ラベンダーpill ===== */
  main .mark.-brackets {
    font-weight: 700;
    color: #c4b5fd;
    background: rgba(196, 181, 253, 0.15);
    border-radius: 999px;
    padding: 0.1em 0.65em;
    display: inline-block;
    transition: color 0.4s, background 0.4s;
  }

  /* ===== .example：パステルサーモン トップボーダー ===== */
  main .example {
    margin: 1.5rem 0;
    padding: 0.85rem 1.1rem;
    font-size: 0.88rem;
    line-height: 1.75;
    border-top: 3px solid #fda4af;
    background: rgba(253, 164, 175, 0.08);
    border-radius: 0 0 6px 6px;
  }

  main .example::before {
    content: "Example";
    display: block;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fda4af;
    margin-bottom: 0.4rem;
  }

  main .example > p {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: #9090b0;
    transition: color 0.4s;
  }

  /* ===== .tips：パステルシアン トップボーダー ===== */
  main .tips {
    margin: 1.5rem 0;
    padding: 0.85rem 1.1rem;
    font-size: 0.88rem;
    line-height: 1.75;
    border-top: 3px solid #67e8f9;
    background: rgba(103, 232, 249, 0.08);
    border-radius: 0 0 6px 6px;
  }

  main .tips::before {
    content: "Tips";
    display: block;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #67e8f9;
    margin-bottom: 0.4rem;
  }

  main .tips > p {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: #9090b0;
    transition: color 0.4s;
  }

  /* ===== 画像 ===== */
  main img {
    max-width: 100%;
    border-radius: 4px;
    opacity: 0.85;
    transition: opacity 0.4s;
  }

  /* ===== .term-grid ===== */
  main .term-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }

  /* ===== .term-card ===== */
  main .term-card {
    display: grid;
    gap: 0.7rem;
    padding: 1rem 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    transition: background 0.15s, border-color 0.2s;
  }

  main .term-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(196, 181, 253, 0.3);
  }

  main .term-card h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: #e0e0f0;
    transition: color 0.4s;
  }

  main .term-card p {
    font-size: 0.85rem;
    line-height: 1.75;
    margin: 0;
    color: #7878a0;
    transition: color 0.4s;
  }

  main .diagram-wrapper img {
    width: 100%;
    height: auto;
    border-radius: 3px;
    opacity: 1;
  }

  /* ===== ライトモード ===== */
  main.light h2 {
    color: #1a1a1a;
  }

  main.light h2::before {
    color: #7c3aed;
    opacity: 1;
  }

  main.light h3 {
    color: #2d2d3a;
  }

  main.light p,
  main.light li {
    color: #556070;
  }

  main.light li::before {
    color: #b0b8c0;
  }

  main.light code {
    color: #d97706;
    background: rgba(217, 119, 6, 0.08);
    border-color: rgba(217, 119, 6, 0.2);
  }

  main.light .mark.-brackets {
    color: #6d28d9;
    background: rgba(109, 40, 217, 0.1);
  }

  main.light .example {
    border-top-color: #f43f5e;
    background: rgba(244, 63, 94, 0.05);
  }

  main.light .example::before {
    color: #f43f5e;
  }

  main.light .example > p {
    color: #556070;
  }

  main.light .tips {
    border-top-color: #0891b2;
    background: rgba(8, 145, 178, 0.05);
  }

  main.light .tips::before {
    color: #0891b2;
  }

  main.light .tips > p {
    color: #556070;
  }

  main.light img {
    opacity: 1;
  }

  main.light .term-card {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.01);
  }

  main.light .term-card:hover {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(109, 40, 217, 0.25);
  }

  main.light .term-card h3 {
    color: #1a1a1a;
  }

  main.light .term-card p {
    color: #556070;
  }
</style>
