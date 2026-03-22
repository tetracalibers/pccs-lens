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
  /* ===== エディトリアルスタイル ===== */
  /* カウンターで h2 に自動番号を振る */
  main {
    counter-reset: section;
    max-width: 680px;
    margin: 2.5rem auto 0;
    padding: 0 1.5rem 5rem;
    transition: background 0.4s, color 0.4s;
  }

  /* ===== 見出し：番号付きエディトリアル ===== */
  main h2 {
    counter-increment: section;
    font-size: 1.5rem;
    font-weight: 800;
    margin: 3.5rem 0 1.25rem;
    color: #f0f0f0;
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    transition: color 0.4s;
  }

  main h2::before {
    content: counter(section, decimal-leading-zero);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #444;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    flex-shrink: 0;
    padding-top: 0.1em;
    transition: color 0.4s;
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

  /* ===== 本文・リスト ===== */
  main p {
    color: #9090b0;
    margin: 0.75rem 0;
    font-size: 0.9rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main ul {
    margin: 0.75rem 0 0.75rem 0;
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
    padding-left: 1.1rem;
    position: relative;
    transition: color 0.4s;
  }

  main li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: #444;
  }

  /* ===== コード ===== */
  main code {
    font-size: 0.88em;
    color: #6bcb77;
    background: rgba(107, 203, 119, 0.08);
    border-radius: 3px;
    padding: 1px 5px;
  }

  /* ===== .mark.-brackets：下線スタイル強調 ===== */
  main .mark.-brackets {
    font-weight: 700;
    color: #ffd93d;
    border-bottom: 1px solid rgba(255, 217, 61, 0.35);
    padding-bottom: 1px;
    transition: color 0.4s, border-color 0.4s;
  }

  /* ===== .tips / .example：左ボーダーCallout ===== */
  main .tips,
  main .example {
    margin: 1.5rem 0;
    padding: 0.75rem 1rem 0.75rem 1.25rem;
    font-size: 0.88rem;
    line-height: 1.75;
    border-left-width: 3px;
    border-left-style: solid;
    border-radius: 0 4px 4px 0;
  }

  main .tips {
    border-left-color: #ffd93d;
    background: rgba(255, 217, 61, 0.04);
  }

  main .tips::before {
    content: "Tips";
    display: block;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ffd93d;
    margin-bottom: 0.35rem;
  }

  main .example {
    border-left-color: #4d96ff;
    background: rgba(77, 150, 255, 0.04);
  }

  main .example::before {
    content: "Example";
    display: block;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4d96ff;
    margin-bottom: 0.35rem;
  }

  main .tips > p,
  main .example > p {
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
    opacity: 0.8;
    transition: opacity 0.4s;
  }

  /* ===== .term-grid：縦積みリスト ===== */
  main .term-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 1rem 0;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.4s;
  }

  /* ===== .term-card：横並びレイアウト ===== */
  main .term-card {
    display: grid;
    grid-template-columns: 7rem 1fr auto;
    align-items: start;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition: background 0.15s, border-color 0.4s;
  }

  main .term-card:last-child {
    border-bottom: none;
  }

  main .term-card:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  main .term-card h3 {
    font-size: 0.88rem;
    margin: 0;
    padding-top: 0.15rem;
    color: #e0e0f0;
  }

  main .term-card p {
    font-size: 0.82rem;
    line-height: 1.75;
    margin: 0;
    color: #7878a0;
    transition: color 0.4s;
  }

  main .term-card .diagram-wrapper {
    width: 80px;
    flex-shrink: 0;
  }

  main .term-card .diagram-wrapper img {
    width: 80px;
    height: auto;
    border-radius: 3px;
  }

  @media (max-width: 540px) {
    main .term-card {
      grid-template-columns: 1fr;
    }
    main .term-card .diagram-wrapper {
      display: none;
    }
  }

  /* ===== ライトモード ===== */
  main.light h2 {
    color: #1a1a1a;
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
    color: #1d7a2a;
    background: rgba(29, 122, 42, 0.07);
  }

  main.light .mark.-brackets {
    color: #9a6200;
    border-bottom-color: rgba(154, 98, 0, 0.3);
  }

  main.light .tips {
    border-left-color: #c9880a;
    background: rgba(255, 200, 20, 0.05);
  }

  main.light .tips::before {
    color: #9a6200;
  }

  main.light .example {
    border-left-color: #1971c2;
    background: rgba(25, 113, 194, 0.04);
  }

  main.light .example::before {
    color: #1971c2;
  }

  main.light .tips > p,
  main.light .example > p {
    color: #556070;
  }

  main.light img {
    opacity: 1;
  }

  main.light .term-grid {
    border-color: rgba(0, 0, 0, 0.1);
  }

  main.light .term-card {
    border-bottom-color: rgba(0, 0, 0, 0.07);
  }

  main.light .term-card:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  main.light .term-card h3 {
    color: #1a1a1a;
  }

  main.light .term-card p {
    color: #556070;
  }
</style>
