<script lang="ts">
  interface Props {
    hex: string
  }

  let { hex }: Props = $props()
</script>

<div class="square" style:--_hex-color={hex}></div>

<style>
  .square {
    --_square-size: 5rem;
    --_black-border: rgba(0, 0, 0, 0.2);
    --_white-border: rgba(255, 255, 255, 0.25);

    width: var(--_square-size);
    height: var(--_square-size);
    background-color: var(--_hex-color);
    flex-shrink: 0;
    box-sizing: border-box;
    border: 1px solid light-dark(var(--_black-border), var(--_white-border));
  }
</style>
