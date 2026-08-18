<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createGeneratrixRevolutionScene, type GeneratrixRevolutionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 回転角の初期値は、掃かれた面と「まだ回していない範囲」がどちらも目に入る値にする
  const params: GeneratrixRevolutionParams = {
    rotationDeg: 235
  }
</script>

<!-- パネルを含めた全体が縦長にならないよう canvas は横長にし、
     上下に長い円錐面が端まで収まる距離にカメラを置く -->
<ThreeDemoCanvas
  ariaLabel="1本の母線を軸のまわりに回して円錐面が描かれていくところの3次元表示。回転角を動かすと、母線が通った跡が面として残り、頂点を挟んで上下2つの面が同時に広がっていく。360度まで回すと面が閉じる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createGeneratrixRevolutionScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [2.4, 1.6, 7] }}
  orbit={{ minDistance: 5, maxDistance: 18 }}
  buildPane={(pane, p) => {
    // 1 周ぶんを動かせるようにする
    pane.addBinding(p, "rotationDeg", { min: 0, max: 360, step: 1, label: "回転角（度）" })
  }}
/>
