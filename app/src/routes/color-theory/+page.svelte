<script lang="ts">
  import GuideMap from "$lib/layouts/guide-map.svelte"
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import PlainHeading3 from "$lib/components/m-html/PlainHeading3.svelte"
  import PageLink from "$lib/components/m-directive/PageLink.svelte"
  import DraftPageTitle from "$lib/components/m-directive/DraftPageTitle.svelte"
  import { colorTheoryCategories } from "$lib/content-pages/color-theory"
  import { isPageLink } from "$lib/content-pages/types"
  import { gradeArray2CSV } from "$lib/meta/grade"
  import { parseParagraphs } from "$lib/md/paragraph"
</script>

<GuideMap title="色の理論一覧">
  {#each colorTheoryCategories as category (category.id)}
    <Heading2 id={category.id}>{category.title}</Heading2>
    {#each parseParagraphs(category.summary) as lines, pi (pi)}
      <p>
        {#each lines as line, li (li)}
          {#if li > 0}<br />{/if}{line}
        {/each}
      </p>
    {/each}
    {#each category.sections as section (section.title)}
      <PlainHeading3>{section.title}</PlainHeading3>
      <ul>
        {#each section.links as link, i (i)}
          <li>
            {#if isPageLink(link)}
              <PageLink slug={link.slug} />
            {:else}
              <DraftPageTitle
                title={link.title}
                grades={gradeArray2CSV(link.grades)}
                basic={link.basic ?? false}
              />
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
  {/each}
</GuideMap>
