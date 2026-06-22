<script lang="ts">
  import type { CgGroup } from "$lib/meta/group"
  import { groupColors, groupLabels } from "$lib/meta/group"

  let { group }: { group: CgGroup } = $props()
</script>

<span class="group-tag" style:--_group-color={groupColors[group]}>{groupLabels[group]}</span>

<style>
  .group-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono-base), var(--font-ja-base);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
    color: #1a1a2e;
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
    background: var(--_group-color);
  }
</style>
