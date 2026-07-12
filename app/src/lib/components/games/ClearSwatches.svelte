<script lang="ts">
  interface Props {
    /** 並べて見せる色（HEX）。lightness は先頭が基準色、以降が正解色。tone 系は正解色のみ。 */
    colors: string[]
  }

  let { colors }: Props = $props()
</script>

<!--
  クリア演出（ClearOverlay）の説明文の下に置く色スウォッチ列。
  ClearOverlay は <p class="clear-desc"> の中に children を描画するため、
  ルートは phrasing content の span にしている（display: flex で改行して段落下に並ぶ）。
-->
<span class="clear-swatches">
  {#each colors as color, i (i)}
    <span class="clear-swatch" style="background: {color}"></span>
  {/each}
</span>

<style>
  .clear-swatches {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }

  .clear-swatch {
    width: 2rem;
    height: 2rem;
    border-radius: 4px;
    /* --color-border は ClearOverlay 側で定義され、portal 後も継承される。 */
    border: 1px solid var(--color-border, rgba(128, 128, 128, 0.4));
  }
</style>
