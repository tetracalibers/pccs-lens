<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createScanlineSpanScene, type ScanlineSpanParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // left と right は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: ScanlineSpanParams = {
    apexX: 6,
    scanline: 5,
    left: "",
    right: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子に置いた三角形を、スキャンラインを1行ずつ下へずらしながら塗る図。スキャンラインが三角形の辺と交わる2点が交点として示され、その間のスパンに中心が入る画素が塗られる（ホイールで拡大縮小）"
  createScene={createScanlineSpanScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.0] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "scanline", { min: 0, max: 9, step: 1, label: "スキャンラインの行" })
    pane.addBinding(p, "apexX", { min: 3, max: 12, step: 0.5, label: "上の頂点のx座標" })
    pane.addBinding(p, "left", { readonly: true, label: "左の交点 x" })
    pane.addBinding(p, "right", { readonly: true, label: "右の交点 x" })
  }}
/>
