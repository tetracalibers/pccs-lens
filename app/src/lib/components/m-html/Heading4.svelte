<script lang="ts">
  import { type Snippet } from "svelte"
  import { ankiMode } from "$lib/state/anki.svelte"

  let { children, title = "" }: { children?: Snippet; title?: string } = $props()

  const isAnki = $derived(ankiMode.isAnki)
  const dummyText = $derived("X".repeat(title.length))
</script>

<h4 class:--anki={isAnki}>
  {#if isAnki && title}
    {dummyText}
  {:else}
    {@render children?.()}
  {/if}
</h4>

<style>
  h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: light-dark(#5a5a6a, #b0b0cc);
    display: flex;
    align-items: flex-start;
    gap: calc(0.55rem + 5px);
    line-height: 1.3;
    margin: 1.2rem 0 0.3rem;
  }

  h4::before {
    content: "";
    display: inline-block;
    flex-shrink: 0;
    width: 5px;
    height: 5px;
    margin-top: calc(0.65em - 2.5px);
    margin-left: 2.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.5), rgba(199, 125, 255, 0.5));
  }

  .--anki {
    font-family: var(--font-anki-title);
    color: dimgray;
  }
</style>
