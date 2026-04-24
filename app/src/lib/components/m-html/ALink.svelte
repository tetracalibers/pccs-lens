<script lang="ts">
  import type { Snippet } from "svelte"
  import { resolve } from "$app/paths"
  import type { RouteIdWithSearchOrHash } from "$app/types"
  import type { PathnameWithSearchOrHash } from "$app/types"
  import Icon from "@iconify/svelte"

  interface Props {
    href:
      | `http://${string}`
      | `https://${string}`
      | RouteIdWithSearchOrHash
      | PathnameWithSearchOrHash
    children?: Snippet
  }

  let { children, href }: Props = $props()

  const isAbsoluteLink = $derived(/^https?:\/\//.test(href))

  // hrefが相対リンクの場合、resolveする
  const resolvedHref = $derived(() => {
    if (isAbsoluteLink) {
      return href
    }
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
  {#if isAbsoluteLink}
    <Icon icon="ei:external-link" />
  {/if}
</a>

<style>
  a {
    color: var(--color-heading);
    text-underline-offset: 4px;
    text-decoration-style: dotted;
    display: inline-flex;
    width: fit-content;
  }

  a.--_external {
    color: var(--color-body);
  }
</style>
