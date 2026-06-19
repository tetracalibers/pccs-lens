<script lang="ts">
  import CgGuide from "$lib/layouts/cg-guide.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<CgGuide page={data.page} />
