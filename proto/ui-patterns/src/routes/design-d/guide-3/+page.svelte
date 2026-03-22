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
  /* ===== コンパクト・ドキュメントスタイル ===== */
  main {
    max-width: 760px;
    margin: 1.75rem auto 0;
    padding: 0 1.25rem 4rem;
    transition: background 0.4s, color 0.4s;
  }

  /* ===== 見出し：バッジ型 ===== */
  main h2 {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin: 2.25rem 0 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #666;
    transition: color 0.4s;
  }

  main h2::before {
    content: "";
    display: block;
    width: 18px;
    height: 2px;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d);
    flex-shrink: 0;
  }

  main h2::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    transition: background 0.4s;
  }

  main h2:first-of-type {
    margin-block-start: 0;
  }

  main h3 {
    font-size: 0.82rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
    color: #c0c0d8;
    transition: color 0.4s;
  }

  /* ===== 本文・リスト ===== */
  main p {
    color: #8888a8;
    margin: 0.5rem 0;
    font-size: 0.85rem;
    line-height: 1.85;
    transition: color 0.4s;
  }

  main ul {
    margin: 0.5rem 0;
    padding-inline-start: 1.5rem;
    color: #8888a8;
    font-size: 0.85rem;
    line-height: 1.85;
    transition: color 0.4s;
  }

  main li {
    padding: 0;
  }

  /* ===== コード ===== */
  main code {
    font-size: 0.85em;
    color: #6bcb77;
    background: rgba(107, 203, 119, 0.08);
    border: 1px solid rgba(107, 203, 119, 0.15);
    border-radius: 3px;
    padding: 0 4px;
  }

  /* ===== .mark.-brackets：小文字バッジ ===== */
  main .mark.-brackets {
    font-weight: 600;
    color: #ffd93d;
    font-size: 0.95em;
    transition: color 0.4s;
  }

  main .mark.-brackets::before {
    content: "「";
    opacity: 0.4;
  }

  main .mark.-brackets::after {
    content: "」";
    opacity: 0.4;
  }

  /* ===== .tips / .example：インラインバッジ型 ===== */
  main .tips,
  main .example {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin: 0.9rem 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.83rem;
    line-height: 1.7;
    border-radius: 3px;
  }

  main .tips {
    background: rgba(255, 217, 61, 0.05);
    border: 1px solid rgba(255, 217, 61, 0.15);
  }

  main .tips::before {
    content: "Tips";
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ffd93d;
    background: rgba(255, 217, 61, 0.15);
    padding: 1px 6px;
    border-radius: 2px;
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 0.15rem;
  }

  main .example {
    background: rgba(77, 150, 255, 0.04);
    border: 1px solid rgba(77, 150, 255, 0.15);
  }

  main .example::before {
    content: "Ex";
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #4d96ff;
    background: rgba(77, 150, 255, 0.15);
    padding: 1px 6px;
    border-radius: 2px;
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 0.15rem;
  }

  main .tips > p,
  main .example > p {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: #8080a0;
    transition: color 0.4s;
  }

  /* ===== 画像 ===== */
  main img {
    max-width: 100%;
    border-radius: 3px;
    opacity: 0.8;
    transition: opacity 0.4s;
  }

  /* ===== .term-grid：3カラムグリッド ===== */
  main .term-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
    margin: 0.9rem 0;
  }

  @media (max-width: 600px) {
    main .term-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    main .term-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ===== .term-card：コンパクトカード ===== */
  main .term-card {
    padding: 0.8rem 0.9rem;
    border-top: 2px solid rgba(255, 255, 255, 0.08);
    border-left: none;
    border-right: none;
    border-bottom: none;
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: background 0.15s, border-color 0.4s;
  }

  main .term-card:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  main .term-card h3 {
    font-size: 0.82rem;
    font-weight: 700;
    margin: 0;
    color: #d0d0e8;
  }

  main .term-card p {
    font-size: 0.76rem;
    line-height: 1.7;
    margin: 0;
    color: #6868a0;
    transition: color 0.4s;
  }

  /* 最後の1枚が奇数番目なら全幅 */
  main .term-card:last-child:nth-child(3n + 1) {
    grid-column: 1 / -1;
  }

  main .diagram-wrapper {
    display: none;
  }

  /* ===== ライトモード ===== */
  main.light h2 {
    color: #999;
  }

  main.light h2::after {
    background: rgba(0, 0, 0, 0.08);
  }

  main.light h3 {
    color: #2d2d3a;
  }

  main.light p,
  main.light ul {
    color: #556070;
  }

  main.light code {
    color: #1d7a2a;
    background: rgba(29, 122, 42, 0.07);
    border-color: rgba(29, 122, 42, 0.15);
  }

  main.light .mark.-brackets {
    color: #9a6200;
  }

  main.light .tips {
    background: rgba(255, 200, 20, 0.05);
    border-color: rgba(180, 130, 0, 0.2);
  }

  main.light .tips::before {
    color: #9a6200;
    background: rgba(255, 200, 20, 0.15);
  }

  main.light .example {
    background: rgba(25, 113, 194, 0.04);
    border-color: rgba(25, 113, 194, 0.2);
  }

  main.light .example::before {
    color: #1971c2;
    background: rgba(25, 113, 194, 0.12);
  }

  main.light .tips > p,
  main.light .example > p {
    color: #556070;
  }

  main.light img {
    opacity: 1;
  }

  main.light .term-card {
    border-top-color: rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.02);
  }

  main.light .term-card:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  main.light .term-card h3 {
    color: #1a1a1a;
  }

  main.light .term-card p {
    color: #556070;
  }
</style>
