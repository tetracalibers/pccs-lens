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
      <div class="diagram-wrapper s-exeuwhRWO5Ov">
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
      <div class="diagram-wrapper s-exeuwhRWO5Ov">
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
      <div class="diagram-wrapper s-exeuwhRWO5Ov">
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
      <div class="diagram-wrapper s-exeuwhRWO5Ov">
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
      <div class="diagram-wrapper s-exeuwhRWO5Ov">
        <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
      </div>
    </div>
  </div>
</main>

<style>
  /* ===== ページ全体 ===== */
  /* body の background/color は $effect で切り替え */

  main {
    transition:
      background 0.4s,
      color 0.4s;
    max-width: 700px;
    margin: 2.75rem auto 0;
    padding: 0 1rem 4rem;
  }

  /* ===== 見出し ===== */
  main h2 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 2.5rem 0 1.4rem;
    color: #f0f0f0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    position: relative;
  }

  /* h2 の下にレインボーのネオンライン */
  main h2::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 2.5em;
    height: 1px;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
  }

  main h2:first-of-type {
    margin-block-start: 0;
  }

  main h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 1.4rem 0 0.4rem;
    color: #c8c8e0;
  }

  /* ===== 本文・リスト ===== */
  main p {
    color: #9898b8;
    margin: 0.6rem 0;
    font-size: 0.9rem;
    line-height: 2;
  }

  main ul {
    margin: 0.9rem 0;
    font-size: 0.9rem;
    line-height: 2;
    padding-inline-start: 1.75rem;
    color: #9898b8;
  }

  main li {
    padding: 0;
  }

  /* ===== コード ===== */
  main code {
    font-size: 0.88em;
    color: #6bcb77;
    background: rgba(107, 203, 119, 0.1);
    border: 1px solid rgba(107, 203, 119, 0.2);
    border-radius: 3px;
    padding: 1px 5px;
  }

  /* ===== .mark.-brackets：「」で囲む強調語 ===== */
  main .mark.-brackets {
    font-weight: 600;
    color: #ffd93d;
    line-height: 1;
  }

  main .mark.-brackets::before {
    content: "「";
    color: rgba(255, 217, 61, 0.5);
  }

  main .mark.-brackets::after {
    content: "」";
    color: rgba(255, 217, 61, 0.5);
  }

  /* ===== .tips / .example：補足・例示ブロック ===== */
  main .tips,
  main .example {
    margin: 1.1rem 0;
    padding: 0.6rem 0.85rem;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.88rem;
    line-height: 1.7;
    backdrop-filter: blur(4px);
  }

  /* Tips: 琥珀色ネオン枠 */
  main .tips {
    border: 1px solid rgba(255, 217, 61, 0.25);
    background: rgba(255, 217, 61, 0.04);
  }

  main .tips::before {
    content: "Tips: ";
    color: #ffd93d;
    font-weight: 700;
    opacity: 0.8;
  }

  /* Example: 青ネオン枠 */
  main .example {
    border: 1px solid rgba(77, 150, 255, 0.3);
    background: rgba(77, 150, 255, 0.05);
  }

  main .example::before {
    content: "Example: ";
    color: #4d96ff;
    font-weight: 700;
    opacity: 0.8;
  }

  /* .tips/.example 内の p は inline でラベルに続けて流す */
  main .tips > p,
  main .example > p {
    display: inline;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: #8888a8;
  }

  /* ===== 画像 ===== */
  main img {
    max-width: 100%;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    opacity: 0.85;
  }

  /* ===== .term-grid：用語カードのグリッド ===== */
  main .term-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin: 1.1rem 0;
  }

  /* 最後の1枚が奇数番目なら全幅 */
  main .term-card:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }

  /* ===== .term-card：グラスモーフィズムのカード ===== */
  main .term-card {
    padding: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(8px);
    display: grid;
    gap: 0.7rem;
  }

  main .term-card h3 {
    font-size: 0.95rem;
    margin: 0;
    color: #e0e0f0;
  }

  main .term-card p {
    font-size: 0.83rem;
    line-height: 1.8;
    margin: 0;
    color: #8080a0;
  }

  /* ===== .-items-centering：カード内コンテンツを中央揃え ===== */
  main .term-card.-items-centering {
    justify-items: center;
    text-align: center;
  }

  main .term-card.-items-centering :is(p, h3) {
    justify-self: flex-start;
    text-align: left;
  }

  /* ===== ライトモード ===== */
  main.light h2 {
    color: #1a1a1a;
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }

  main.light h3 {
    color: #2d2d3a;
  }

  main.light p {
    color: #556070;
  }

  main.light ul {
    color: #556070;
  }

  main.light code {
    color: #1d7a2a;
    background: rgba(29, 122, 42, 0.08);
    border-color: rgba(29, 122, 42, 0.2);
  }

  main.light .mark.-brackets {
    color: #9a6200;
  }

  main.light .mark.-brackets::before,
  main.light .mark.-brackets::after {
    color: rgba(154, 98, 0, 0.45);
  }

  main.light .tips {
    border-color: rgba(180, 130, 0, 0.3);
    background: rgba(255, 217, 61, 0.06);
  }

  main.light .tips::before {
    color: #9a6200;
  }

  main.light .example {
    border-color: rgba(29, 113, 194, 0.3);
    background: rgba(77, 150, 255, 0.05);
  }

  main.light .example::before {
    color: #1971c2;
  }

  main.light .tips > p,
  main.light .example > p {
    color: #556070;
  }

  main.light img {
    border-color: rgba(0, 0, 0, 0.08);
    opacity: 1;
  }

  main.light .term-card {
    border-color: rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: none;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }

  main.light .term-card h3 {
    color: #1a1a1a;
  }

  main.light .term-card p {
    color: #556070;
  }
</style>
