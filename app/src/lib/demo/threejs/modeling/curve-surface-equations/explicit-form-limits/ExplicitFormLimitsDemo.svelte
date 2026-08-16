<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createExplicitFormLimitsScene, type ExplicitFormLimitsParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // x・y は、円では 2 点、曲面ではせり出しの下に入って 3 つの高さが同時に見える位置から始める。
  // curveHits・surfaceHits は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ExplicitFormLimitsParams = {
    x: 0.4,
    y: 0.2,
    curveHits: "",
    surfaceHits: ""
  }
</script>

<!-- camera.position は、左右に並べた 2 つの図が初期表示で両端まで収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="陽関数形式で表せない2つの形の3次元表示。左は円で、x軸に沿って動く縦線が円と2点で交わる。右はせり出した曲面で、xy平面上の1点から立てた縦線が曲面と2つ以上の高さで交わる。x・yを動かすと縦線の位置が変わり、交わる点の数が変わる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createExplicitFormLimitsScene}
  {params}
  aspectRatio="2 / 1"
  camera={{ position: [0, 1.5, 6.4] }}
  orbit={{
    // 左の図の原点と右の図の曲面の中ほどが、どちらも視野の中心付近に来る高さを注視点にする
    target: [0, 0.15, 0],
    minDistance: 4,
    maxDistance: 16
  }}
  buildPane={(pane, p) => {
    // 円の外・曲面の外まで動かせる範囲にして、交点が 0 個になるところも見られるようにする
    pane.addBinding(p, "x", { min: -1.5, max: 1.5, step: 0.01, label: "x" })
    pane.addBinding(p, "y", { min: -1.5, max: 1.5, step: 0.01, label: "y（曲面のみ）" })
    pane.addBinding(p, "curveHits", { readonly: true, label: "円と交わる点" })
    pane.addBinding(p, "surfaceHits", { readonly: true, label: "曲面と交わる点" })
  }}
/>
