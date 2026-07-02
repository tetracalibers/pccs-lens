<script lang="ts">
  import SVGWrapper from "../SVGWrapper.svelte"
  import ContrastColorPreview from "./ContrastColorPreview.svelte"

  // ===== 図（アイコン）=====
  const ICON_ID = "bi:star-fill"

  // ===== 配色（PCCS表記）=====
  // 左: 白背景 × v14 の図 / 右: v2 背景 × v14 の図
  const LEFT_FIGURE = "v14"
  const LEFT_GROUND = "W"
  const RIGHT_FIGURE = "v14"
  const RIGHT_GROUND = "v2"
</script>

<div class="previews">
  <div class="preview">
    <SVGWrapper>
      <ContrastColorPreview figure={LEFT_FIGURE} ground={LEFT_GROUND} iconId={ICON_ID} />
    </SVGWrapper>
  </div>
  <div class="preview">
    <SVGWrapper>
      <ContrastColorPreview figure={RIGHT_FIGURE} ground={RIGHT_GROUND} iconId={ICON_ID} />
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
