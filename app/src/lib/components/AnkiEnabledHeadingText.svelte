<script lang="ts">
  interface Props {
    text: string
  }

  let { text }: Props = $props()

  const dummyText = $derived("X".repeat(text.length))
</script>

<span class="anki-text">{dummyText}</span>

<style>
  .anki-text {
    font-family: var(--font-anki-title);
    color: dimgray;
  }
</style>
