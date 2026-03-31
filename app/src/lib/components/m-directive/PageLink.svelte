<script lang="ts">
  import GradeTag from "./GradeTag.svelte"
  import { resolve } from "$app/paths"
  import type { Snippet } from "svelte"

  type Grade = "3" | "2" | "1" | "uc"

  let {
    path,
    children,
    grades: gradesInput = "",
    basic = false
  }: {
    path: string
    children: Snippet
    grades?: string
    basic?: boolean
  } = $props()

  let grades = $derived(gradesInput.split(/\s+/).filter(Boolean) as Grade[])

  // @ts-expect-error
  let href = $derived(resolve(path))

  const gradeColors = {
    "3": "#c4b5fd",
    "2": "#6ee7b7",
    "1": "#fde68a",
    uc: "#93c5fd"
  }

  let accentColor = $derived(grades.length > 0 ? gradeColors[grades[0]] : "#94a3b8")
</script>

<a {href} class="page-link" style="--pl-accent: {accentColor}">
  <span class="pl-title">{@render children?.()}</span>
  {#if grades.length > 0 || basic}
    <span class="pl-grades">
      {#each grades as grade (grade)}
        <GradeTag {grade} />
      {/each}
      {#if basic}
        <GradeTag grade="basic" />
      {/if}
    </span>
  {/if}
</a>

<style>
  .page-link {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
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
    background: linear-gradient(
      135deg,
      var(--pl-accent),
      oklch(from var(--pl-accent) calc(l - 0.1) c h)
    );
    transition:
      border-radius 0.5s ease,
      transform 0.3s,
      background 0.2s;
  }

  .page-link:hover {
    color: oklch(from var(--pl-accent) calc(l - 0.2) c h);
  }

  .page-link:hover::before {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: translateY(-50%) scale(1.35);
    background: linear-gradient(
      135deg,
      oklch(from var(--pl-accent) calc(l - 0.08) c h),
      oklch(from var(--pl-accent) calc(l - 0.22) c h)
    );
  }

  .pl-title {
    min-width: 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
    border-block-end: 2px dotted var(--pl-accent);
  }

  .pl-grades {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
</style>
