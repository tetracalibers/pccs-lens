<script lang="ts">
  import LightnessSaturationContrastPreview from "./LightnessSaturationContrastPreview.svelte"
  import LightnessSaturationContrastToneRelation from "./LightnessSaturationContrastToneRelation.svelte"

  let {
    figure,
    ground,
    iconId = "mdi:circle"
  }: {
    figure: string
    ground: string
    iconId?: string
  } = $props()
</script>

<div class="contrast-diagram">
  <div class="preview">
    <LightnessSaturationContrastPreview {figure} {ground} {iconId} />
  </div>
  <div class="tone-relation">
    <LightnessSaturationContrastToneRelation {figure} {ground} {iconId} />
  </div>
</div>

<style>
  .contrast-diagram {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .preview {
    flex: 0 1 200px;
    max-width: 200px;
  }

  .tone-relation {
    flex: 1 1 320px;
    min-width: 0;
  }

  @media (max-width: 600px) {
    .contrast-diagram {
      flex-direction: column;
      align-items: stretch;
    }

    .preview {
      align-self: center;
      flex: 0 0 auto;
      max-width: 200px;
      width: 100%;
    }

    .tone-relation {
      flex: 0 0 auto;
    }
  }
</style>
