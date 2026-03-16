<script lang="ts">
  import { resolve } from "$app/paths"
  import ToneImageDiagram from "$lib/components/index/ToneImageDiagram.svelte"
  import ToneAreaDiagram from "$lib/components/index/ToneAreaDiagram.svelte"
</script>

<svelte:head>
  <title>PCCS Lens</title>
</svelte:head>

<main>
  <h1>PCCS Lens</h1>
  <p>色をPCCSというレンズを通して見る</p>
  <nav class="feature-nav">
    <a href={resolve("/approximate")} class="feature-card">
      <span class="feature-title">色のPCCS近似</span>
      <span class="feature-desc">入力した色に近いPCCS値と慣用色名を調べる</span>
    </a>
    <a href={resolve("/analyze")} class="feature-card">
      <span class="feature-title">配色の分析</span>
      <span class="feature-desc">配色をPCCSの色相・トーンに基づいて分析する</span>
    </a>
    <a href={resolve("/patterns")} class="feature-card">
      <span class="feature-title">配色シミュレータ</span>
      <span class="feature-desc">イメージに合う色の組み合わせを実験する</span>
    </a>
  </nav>

  <section class="pccs-guide">
    <h2>PCCSとは？</h2>

    <p>
      PCCSは、色のイメージや配色を考えるときに便利な色の表し方です。
      PCCSでは、1つの色を「色相」と「トーン」によって表します。（例：「v2」は、色相が2（赤）で、トーンがv（vivid）の色）
    </p>

    <ul>
      <li>色相：赤・黄・緑・青・紫など、どの色みをもたせるか</li>
      <li>トーン：どんなイメージをもたせるか</li>
    </ul>

    <p>
      PCCSのトーンは、色のイメージごとに明度・彩度の領域をまとめたものです。
      同じトーンであれば、色相が違っても、似たイメージを演出することができます。
    </p>

    <p class="tips">Tips：トーンにカーソルを合わせてイメージを確認してみよう</p>
    <div class="diagram-center">
      <ToneImageDiagram />
    </div>

    <p>
      たとえば、dトーンは明度が低めなのでやや暗く、彩度も中間くらいであまり鮮やかとはいえず、「くすんだ」というようなイメージになります。
    </p>

    <h2>色の分類</h2>

    <h3>純色</h3>
    <p>
      白も黒もグレイも混ざっていない純粋な色を「純色」といいます。
      vトーンは純色で、色みが最もわかりやすいです。
    </p>
    <div class="diagram-center">
      <ToneAreaDiagram highlights={["v"]} />
    </div>

    <h3>明清色</h3>
    <p>
      純色に白を混ぜてできる色を「明清色」といいます。
      白を多く混ぜていくにつれ、だんだんと明度が高く、彩度は低くなっていきます。
    </p>
    <div class="diagram-center">
      <ToneAreaDiagram highlights={["p", "lt", "b"]} />
    </div>

    <h3>暗清色</h3>
    <p>
      純色に黒を混ぜてできる色を「暗清色」といいます。
      黒を多く混ぜていくにつれ、だんだんと明度が低く、彩度も低くなっていきます。
    </p>
    <div class="diagram-center">
      <ToneAreaDiagram highlights={["dkg", "dk", "dp"]} />
    </div>

    <h3>中間色（濁色）</h3>
    <p>
      純色に白と黒の両方（＝グレイ）を混ぜてできる色を「中間色」といいます。
      グレイを混ぜると濁った色になるため、「濁色」とも呼ばれます。
    </p>
    <div class="diagram-center">
      <ToneAreaDiagram highlights={["ltg", "g", "sf", "d", "s"]} />
    </div>

    <h3>無彩色</h3>
    <p>白、黒、グレイは「無彩色」と呼ばれ、色相や彩度はもたず、明度の高さだけで区別します。</p>
    <div class="diagram-center">
      <ToneAreaDiagram highlights={["W", "Gy", "Bk"]} />
    </div>
  </section>
</main>

<style>
  main {
    max-width: 600px;
    margin: 3rem auto;
    padding: 0 1rem;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem;
  }

  p {
    color: var(--color-text-secondary, #555);
    margin: 0 0 2rem;
  }

  .feature-nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
  }

  .feature-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem 1.25rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s;
  }

  .feature-card:hover {
    border-color: var(--color-primary, #1a1a1a);
  }

  .feature-title {
    font-weight: 600;
    font-size: 1rem;
  }

  .feature-desc {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #555);
  }

  .pccs-guide {
    margin-top: 3rem;
    text-align: left;
  }

  .pccs-guide h2 {
    font-size: 1.25rem;
    margin: 2rem 0 0.5rem;
  }

  .pccs-guide h3 {
    font-size: 1rem;
    margin: 1.5rem 0 0.4rem;
  }

  .pccs-guide p {
    color: var(--color-text, #111);
    margin: 0.5rem 0;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  .pccs-guide ul {
    margin: 0.5rem 0 0.5rem 1.25rem;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  .tips {
    font-size: 0.8rem !important;
    color: var(--color-text-secondary, #555) !important;
    margin-top: 1rem !important;
  }

  .diagram-center {
    display: flex;
    justify-content: center;
    margin: 0.75rem 0;
  }
</style>
