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

  // hrefが相対リンクの場合、resolveする
  const resolvedHref = $derived(() => {
    if (isAbsoluteLink) return href
    // @ts-ignore
    return resolve(href)
  })
</script>

<a
  href={resolvedHref()}
  target={isAbsoluteLink ? "_blank" : undefined}
  rel={isAbsoluteLink ? "noopener noreferrer" : undefined}
  class:--_external={isAbsoluteLink}
>
  {@render children?.()}
  <Icon icon={isAbsoluteLink ? "ei:external-link" : "material-symbols-light:book-5-outline"} />
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
</style>
