<script lang="ts">
  import type { CgGroup } from "$lib/meta/group"
  import { groupLabels } from "$lib/meta/group"

  let { group }: { group: CgGroup } = $props()
</script>

<span class="group-tag" data-group={group}>{groupLabels[group]}</span>

<style>
  .group-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
    color: #1a1a2e;
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
    background: var(--_color);
  }

  .group-tag[data-group="CG"] {
    --_color: #d8b4fe;
  }

  .group-tag[data-group="ImgP"] {
    --_color: #a5d8ff;
  }
</style>
