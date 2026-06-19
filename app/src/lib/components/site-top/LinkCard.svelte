<script lang="ts">
  import GradeTag, { type Grade } from "$lib/components/m-directive/GradeTag.svelte"

  /** カードのタグ。色を指定しない場合はカードの glow 色を使う。 */
  export type CardTag = string | { label: string; color?: string }

  export interface LinkCardItem {
    href: string
    gradient: string
    glow: string
    title: string
    desc: string
    grades?: Grade[]
    tags?: CardTag[]
  }

  let { href, gradient, glow, title, desc, grades = [], tags = [] }: LinkCardItem = $props()
</script>

<a {href} class="tool-glass" style="--glow: {glow}">
  <div class="tool-gradient-bar" style="background: {gradient}"></div>
  <div class="tool-glass-body">
    {#if grades.length > 0 || tags.length > 0}
      <div class="tool-glass-tags">
        {#each grades as grade (grade)}
          <GradeTag {grade} variant="light" />
        {/each}
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
    display: flex;
    flex-direction: column;
    background: light-dark(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.04));
    border: 1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08));
    box-shadow: light-dark(0 1px 8px rgba(0, 0, 0, 0.05), none);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .tool-glass:hover {
    border-color: light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.2));
    box-shadow: 0 4px 12px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.2));
  }

  .tool-gradient-bar {
    height: 3px;
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
    background-color: oklch(from var(--_tag-color) l c h / 10%);
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
    background-color: light-dark(
      oklch(from var(--_tag-color) l calc(c * 1.2) h / 28%),
      oklch(from var(--_tag-color) l c h / 14%)
    );
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
