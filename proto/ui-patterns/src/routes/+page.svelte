<script lang="ts">
  import { resolve } from "$app/paths"
</script>

<svelte:head>
  <title>PCCS Lens - UIプロトタイプ一覧</title>
</svelte:head>

<main>
  <header>
    <h1>PCCS Lens トップページ デザイン案</h1>
    <p>4つのデザイン案を比較・検討してください</p>
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
