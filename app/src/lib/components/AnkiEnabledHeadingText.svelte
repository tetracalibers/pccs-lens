<script lang="ts">
  interface Props {
    text: string
    round?: boolean
  }

  let { text, round = false }: Props = $props()

  const dummyText = $derived("X".repeat(text.length))
</script>

<span class="anki-text" class:--_round={round}>{dummyText}</span>

<style>
  .anki-text {
    font-family: var(--font-anki-title);
    color: dimgray;
    padding-inline: 3px;
    line-height: 0.5;
    translate: 0 0.375em;
  }

  .anki-text.--_round {
    font-family: var(--font-anki-round);
    line-height: 1;
  }
</style>
