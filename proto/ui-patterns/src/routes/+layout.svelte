<script lang="ts">
  import favicon from "$lib/assets/favicon.svg"

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Reddit+Mono:wght@400..700&family=SUSE+Mono:wght@400;500&family=Zen+Kaku+Gothic+Antique:wght@400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{@render children()}

<style>
  :global(body) {
    --font-mono: "Reddit Mono", monospace;

    font-family: "SUSE Mono", "Zen Kaku Gothic Antique", sans-serif;
    font-synthesis-weight: none;
  }
</style>
