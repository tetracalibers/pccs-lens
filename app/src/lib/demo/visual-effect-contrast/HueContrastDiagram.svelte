<script lang="ts">
  import SVGWrapper from "../SVGWrapper.svelte"
  import HueContrastPreview from "./ContrastColorPreview.svelte"
  import HueContrastRelation from "./ContrastHueRelation.svelte"

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
      <HueContrastPreview {figure} {ground} {iconId} />
    </SVGWrapper>
  </div>
  <div class="hue-relation">
    <SVGWrapper>
      <HueContrastRelation {figure} {ground} {iconId} />
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

  .hue-relation {
    max-width: 250px;
    margin-block-end: -1rem;
  }
</style>
