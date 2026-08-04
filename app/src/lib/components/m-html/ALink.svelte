<script lang="ts">
  import type { Snippet } from "svelte"
  import { resolve } from "$app/paths"
  import Icon from "@iconify/svelte"

  interface Props {
    href: string
    children?: Snippet
  }

  let { children, href }: Props = $props()

  const isAbsoluteLink = $derived(href.startsWith("http://") || href.startsWith("https://"))
  // ページ内移動（アンカーリンク）
  const isAnchorLink = $derived(href.startsWith("#"))

  // hrefが相対リンクの場合、resolveする
  const resolvedHref = $derived(() => {
    if (isAbsoluteLink || isAnchorLink) return href
    // @ts-ignore
    return resolve(href)
  })

  const icon = $derived(
    isAbsoluteLink
      ? "ei:external-link"
      : isAnchorLink
        ? "lets-icons:down"
        : "material-symbols-light:book-5-outline"
  )
</script>

<a
  href={resolvedHref()}
  target={isAbsoluteLink ? "_blank" : undefined}
  rel={isAbsoluteLink ? "noopener noreferrer" : undefined}
  class:--_external={isAbsoluteLink}
  class:--_anchor={isAnchorLink}
>
  {@render children?.()}
  <Icon {icon} />
</a>

<style>
  a {
    color: var(--color-heading);
    text-underline-offset: 4px;
    text-decoration-style: solid;
    text-decoration-thickness: 1px;
    display: inline-flex;
    width: fit-content;
  }

  a.--_external {
    color: var(--color-body);
  }

  a.--_anchor {
    padding-inline-start: 4px;
    padding-inline-end: 0;
    gap: 6px;
    align-items: center;
    translate: 0 -2px;
  }

  a.--_anchor::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }

  /* ページ内移動の下向きアイコンは、他のアイコンより少し下に置く */
  a.--_anchor :global(svg) {
    translate: -3px -1.5px;
  }
</style>
