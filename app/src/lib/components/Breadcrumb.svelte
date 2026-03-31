<script lang="ts">
  import type { ResolvedPathname } from "$app/types"

  interface Crumb {
    label: string
    href?: ResolvedPathname | null
  }

  let { crumbs, category }: { crumbs: Crumb[]; category: "tool" | "contents" } = $props()
</script>

<nav class={`breadcrumb -${category}`} aria-label="パンくずリスト">
  <span class="dot"></span>
  {#each crumbs as crumb, i (crumb.label)}
    {#if crumb.href}
      <a class="crumb" href={crumb.href}>{crumb.label}</a>
    {:else}
      <span class="crumb current">{crumb.label}</span>
    {/if}
    {#if i < crumbs.length - 1}
      <span class="sep" aria-hidden="true">›</span>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumb {
    --_base-color: light-dark(#555, #bbb);

    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    margin-bottom: 1.5rem;
  }

  .breadcrumb.-tool {
    --_base-gradient: linear-gradient(135deg, #ff6b6b, #ffd93d);
  }
  .breadcrumb.-contents {
    --_base-gradient: linear-gradient(135deg, #4d96ff, #c77dff, #6bcb77);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
    background: var(--_base-gradient);
  }

  .crumb {
    color: var(--_base-color);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s;
    padding-block: 4px;
  }

  .crumb[href] {
    background-image: var(--_base-gradient);
    background-repeat: no-repeat;
    background-size: 0 1.5px;
    background-position: 0 100%;
    transition:
      color 0.15s,
      background-size 0.15s;
  }

  .crumb[href]:hover {
    color: light-dark(#1a1a1a, #f0f0f0);
    background-size: 100% 1.5px;
  }

  .crumb.current {
    font-weight: 700;
    cursor: default;
  }

  .sep {
    color: light-dark(#555555, #999999);
    font-size: 0.9rem;
    vertical-align: middle;
  }
</style>
