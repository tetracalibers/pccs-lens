<script lang="ts">
  import GuideMap from "$lib/layouts/guide-map.svelte"
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import PlainHeading3 from "$lib/components/m-html/PlainHeading3.svelte"
  import PageLink from "$lib/components/m-directive/PageLink.svelte"
  import CgDraftPageTitle from "$lib/components/m-directive/CgDraftPageTitle.svelte"
  import { cgCategories, cgCategoryId } from "$lib/content-pages/cg"
  import { isPageLink } from "$lib/content-pages/types"
  import { parseParagraphs } from "$lib/md/paragraph"
</script>

<GuideMap title="コンピュータグラフィックス">
  {#each cgCategories as category, ci (category.title)}
    <Heading2 id={cgCategoryId(ci)}>{category.title}</Heading2>
    {#if category.summary}
      {#each parseParagraphs(category.summary) as lines, pi (pi)}
        <p>
          {#each lines as line, li (li)}
            {#if li > 0}<br />{/if}{line}
          {/each}
        </p>
      {/each}
    {/if}
    {#each category.sections as section (section.title)}
      <PlainHeading3>{section.title}</PlainHeading3>
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
  {/each}
</GuideMap>
