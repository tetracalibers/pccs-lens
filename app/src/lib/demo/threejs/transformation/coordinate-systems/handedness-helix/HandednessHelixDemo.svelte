<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createHandednessHelixScene, type HandednessHelixParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: HandednessHelixParams = { turns: 2.5, height: 1.9 }

  // 真正面から見ると、z 方向の鏡像は輪郭が重なって同じ形に見えてしまう。
  // 斜め上・斜め横から見る位置を初期値にして、どちらが手前を通っているかが分かるようにする
  const cameraPosition: [number, number, number] = [1.9, 2.4, 7]
</script>

<ThreeDemoCanvas
  ariaLabel="右手系と左手系を左右に並べた3次元表示。x軸は右、y軸は上で共通、z軸は右手系が手前・左手系が奥を向く。同じ頂点データから作った、y軸のまわりを回りながら上へ伸びる半透明のらせんが両方に置かれ、右手系では右ねじ、左手系では左ねじの向きに巻いた鏡像になる。らせんの先頭（下端）はピンク、末尾（上端）は紫の球で示し、上下の向きはどちらの系でも変わらない。薄く塗ったxy平面が、らせんや点が手前を通るか奥を通るかの目印になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createHandednessHelixScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: cameraPosition }}
  orbit={{
    minDistance: 4.5,
    maxDistance: 20,
    minPolarAngle: Math.PI * 0.06,
    maxPolarAngle: Math.PI * 0.94
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "turns", {
      min: 0.5,
      max: 3,
      step: 0.1,
      format: (value: number) => `${value.toFixed(1)}周`,
      label: "らせんの巻き数"
    })
    pane.addBinding(p, "height", { min: 0.6, max: 2.4, step: 0.05, label: "らせんの高さ" })
  }}
/>
