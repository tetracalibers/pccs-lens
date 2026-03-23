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
  /* ===== グラデーションタイポグラフィスタイル（静的） ===== */
  main {
    max-width: 760px;
    margin: 1.75rem auto 0;
    padding: 0 1.25rem 4rem;
    transition:
      background 0.4s,
      color 0.4s;
  }

  /* ===== 見出し：パステル虹グラデーションテキスト + 区切り線 ===== */
  main h2 {
    font-size: 2rem;
    font-weight: 900;
    margin: 2.75rem 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(90deg, #a5f3fc, #c4b5fd, #fbcfe8, #bef264);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: opacity 0.4s;
  }

  main h2::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(165, 243, 252, 0.3), transparent);
    -webkit-text-fill-color: initial;
    transition: background 0.4s;
  }

  main h2:first-of-type {
    margin-block-start: 0;
  }

  main h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
    color: #c0c0d8;
    transition: color 0.4s;
  }

  /* ===== 本文・リスト ===== */
  main p {
    color: #8888a8;
    margin: 0.6rem 0;
    font-size: 0.88rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main ul {
    margin: 0.6rem 0;
    padding-inline-start: 1.5rem;
    color: #8888a8;
    font-size: 0.88rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main li {
    padding: 0.1rem 0;
  }

  /* ===== コード：パステルミント ===== */
  main code {
    font-size: 0.85em;
    color: #6ee7b7;
    background: rgba(110, 231, 183, 0.1);
    border: 1px solid rgba(110, 231, 183, 0.2);
    border-radius: 3px;
    padding: 0 4px;
  }

  /* ===== .mark.-brackets：ピーチアンダーライン ===== */
  main .mark.-brackets {
    font-weight: 700;
    color: #fdba74;
    border-bottom: 2px solid rgba(253, 186, 116, 0.7);
    padding-bottom: 1px;
    transition:
      color 0.4s,
      border-color 0.4s;
  }

  /* ===== .example：丸みのあるピーチカード ===== */
  main .example {
    margin: 1.25rem 0;
    padding: 0.85rem 1rem;
    font-size: 0.88rem;
    line-height: 1.75;
    border: 1px solid rgba(253, 186, 116, 0.25);
    background: rgba(253, 186, 116, 0.08);
    border-radius: 8px;
  }

  main .example::before {
    content: "Example";
    display: block;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #fdba74;
    margin-bottom: 0.4rem;
  }

  main .example > p {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: #8888a8;
    transition: color 0.4s;
  }

  /* ===== .tips：丸みのあるラベンダーカード ===== */
  main .tips {
    margin: 1.25rem 0;
    padding: 0.85rem 1rem;
    font-size: 0.88rem;
    line-height: 1.75;
    border: 1px solid rgba(196, 181, 253, 0.25);
    background: rgba(196, 181, 253, 0.08);
    border-radius: 8px;
  }

  main .tips::before {
    content: "Tips";
    display: block;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #c4b5fd;
    margin-bottom: 0.4rem;
  }

  main .tips > p {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: #8888a8;
    transition: color 0.4s;
  }

  /* ===== 画像 ===== */
  main img {
    max-width: 100%;
    border-radius: 3px;
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
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.02);
    transition:
      background 0.15s,
      border-color 0.2s;
  }

  main .term-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(165, 243, 252, 0.3);
  }

  main .term-card h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    color: #d0d0e8;
    transition: color 0.4s;
  }

  main .term-card p {
    font-size: 0.82rem;
    line-height: 1.75;
    margin: 0;
    color: #6868a0;
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
    opacity: 0.85;
  }

  main.light h2::after {
    background: linear-gradient(90deg, rgba(8, 145, 178, 0.25), transparent);
  }

  main.light h3 {
    color: #2d2d3a;
  }

  main.light p,
  main.light ul {
    color: #556070;
  }

  main.light code {
    color: #059669;
    background: rgba(5, 150, 105, 0.07);
    border-color: rgba(5, 150, 105, 0.18);
  }

  main.light .mark.-brackets {
    color: #ea580c;
    border-bottom-color: rgba(234, 88, 12, 0.6);
  }

  main.light .example {
    border-color: rgba(251, 146, 60, 0.35);
    background: rgba(253, 186, 116, 0.12);
  }

  main.light .example::before {
    color: #ea580c;
  }

  main.light .example > p {
    color: #556070;
  }

  main.light .tips {
    border-color: rgba(139, 92, 246, 0.25);
    background: rgba(196, 181, 253, 0.12);
  }

  main.light .tips::before {
    color: #7c3aed;
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
    border-color: rgba(8, 145, 178, 0.25);
  }

  main.light .term-card h3 {
    color: #1a1a1a;
  }

  main.light .term-card p {
    color: #556070;
  }
</style>
