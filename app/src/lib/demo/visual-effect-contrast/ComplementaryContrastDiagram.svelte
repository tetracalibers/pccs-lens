<script lang="ts">
  import SVGWrapper from "../SVGWrapper.svelte"
  import ContrastColorPreview from "./ContrastColorPreview.svelte"
  import ComplementaryContrastToneRelation from "./ComplementaryContrastToneRelation.svelte"

  let {
    leftColor = "v2",
    rightColor = "d14",
    referenceColor = "d2",
    iconId = "bi:star-fill"
  }: {
    /** 左ウイングの v セル塗り色・右プレビューの背景（PCCS表記） */
    leftColor?: string
    /** 右ウイングの v セル塗り色・右プレビューの図（PCCS表記） */
    rightColor?: string
    /** 左プレビュー（白背景）の図の色（PCCS表記） */
    referenceColor?: string
    iconId?: string
  } = $props()
</script>

<div class="contrast-diagram">
  <div class="previews">
    <div class="preview">
      <SVGWrapper>
        <ContrastColorPreview figure={referenceColor} ground="W" {iconId} />
      </SVGWrapper>
    </div>
    <div class="preview">
      <SVGWrapper>
        <ContrastColorPreview figure={rightColor} ground={leftColor} {iconId} />
      </SVGWrapper>
    </div>
  </div>
  <div class="tone-relation">
    <SVGWrapper>
      <ComplementaryContrastToneRelation {leftColor} {rightColor} />
    </SVGWrapper>
  </div>
</div>

<style>
  .contrast-diagram {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .previews {
    display: flex;
    justify-content: center;
    gap: 1rem;
    width: 100%;
  }

  .preview {
    flex: 1;
    max-width: 160px;
  }

  .tone-relation {
    width: 100%;
    max-width: 460px;
  }
</style>
