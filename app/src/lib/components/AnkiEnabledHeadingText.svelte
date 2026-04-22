<script lang="ts">
  import { ankiMode } from "$lib/state/anki.svelte"

  interface Props {
    text: string
  }

  let { text }: Props = $props()

  const isAnki = $derived(ankiMode.isAnki)
  const dummyText = $derived("X".repeat(text.length))
</script>

<span class:--anki={isAnki}>{isAnki ? dummyText : text}</span>

<style>
  .--anki {
    font-family: var(--font-anki-title);
    color: dimgray;
  }
</style>
