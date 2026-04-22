<script lang="ts">
  import Icon from "@iconify/svelte"
  import { resolve } from "$app/paths"
  import type { JISColor, JISColorFamily } from "$lib/data/jis-colors"
  import { JIS_COLOR_ICON_MAP, type JISColorIconKey } from "$lib/data/jis-color-icon"
  import { PCCS_ALL_MAP } from "$lib/data/pccs"
  import type { PCCSColor } from "$lib/data/types"
  import JisExamLevelBadge from "./JisExamLevelBadge.svelte"
  import PCCSColorSwatch from "$lib/demo/PCCSColor.svelte"

  interface Props {
    family: JISColorFamily
    jisColors: JISColor[]
  }

  let { family, jisColors }: Props = $props()

  const splitOriginDescription = (text: string): string[] => {
    if (!text) return []
    return text.split(/\s+/).filter((s) => s.length > 0)
  }

  const resolvePccsList = (color: JISColor): PCCSColor[] =>
    color.approximatePccs
      .map((a) => PCCS_ALL_MAP.get(a.notation))
      .filter((c): c is PCCSColor => c !== undefined)

  const resolveIconId = (iconKey: string): string | undefined =>
    JIS_COLOR_ICON_MAP.get(iconKey as JISColorIconKey)
</script>

<div class="entries">
  {#each jisColors as jisColor (jisColor.id)}
    {@const iconId = resolveIconId(jisColor.iconKey)}
    {@const pccsList = resolvePccsList(jisColor)}
    {@const originSegments = splitOriginDescription(jisColor.originDescription)}
    <article class="entry">
      <div class="entry-main">
        <div class="entry-identity">
          <div class="icon-swatch-row">
            {#if iconId}
              <span class="icon" style:color={jisColor.hex} aria-hidden="true">
                <Icon icon={iconId} />
              </span>
            {/if}
            <span class="swatch" style:background-color={jisColor.hex}></span>
          </div>
          <div class="name-block">
            <div class="name-row">
              <h3 class="color-name" id={jisColor.id}>{jisColor.name}</h3>
              <span class="reading">{jisColor.reading}</span>
            </div>
            {#if pccsList.length > 0}
              <div class="pccs-list">
                {#each pccsList as pccs (pccs.notation)}
                  <PCCSColorSwatch pccs={pccs.notation} />
                {/each}
              </div>
            {/if}
          </div>
        </div>
        <div class="entry-detail">
          {#if originSegments.length > 0}
            <p class="origin-description">
              {#each originSegments as segment, i (i)}
                {segment}{#if i < originSegments.length - 1}<br />{/if}
              {/each}
            </p>
          {/if}
          <dl class="meta">
            <dt>系統色名</dt>
            <dd>{jisColor.systematicName}</dd>
            <dt>マンセル値</dt>
            <dd class="munsell">{jisColor.munsell}</dd>
          </dl>
          <a href={resolve("/jis-color-map/[family]", { family: family.id })} class="compare-link">
            {family.name}を比較する
            <Icon icon="mdi:arrow-right" />
          </a>
        </div>
        <div class="exam-level">
          <JisExamLevelBadge examLevel={jisColor.examLevel} size="M" />
        </div>
      </div>
    </article>
  {/each}
</div>

<style>
  .entries {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .entry {
    border-top: 1px solid var(--color-border, #e0e0e0);
    padding-top: 1.25rem;
  }

  .entry-main {
    display: grid;
    grid-template-columns: auto 1fr auto;
    column-gap: 1.5rem;
    row-gap: 1rem;
    align-items: start;
  }

  .entry-identity {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr auto;
    height: 100%;
  }

  .icon-swatch-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon {
    font-size: 2rem;
    display: inline-flex;
    align-self: flex-start;
  }

  .swatch {
    height: 100%;
    min-width: 5rem;
    aspect-ratio: 1;
    border-radius: 6px;
    border: 1px solid var(--color-border, #d0d0d0);
  }

  .name-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    height: 100%;
  }

  .name-row {
    display: grid;
    column-gap: 0.6rem;
    row-gap: 0.15rem;
  }

  .color-name {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    scroll-margin-top: 4rem;
  }

  .reading {
    font-size: 0.7rem;
    opacity: 0.8;
  }

  .pccs-list {
    display: grid;
    gap: 2px;
    grid-auto-flow: column;
    grid-template-columns: 1fr 1fr 1fr;
    margin-block-start: auto;
  }

  .entry-detail {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    min-width: 0;
  }

  .origin-description {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--color-body);
    margin: 0;
    min-height: 2lh;
  }

  .meta {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 1rem;
    row-gap: 0.2rem;
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .meta dt {
    opacity: 0.7;
  }

  .meta dd {
    margin: 0;
  }

  .munsell {
    font-family: var(--font-mono);
  }

  .compare-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: light-dark(#3a3af0, #a9b2ff);
    text-decoration: none;
    align-self: flex-start;
    padding-block: 0.2rem;
  }

  .compare-link:hover {
    text-decoration: underline;
  }

  .exam-level {
    justify-self: end;
  }

  @media (max-width: 640px) {
    .entry-main {
      grid-template-columns: 1fr;
      row-gap: 0.75rem;
    }

    .exam-level {
      justify-self: start;
      grid-row: 1;
    }
  }
</style>
