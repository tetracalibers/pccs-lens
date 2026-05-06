<script lang="ts">
  import Icon from "@iconify/svelte"
</script>

<span class="start-here-tag">
  <Icon icon="solar:star-shine-bold" class="start-here-tag-icon" />
  まずはここから
</span>

<style>
  .start-here-tag {
    --_color: #ff6b6b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 6px;
    border: 1px solid var(--_color);
    border-radius: 20px;
    color: oklch(from var(--_color) calc(l * 0.9) c h);
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .start-here-tag :global(.start-here-tag-icon) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
</style>
