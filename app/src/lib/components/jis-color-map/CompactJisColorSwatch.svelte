<script lang="ts">
  import type { JISColor } from "$lib/data/jis-colors"
  import JisColorNameTooltip from "./JisColorNameTooltip.svelte"

  let { colors }: { colors: JISColor[] } = $props()

  const bgHex = $derived(colors[0].hex)
  const keyId = $derived(colors[0].id)
  const anchorName = $derived(`--jis-tt-${keyId}`)
  const popoverId = $derived(`jis-tt-${keyId}`)

  let popoverRef: HTMLElement | null = $state(null)

  const show = () => popoverRef?.showPopover()
  const hide = () => popoverRef?.hidePopover()
</script>

<div
  class="swatch"
  style:background-color={bgHex}
  style:anchor-name={anchorName}
  role="button"
  tabindex="0"
  aria-describedby={popoverId}
  onpointerenter={show}
  onpointerleave={hide}
  onfocusin={show}
  onfocusout={hide}
></div>

<JisColorNameTooltip {colors} {anchorName} {popoverId} bind:popoverRef />

<style>
  .swatch {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    cursor: pointer;
    outline-offset: 2px;
  }

  .swatch:focus-visible {
    outline: 2px solid var(--color-focus, #4a90e2);
  }
</style>
