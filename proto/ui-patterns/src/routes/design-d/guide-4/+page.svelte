<script lang="ts">
  import { getContext } from "svelte"

  const theme = getContext<{ isLight: boolean; toggle: () => void }>("designD")

  const cardAccents = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff"]

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
    {#each [
      { title: "純色", body: "白も黒もグレイも混ざっていない純粋な色を「純色」といいます。PCCSではvトーンが純色で、色みが最もわかりやすいです。" },
      { title: "明清色", body: "純色に白を混ぜてできる色を「明清色」といいます。白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。" },
      { title: "暗清色", body: "純色に黒を混ぜてできる色を「暗清色」といいます。黒を多く混ぜていくにつれ、だんだんと明度が低く、彩度も低くなっていきます。" },
      { title: "中間色（濁色）", body: "純色に白と黒の両方（＝グレイ）を混ぜてできる色を「中間色」といいます。グレイを混ぜると濁った色になるため「濁色」とも呼ばれます。" },
      { title: "無彩色", body: "白、黒、グレイは「無彩色」と呼ばれ、色相や彩度はもたず、明度の高さだけで区別します。" },
    ] as card, i (card.title)}
      <div
        class="term-card -items-centering"
        style="--ac:{cardAccents[i % cardAccents.length]}"
      >
        <div class="card-header">
          <div class="card-dot"></div>
          <h3>{card.title}</h3>
        </div>
        <p>{card.body}</p>
        <div class="diagram-wrapper">
          <img src="https://placehold.jp/306x275.png" alt="ダミー画像" />
        </div>
      </div>
    {/each}
  </div>
</main>

<style>
  /* ===== カラーブロックスタイル ===== */
  main {
    max-width: 700px;
    margin: 2rem auto 0;
    padding: 0 1.25rem 5rem;
    transition: background 0.4s, color 0.4s;
  }

  /* ===== 見出し：ネオンカラー背景バー ===== */
  main h2 {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 2.75rem 0 1.25rem;
    color: #0c0c14;
    padding: 0.5rem 1rem;
    display: inline-block;
    background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    background-size: 200%;
    animation: hue-shift 8s linear infinite;
    border-radius: 2px;
    transition: color 0.4s;
  }

  @keyframes hue-shift {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  main h2:first-of-type {
    margin-block-start: 0;
  }

  main h3 {
    font-size: 0.92rem;
    font-weight: 700;
    margin: 0;
    color: var(--ac);
    transition: color 0.4s;
  }

  /* ===== 本文・リスト ===== */
  main p {
    color: #9090b0;
    margin: 0.65rem 0;
    font-size: 0.88rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main ul {
    margin: 0.65rem 0;
    padding-inline-start: 1.5rem;
    color: #9090b0;
    font-size: 0.88rem;
    line-height: 1.9;
    transition: color 0.4s;
  }

  main li {
    padding: 0.1rem 0;
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

  /* ===== .mark.-brackets：グロー強調 ===== */
  main .mark.-brackets {
    font-weight: 700;
    color: #ffd93d;
    text-shadow: 0 0 8px rgba(255, 217, 61, 0.4);
    transition: color 0.4s, text-shadow 0.4s;
  }

  main .mark.-brackets::before {
    content: "「";
    opacity: 0.5;
  }

  main .mark.-brackets::after {
    content: "」";
    opacity: 0.5;
  }

  /* ===== .tips / .example：カラーブロック ===== */
  main .tips,
  main .example {
    margin: 1.25rem 0;
    padding: 0.85rem 1.1rem;
    font-size: 0.88rem;
    line-height: 1.75;
    border-radius: 4px;
  }

  main .tips {
    background: rgba(255, 217, 61, 0.1);
    border: 1px solid rgba(255, 217, 61, 0.3);
  }

  main .tips::before {
    content: "💡 Tips: ";
    font-weight: 800;
    color: #ffd93d;
  }

  main .example {
    background: rgba(77, 150, 255, 0.08);
    border: 1px solid rgba(77, 150, 255, 0.3);
  }

  main .example::before {
    content: "▶ Example: ";
    font-weight: 800;
    color: #4d96ff;
  }

  main .tips > p,
  main .example > p {
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

  /* ===== .term-grid：2カラム ===== */
  main .term-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin: 1rem 0;
  }

  @media (max-width: 480px) {
    main .term-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ===== .term-card：アクセントカラー付きカード ===== */
  main .term-card {
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: border-color 0.2s, transform 0.15s, box-shadow 0.15s;
  }

  main .term-card:hover {
    border-color: var(--ac);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--ac) 20%, transparent);
  }

  main .term-card:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.9rem;
    background: color-mix(in srgb, var(--ac) 12%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--ac) 25%, transparent);
  }

  .card-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ac);
    box-shadow: 0 0 6px var(--ac);
    flex-shrink: 0;
  }

  main .term-card h3 {
    font-size: 0.88rem;
    font-weight: 700;
    margin: 0;
    color: var(--ac);
  }

  main .term-card p {
    font-size: 0.8rem;
    line-height: 1.75;
    margin: 0;
    color: #7878a0;
    padding: 0.75rem 0.9rem;
    flex: 1;
    transition: color 0.4s;
  }

  main .diagram-wrapper {
    padding: 0 0.9rem 0.75rem;
  }

  main .diagram-wrapper img {
    width: 100%;
    height: auto;
  }

  /* ===== ライトモード ===== */
  main.light h2 {
    color: #ffffff;
  }

  main.light p,
  main.light ul {
    color: #556070;
  }

  main.light code {
    color: #1d7a2a;
    background: rgba(29, 122, 42, 0.07);
    border-color: rgba(29, 122, 42, 0.18);
  }

  main.light .mark.-brackets {
    color: #9a6200;
    text-shadow: none;
  }

  main.light .tips {
    background: rgba(255, 200, 20, 0.07);
    border-color: rgba(180, 130, 0, 0.25);
  }

  main.light .example {
    background: rgba(25, 113, 194, 0.05);
    border-color: rgba(25, 113, 194, 0.22);
  }

  main.light .tips > p,
  main.light .example > p {
    color: #556070;
  }

  main.light img {
    opacity: 1;
  }

  main.light .term-card {
    border-color: rgba(0, 0, 0, 0.1);
  }

  main.light .term-card p {
    color: #556070;
  }

  main.light .card-header {
    background: color-mix(in srgb, var(--ac) 10%, #fff);
    border-bottom-color: color-mix(in srgb, var(--ac) 20%, transparent);
  }
</style>
