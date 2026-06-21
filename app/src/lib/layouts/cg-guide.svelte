<script lang="ts">
  import { resolve } from "$app/paths"
  import GuideMap from "$lib/layouts/guide-map.svelte"
  import Breadcrumb from "$lib/components/Breadcrumb.svelte"
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import PageLink from "$lib/components/m-directive/PageLink.svelte"
  import CgDraftPageTitle from "$lib/components/m-directive/CgDraftPageTitle.svelte"
  import { isPageLink } from "$lib/content-pages/types"
  import type { CgPage } from "$lib/content-pages/cg"

  let { page }: { page: CgPage } = $props()
</script>

<GuideMap title={page.title}>
  {#snippet breadcrumb()}
    <Breadcrumb
      category="contents"
      crumbs={[{ label: "CGと画像処理", href: resolve("/cg") }, { label: page.title }]}
    />
  {/snippet}
  {#each page.sections as section (section.id)}
    <Heading2 id={section.id}>{section.heading}</Heading2>
    <ul>
      {#each section.links as link, i (i)}
        <li>
          {#if isPageLink(link)}
            <PageLink slug={link.slug} />
          {:else}
            <CgDraftPageTitle title={link.title} group={link.group} />
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</GuideMap>
