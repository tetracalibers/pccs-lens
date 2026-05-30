<script lang="ts">
  import Icon from "@iconify/svelte"
  import type { AftGrade } from "$lib/meta/grade"

  export type Grade = "useful" | AftGrade

  export type Variant = "default" | "light"

  interface Props {
    grade: Grade
    compactH?: boolean
    variant?: Variant
  }

  let { grade, compactH = false, variant = "default" }: Props = $props()

  const labels: Record<Grade, string> = {
    useful: "実用",
    "3": "3級",
    "2": "2級",
    "1": "1級",
    uc: "UC級"
  }
</script>

<span class="grade-tag" data-grade={grade} data-variant={variant} class:--_compact-h={compactH}>
  {#if grade === "useful"}
    <Icon icon="solar:star-shine-bold" class="grade-tag-icon" />
  {/if}
  {labels[grade]}
</span>

<style>
  .grade-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
    color: #1a1a2e;
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .grade-tag.--_compact-h {
    padding-block: 3px;
  }

  .grade-tag[data-grade="useful"] {
    --_color: #ff7675;
    --_glow-color: rgb(from var(--_color) r g b / 0.7);
    background: var(--_color);
    color: #ffffff;
    font-size: 0.82rem;
    padding: 4px 6px;
    display: inline-flex;
    gap: 2px;
    justify-content: center;
  }

  .grade-tag[data-grade="useful"] :global(.grade-tag-icon) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }

  .grade-tag[data-grade="3"] {
    --_color: var(--color-grade-3);
    --_glow-color: rgb(from var(--_color) r g b / 0.7);
    background: var(--_color);
  }

  .grade-tag[data-grade="2"] {
    --_color: var(--color-grade-2);
    --_glow-color: rgb(from var(--_color) r g b / 0.7);
    background: var(--_color);
  }

  .grade-tag[data-grade="1"] {
    --_color: var(--color-grade-1);
    --_glow-color: rgb(from var(--_color) r g b / 0.7);
    background: var(--_color);
  }

  .grade-tag[data-grade="uc"] {
    --_color: var(--color-grade-uc);
    --_glow-color: rgb(from var(--_color) r g b / 0.7);
    background: var(--_color);
  }

  .grade-tag[data-variant="light"] {
    background: transparent;
    border: 1px solid var(--_color);
    color: oklch(from var(--_color) calc(l * 0.9) c h);
    font-size: 0.75rem;
    border-radius: 20px;
    background-color: oklch(from var(--_color) l c h / 10%);
    padding: 4px 8px;
  }
</style>
