<script lang="ts">
  let { value, scale = 1 }: { value: number; scale?: number } = $props()
</script>

<div class="swatch" style:aspect-ratio="1 / {scale}">
  <span class="label">明度{value.toFixed(1)}</span>
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
    font-size: 0.65rem;
    font-weight: 500;
    white-space: nowrap;
  }
</style>
