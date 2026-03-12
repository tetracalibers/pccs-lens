<script lang="ts">
  interface Props {
    text: string
    color: string
  }

  let { text, color }: Props = $props()

  let copied = $state(false)

  async function handleClick() {
    await navigator.clipboard.writeText(text)
    copied = true
    setTimeout(() => {
      copied = false
    }, 1500)
  }
</script>

<span class="wrapper" style={`--color-copybtn-base: ${color}`}>
  <button class="copy-btn" onclick={handleClick} aria-label="コードをコピー">
    {#if copied}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    {/if}
  </button>
  {#if copied}
    <span class="tooltip" role="status">Copied!</span>
  {/if}
</span>

<style>
  .wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: 1px solid rgb(from var(--color-copybtn-base) r g b / 35%);
    border-radius: 0.25rem;
    background: transparent;
    color: var(--color-copybtn-base);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .copy-btn:hover {
    background: rgb(from var(--color-copybtn-base) r g b / 20%);
    color: oklch(from currentColor calc(l * 0.75) c h);
  }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    background: var(--color-text, #333);
    color: #fff;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
  }

  .tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: var(--color-text, #333);
  }
</style>
