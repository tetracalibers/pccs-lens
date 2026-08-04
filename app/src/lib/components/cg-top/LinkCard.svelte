<script lang="ts">
  /** カードのタグ。色を指定しない場合はカードの glow 色を使う。 */
  export type CardTag = string | { label: string; color?: string }

  export interface LinkCardItem {
    href: string
    glow: string
    title: string
    desc: string
    tags?: CardTag[]
    /** リンク先の記事がすべて下書き／未作成のとき true。「Coming Soon」タグを表示する。 */
    comingSoon?: boolean
  }

  let { href, glow, title, desc, tags = [], comingSoon = false }: LinkCardItem = $props()
</script>

<a {href} class="tool-glass" style="--glow: {glow}">
  <div class="tool-glass-body">
    {#if comingSoon || tags.length > 0}
      <div class="tool-glass-tags">
        {#if comingSoon}
          <span class="coming-soon-tag">Coming Soon</span>
        {/if}
        {#each tags as tag (typeof tag === "string" ? tag : tag.label)}
          {@const label = typeof tag === "string" ? tag : tag.label}
          {@const color = typeof tag === "string" ? undefined : tag.color}
          <span class="card-tag" class:--_colored={color != null} style:--tag-color={color}>
            {label}
          </span>
        {/each}
      </div>
    {/if}
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
</a>

<style>
  .tool-glass {
    position: relative;
    display: flex;
    flex-direction: column;
    background: light-dark(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.04));
    /* 枠線の領域だけ確保し、線そのものは擬似要素で描く */
    border: 1px solid transparent;
    text-decoration: none;
    color: inherit;
  }

  /*
   * border-image は補間できず transition が効かないので、枠線に重ねた 2 枚の
   * 擬似要素（グラデーション／一様）を不透明度でクロスフェードさせる。
   * 位置の基準は padding box なので、inset: -1px で枠線の上にちょうど重なる。
   */
  .tool-glass::before,
  .tool-glass::after {
    content: "";
    position: absolute;
    inset: -1px;
    pointer-events: none;
    border: 1px solid;
    transition: opacity 0.2s;
  }

  /* 既定：グラデーションの枠線 */
  .tool-glass::before {
    border-image: linear-gradient(
        180deg,
        light-dark(#79889b87, #dee6ea82) 0%,
        light-dark(#6b7a8da6, #cbd2dfcf) 20%,
        light-dark(#5d6b7e, #b8bfce96) 40%,
        light-dark(#4f5d7075, #a5aebcad) 60%,
        light-dark(#424f61a3, #929eabbf) 80%,
        light-dark(#3641523b, #8090a1a8) 100%
      )
      1;
  }

  /* hover：グラデーションの端の色による一様な枠線 */
  .tool-glass::after {
    border-color: light-dark(#3641523b, #dee6ea82);
    opacity: 0;
  }

  .tool-glass:hover::before {
    opacity: 0;
  }

  .tool-glass:hover::after {
    opacity: 1;
  }

  .tool-glass-body {
    padding: 1.1rem;
    background: rgba(255, 255, 255, 0.06);
    height: 100%;
  }

  .tool-glass-tags {
    display: inline-flex;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .card-tag {
    /* タグ個別の色指定があればそれを、なければカードの glow 色を使う */
    --_tag-color: var(--tag-color, var(--glow));
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: var(--font-mono);
    line-height: 1.3;
    padding: 4px 8px;
    border-radius: 20px;
    white-space: nowrap;
    border: 1px solid var(--_tag-color);
    color: oklch(from var(--_tag-color) calc(l * 0.9) c h);
  }

  /* 色指定のあるタグ（CG / 画像処理）: 角丸を抑え、淡いパステルでも読めるようコントラストを上げる */
  .card-tag.--_colored {
    border-radius: 6px;
    padding: 3px 8px;
    border-color: light-dark(
      oklch(from var(--_tag-color) calc(l * 0.78) calc(c * 1.3) h),
      oklch(from var(--_tag-color) l c h)
    );
    color: light-dark(
      oklch(from var(--_tag-color) 0.65 calc(c * 1.5) h),
      oklch(from var(--_tag-color) 0.8 c h)
    );
  }

  /* 公開待ち（下書き／未作成）を示すグレーのタグ。色付きタグと同じピル形状に揃える */
  .coming-soon-tag {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: var(--font-mono);
    line-height: 1.3;
    padding: 3px 8px;
    white-space: nowrap;
    border: 1px solid light-dark(#b0b0b0, #6a6a6a);
    color: light-dark(#6e6e6e, #b0b0b0);
  }

  .tool-glass-body h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    color: var(--color-heading);
  }

  .tool-glass-body p {
    font-size: 0.78rem;
    color: var(--color-body);
    margin: 0;
    line-height: 1.5;
  }
</style>
