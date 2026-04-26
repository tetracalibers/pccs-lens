<script lang="ts">
  import type { Picture } from "vite-imagetools"

  interface Props {
    src: Picture
    alt: string
    maxWidth?: string
  }

  let { src, alt, maxWidth }: Props = $props()
</script>

<enhanced:img {src} {alt} style={maxWidth ? `max-width: ${maxWidth};` : undefined} />
