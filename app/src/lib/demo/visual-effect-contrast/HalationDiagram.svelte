<script lang="ts">
  import SVGWrapper from "../SVGWrapper.svelte"
  import ContrastColorPreview from "./ContrastColorPreview.svelte"

  let {
    leftFigure = "v14",
    leftGround = "W",
    rightFigure = "v14",
    rightGround = "v2",
    iconId = "mynaui:flower-solid",
    separationPCCS
  }: {
    /** 左プレビューの図の色（PCCS表記） */
    leftFigure?: string
    /** 左プレビューの背景色（PCCS表記） */
    leftGround?: string
    /** 右プレビューの図の色（PCCS表記） */
    rightFigure?: string
    /** 右プレビューの背景色（PCCS表記） */
    rightGround?: string
    /** 図として表示するアイコンID */
    iconId?: string
    /** 指定された場合、図と地の境界線をこの色で描く（PCCS表記） */
    separationPCCS?: string
  } = $props()
</script>

<div class="previews">
  <div class="preview">
    <SVGWrapper>
      <ContrastColorPreview figure={leftFigure} ground={leftGround} {iconId} {separationPCCS} />
    </SVGWrapper>
  </div>
  <div class="preview">
    <SVGWrapper>
      <ContrastColorPreview figure={rightFigure} ground={rightGround} {iconId} {separationPCCS} />
    </SVGWrapper>
  </div>
</div>

<style>
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
</style>
