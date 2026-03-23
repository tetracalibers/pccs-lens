<script lang="ts">
  import { resolve } from "$app/paths"
</script>

<svelte:head>
  <title>PCCS Lens - UIプロトタイプ一覧</title>
</svelte:head>

<main>
  <header>
    <h1>PCCS Lens トップページ デザイン案</h1>
    <p>デザイン案を比較・検討してください</p>
  </header>

  <div class="design-list">
    <a href={resolve("/design-a")} class="design-card">
      <div class="preview preview-a">
        <div class="rainbow-bar"></div>
        <div class="preview-content">
          <div class="preview-title">PCCS Lens</div>
          <div class="preview-cards">
            <div class="pc pc-learn"></div>
            <div class="pc pc-tool"></div>
            <div class="pc pc-tool"></div>
            <div class="pc pc-tool"></div>
          </div>
        </div>
      </div>
      <div class="design-info">
        <span class="label">案A</span>
        <h2>王道デザイン</h2>
        <p>レインボーヘッダー＋セクション分けのクリーンなレイアウト</p>
      </div>
    </a>

    <a href={resolve("/design-b")} class="design-card">
      <div class="preview preview-b">
        <div class="wheel-preview">
          <svg viewBox="0 0 100 100" width="80" height="80">
            {#each Array(12) as _, i (i)}
              {@const angle = (i * 30 - 90) * (Math.PI / 180)}
              {@const x1 = 50 + 18 * Math.cos(angle)}
              {@const y1 = 50 + 18 * Math.sin(angle)}
              {@const x2 = 50 + 40 * Math.cos(angle)}
              {@const y2 = 50 + 40 * Math.sin(angle)}
              <line
                {x1}
                {y1}
                {x2}
                {y2}
                stroke={`hsl(${i * 30}, 80%, 55%)`}
                stroke-width="8"
                stroke-linecap="round"
              />
            {/each}
            <circle cx="50" cy="50" r="14" fill="white" />
          </svg>
        </div>
        <div class="preview-title-b">PCCS Lens</div>
      </div>
      <div class="design-info">
        <span class="label">案B</span>
        <h2>色相環ビジュアル</h2>
        <p>PCCSの色相環をメインビジュアルとした、色のアイデンティティを前面に出したデザイン</p>
      </div>
    </a>

    <a href={resolve("/design-c")} class="design-card">
      <div class="preview preview-c">
        <div class="swatches">
          {#each ["#e03131", "#f76707", "#f59f00", "#2f9e44", "#1971c2", "#6741d9", "#c2255c"] as color, i (color)}
            <div
              class="swatch"
              style="background:{color}; transform: rotate({(i - 3) * 4}deg) translateY({Math.abs(
                i - 3
              ) * 2}px)"
            ></div>
          {/each}
        </div>
        <div class="preview-title-c">PCCS Lens</div>
      </div>
      <div class="design-info">
        <span class="label">案C</span>
        <h2>ペイントスウォッチ</h2>
        <p>絵の具のカラーチップを広げたような、遊び心あふれるコラージュデザイン</p>
      </div>
    </a>

    <a href={resolve("/design-d")} class="design-card">
      <div class="preview preview-d">
        <div class="neon-title">
          PCCS
          <br />
          <span>Lens</span>
        </div>
        <div class="neon-dots">
          {#each ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff"] as color (color)}
            <div class="ndot" style="background:{color}; box-shadow: 0 0 8px {color}"></div>
          {/each}
        </div>
      </div>
      <div class="design-info">
        <span class="label">案D</span>
        <h2>ネオン・ダーク</h2>
        <p>ダーク背景にネオングローで彩る、モダンでインパクトのあるデザイン</p>
      </div>
    </a>

    <a href={resolve("/design-e")} class="design-card">
      <div class="preview preview-e">
        <div class="pastel-bar-e"></div>
        <div class="preview-inner-e">
          <div class="preview-title-e">PCCS Lens</div>
          <div class="pastel-dots-e">
            {#each ["#d4aaff", "#ffb3c6", "#ffd6a5", "#b8f0b8", "#a0c4ff", "#ffffa3"] as c (c)}
              <div class="pdot" style="background:{c}"></div>
            {/each}
          </div>
        </div>
      </div>
      <div class="design-info">
        <span class="label">案E</span>
        <h2>ソフトパステル</h2>
        <p>ラベンダーを基調にパステルカラーで彩る、やわらかく上品なデザイン</p>
      </div>
    </a>

    <a href={resolve("/design-f")} class="design-card">
      <div class="preview preview-f">
        <div class="preview-hero-f">
          <div class="pf-swatches">
            {#each ["#d4aaff", "#ffb3c6", "#ffd6a5", "#b8f0b8", "#a0c4ff"] as c (c)}
              <div class="pf-swatch" style="background:{c}"></div>
            {/each}
          </div>
          <div class="preview-title-f">PCCS Lens</div>
        </div>
      </div>
      <div class="design-info">
        <span class="label">案F</span>
        <h2>カラーパネル</h2>
        <p>パステルグラデーションのヒーローに2カラムレイアウトを組み合わせた、構造的なデザイン</p>
      </div>
    </a>

    <a href={resolve("/design-g")} class="design-card">
      <div class="preview preview-g">
        <div class="blob-g blob-g1"></div>
        <div class="blob-g blob-g2"></div>
        <div class="blob-g blob-g3"></div>
        <div class="preview-title-g">PCCS Lens</div>
      </div>
      <div class="design-info">
        <span class="label">案G</span>
        <h2>水彩画</h2>
        <p>半透明のカラーブロブが滲む水彩タッチ。白背景にやわらかな色が広がるデザイン</p>
      </div>
    </a>

    <a href={resolve("/design-h")} class="design-card">
      <div class="preview preview-h">
        <div class="drip-bar-h">
          {#each ["#e63946", "#f4a261", "#e9c46a", "#06d6a0", "#118ab2", "#9b5de5"] as c (c)}
            <div class="dcol-h" style="background:{c}"></div>
          {/each}
        </div>
        <div class="preview-title-h">
          <span>PCCS</span>
          <span class="h-lens">Lens</span>
        </div>
        <div class="swatch-row-h">
          {#each ["#e63946", "#f4a261", "#e9c46a", "#06d6a0", "#118ab2", "#9b5de5", "#c77dff"] as c (c)}
            <div class="sh" style="background:{c}"></div>
          {/each}
        </div>
      </div>
      <div class="design-info">
        <span class="label">案H</span>
        <h2>ペンキ</h2>
        <p>ペンキの滴りとベタ塗りの配色バーが特徴的な、太く力強いグラフィックデザイン</p>
      </div>
    </a>
  </div>
</main>

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    font-family: system-ui, sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  header h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
  }

  header p {
    color: #666;
    margin: 0;
  }

  .design-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 600px) {
    .design-list {
      grid-template-columns: 1fr;
    }
  }

  .design-card {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    transition:
      box-shadow 0.2s,
      transform 0.2s;
  }

  .design-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .preview {
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Preview A */
  .preview-a {
    background: #fff;
    border-bottom: 1px solid #eee;
  }

  .rainbow-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(
      90deg,
      #e03131,
      #f76707,
      #f59f00,
      #2f9e44,
      #1971c2,
      #6741d9,
      #c2255c
    );
  }

  .preview-content {
    text-align: center;
  }

  .preview-title {
    font-weight: 700;
    font-size: 1.2rem;
    margin-bottom: 12px;
    letter-spacing: 0.05em;
  }

  .preview-cards {
    display: flex;
    gap: 6px;
  }

  .pc {
    height: 36px;
    border-radius: 4px;
  }

  .pc-learn {
    width: 80px;
    background: linear-gradient(135deg, #fff3cd, #ffe066);
    border: 1px solid #fcc419;
  }

  .pc-tool {
    width: 52px;
    background: #f1f3f5;
    border: 1px solid #dee2e6;
  }

  /* Preview B */
  .preview-b {
    background: #fafafa;
    border-bottom: 1px solid #eee;
    flex-direction: column;
    gap: 8px;
  }

  .wheel-preview {
    line-height: 0;
  }

  .preview-title-b {
    font-weight: 700;
    font-size: 1rem;
    color: #333;
    letter-spacing: 0.08em;
  }

  /* Preview C */
  .preview-c {
    background: #f8f4f0;
    border-bottom: 1px solid #eee;
    position: relative;
  }

  .swatches {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    margin-bottom: 8px;
  }

  .swatch {
    width: 28px;
    height: 60px;
    border-radius: 4px 4px 2px 2px;
    box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  }

  .preview-title-c {
    font-weight: 800;
    font-size: 1rem;
    color: #333;
    letter-spacing: 0.05em;
  }

  /* Preview D */
  .preview-d {
    background: #0f0f14;
    border-bottom: 1px solid #222;
    flex-direction: column;
    gap: 12px;
  }

  .neon-title {
    font-weight: 800;
    font-size: 1.3rem;
    line-height: 1.2;
    text-align: center;
    background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .neon-title span {
    font-size: 1.5rem;
  }

  .neon-dots {
    display: flex;
    gap: 8px;
  }

  .ndot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  /* Preview E */
  .preview-e {
    background: #faf6ff;
    border-bottom: 1px solid #eee;
    flex-direction: column;
    gap: 8px;
  }

  .pastel-bar-e {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(
      90deg,
      #d4aaff 0%,
      #ffb3c6 30%,
      #ffd6a5 55%,
      #b8f0b8 75%,
      #a0c4ff 100%
    );
  }

  .preview-inner-e {
    text-align: center;
  }

  .preview-title-e {
    font-weight: 700;
    font-size: 1.1rem;
    color: #2d2040;
    margin-bottom: 10px;
    letter-spacing: 0.03em;
  }

  .pastel-dots-e {
    display: flex;
    gap: 5px;
    justify-content: center;
  }

  .pdot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  /* Preview F */
  .preview-f {
    background: linear-gradient(135deg, #ede0ff 0%, #fce4f0 60%, #dff0ff 100%);
    border-bottom: 1px solid #e0d0f0;
    flex-direction: column;
    padding: 0;
    justify-content: flex-start;
  }

  .preview-hero-f {
    width: 100%;
    padding: 1.5rem 1rem 1rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .pf-swatches {
    display: flex;
    gap: 5px;
  }

  .pf-swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .preview-title-f {
    font-weight: 700;
    font-size: 1.1rem;
    color: #2d1060;
    letter-spacing: 0.03em;
  }

  /* Preview G – 水彩 */
  .preview-g {
    background: #fff;
    border-bottom: 1px solid #eee;
    position: relative;
    overflow: hidden;
  }

  .blob-g {
    position: absolute;
    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
    filter: blur(20px);
    opacity: 0.2;
  }

  .blob-g1 {
    width: 120px;
    height: 100px;
    background: #e63946;
    top: -20px;
    left: -20px;
  }
  .blob-g2 {
    width: 90px;
    height: 80px;
    background: #2a9d8f;
    bottom: -10px;
    right: -10px;
  }
  .blob-g3 {
    width: 80px;
    height: 70px;
    background: #9b5de5;
    top: 40%;
    left: 50%;
  }

  .preview-title-g {
    font-weight: 800;
    font-size: 1.1rem;
    color: #1a1a1a;
    letter-spacing: 0.04em;
    position: relative;
  }

  /* Preview H – ペンキ */
  .preview-h {
    background: #fff;
    border-bottom: 1px solid #eee;
    flex-direction: column;
    gap: 10px;
    padding: 0 0 14px;
    justify-content: flex-start;
  }

  .drip-bar-h {
    display: flex;
    height: 6px;
    width: 100%;
  }

  .dcol-h {
    flex: 1;
    height: 6px;
  }

  .preview-title-h {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-weight: 900;
    font-size: 1.1rem;
    color: #1a1a1a;
    padding: 6px 12px 0;
    letter-spacing: -0.02em;
  }

  .h-lens {
    background: linear-gradient(90deg, #e63946, #118ab2, #9b5de5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .swatch-row-h {
    display: flex;
    height: 14px;
    margin: 0 12px;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .sh {
    flex: 1;
  }

  /* Design info */
  .design-info {
    padding: 1rem 1.25rem;
  }

  .label {
    display: inline-block;
    background: #f0f0f0;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #555;
    margin-bottom: 0.4rem;
  }

  .design-info h2 {
    font-size: 1rem;
    margin: 0 0 0.3rem;
  }

  .design-info p {
    font-size: 0.83rem;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }
</style>
