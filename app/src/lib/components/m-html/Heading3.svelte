<script lang="ts">
  import { type Snippet } from "svelte"
  import AnkiEnabledHeadingText from "../AnkiEnabledHeadingText.svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  let { children, title = "" }: { children?: Snippet; title?: string } = $props()

  const isAnki = $derived(ankiMode.isAnki)
</script>

<h3>
  {#if isAnki && title}
    <AnkiEnabledHeadingText text={title} />
  {:else}
    {@render children?.()}
  {/if}
</h3>

<style>
  h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-heading);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: flex-start;
    gap: calc(0.55rem + 3px);
    line-height: 1.3;
    margin: 1.6rem 0 0.45rem;
    min-height: 1lh;
  }

  h3::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    align-self: center;
    width: 7px;
    height: 7px;
    margin-left: 1.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #c77dff);
  }
</style>
