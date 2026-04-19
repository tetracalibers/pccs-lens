<script lang="ts">
  interface Props {
    value: number
    scale?: number
    compact?: boolean
  }

  let { value, scale = 1, compact = false }: Props = $props()
</script>

<div class="swatch" style:aspect-ratio="1 / {scale}" class:--_compact={compact}>
  <span class="label">{compact ? "" : "明度"}{value.toFixed(1)}</span>
</div>

<style>
  .swatch {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: 1px solid var(--color-body);
    border-radius: 8px;
    color: var(--color-body);
    box-sizing: border-box;
  }

  .label {
    font-size: var(--map-font-m, 0.65rem);
    white-space: nowrap;
  }

  .--_compact .label {
    font-size: var(--map-font-s);
  }
</style>
