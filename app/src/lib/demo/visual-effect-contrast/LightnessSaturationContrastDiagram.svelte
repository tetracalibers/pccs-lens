<script lang="ts">
  import SVGWrapper from "../SVGWrapper.svelte"
  import LightnessSaturationContrastPreview from "./LightnessSaturationContrastPreview.svelte"
  import LightnessSaturationContrastToneRelation from "./LightnessSaturationContrastToneRelation.svelte"

  let {
    figure,
    ground,
    iconId = "bi:star-fill"
  }: {
    figure: string
    ground: string
    iconId?: string
  } = $props()
</script>

<div class="contrast-diagram">
  <div class="preview">
    <SVGWrapper>
      <LightnessSaturationContrastPreview {figure} {ground} {iconId} />
    </SVGWrapper>
  </div>
  <div class="tone-relation">
    <SVGWrapper>
      <LightnessSaturationContrastToneRelation {figure} {ground} {iconId} />
    </SVGWrapper>
  </div>
</div>

<style>
  .contrast-diagram {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    place-items: center;
  }

  .preview {
    max-width: 200px;
  }

  .tone-relation {
    max-width: 200px;
  }
</style>
