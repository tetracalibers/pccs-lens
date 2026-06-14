<script lang="ts">
  import GuideMap from "$lib/layouts/guide-map.svelte"
  import Heading2 from "$lib/components/m-html/Heading2.svelte"
  import PlainHeading3 from "$lib/components/m-html/PlainHeading3.svelte"
  import CgDraftPageTitle from "$lib/components/m-directive/CgDraftPageTitle.svelte"
  import { cgCategories } from "$lib/content-pages/cg"
</script>

<GuideMap title="CGの理論一覧">
  {#each cgCategories as category, ci (category.title)}
    <Heading2 id={`cg-category-${ci}`}>{category.title}</Heading2>
    {#each category.sections as section (section.title)}
      <PlainHeading3>{section.title}</PlainHeading3>
      <ul>
        {#each section.links as link, i (i)}
          <li>
            <CgDraftPageTitle title={link.title} group={link.group} />
          </li>
        {/each}
      </ul>
    {/each}
  {/each}
</GuideMap>
