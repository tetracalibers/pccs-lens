<script lang="ts">
  import { page } from "$app/state"
  import { base } from "$app/paths"
  import { resolveOgMeta, SITE_NAME } from "$lib/meta/site-meta"

  // 現在の pathname から OGP / Twitter Card 用のメタを解決する。
  // root layout に 1 箇所だけ置き、各ページの <title> とは独立に og:/twitter: タグを注入する。
  const meta = $derived(resolveOgMeta(page.url.pathname, base))
</script>

<svelte:head>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:url" content={meta.url} />
  <meta property="og:title" content={meta.title} />
  <meta property="og:description" content={meta.description} />
  <meta property="og:image" content={meta.imageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={meta.imageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
