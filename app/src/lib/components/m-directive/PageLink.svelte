<script lang="ts">
  import GradeTag from "./GradeTag.svelte"
  import { resolve } from "$app/paths"
  import type { Snippet } from "svelte"

  type Grade = "basic" | "3" | "2" | "1" | "uc"

  let {
    path,
    children,
    grades: gradesInput = ""
  }: {
    path: string
    children: Snippet
    grades?: string
  } = $props()

  let grades = $derived(gradesInput.split(/\s+/).filter(Boolean) as Grade[])

  // @ts-expect-error
  let href = $derived(resolve(path))
</script>

<a {href} class="page-link">
  <span class="pl-title">{@render children?.()}</span>
  {#if grades.length > 0}
    <span class="pl-grades">
      {#each grades as grade (grade)}
        <GradeTag {grade} />
      {/each}
    </span>
  {/if}
</a>

<style>
  .page-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
    position: relative;
    padding: 0.5rem 0 0.5rem 1.5rem;
    transition: color 0.2s;
  }

  .page-link::before {
    content: "";
    position: absolute;
    left: 1px;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: translateY(-50%);
    background: light-dark(#ea580c, #f97316);
    transition:
      border-radius 0.5s ease,
      transform 0.3s,
      background 0.2s;
  }

  .page-link:hover {
    color: light-dark(#c2410c, #fb923c);
  }

  .page-link:hover::before {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: translateY(-50%) scale(1.35);
    background: light-dark(#c2410c, #ea580c);
  }

  .pl-title {
    flex: 1;
    min-width: 0;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.4;
  }

  .pl-grades {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    flex-shrink: 0;
  }
</style>
