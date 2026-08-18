<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createControlPolygonScene, type ControlPolygonParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は scene.ts が持つ制御点の初期位置と同じにする（薄く残す「動かす前の曲線」が
  // 初期表示で今の曲線とちょうど重なり、動かした量がそのまま差として見えるようにするため）
  const params: ControlPolygonParams = {
    quadratic: { x: 0, y: 1.4 },
    cubic: { x: -0.6, y: 1.4 }
  }
</script>

<!-- 2 枚のパネルを正面から見比べる図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     注視点は見出しと制御点が収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="制御点が3つの場合と4つの場合を左右に並べた図。どちらも制御点を順に結んだ制御多角形を破線で、そこから求めたベジェ曲線を実線で重ねて描いている。P₁を動かすと制御多角形と曲線が引き直され、動かす前の曲線が薄く残るので、曲線がどれだけ引き寄せられたかを見比べられる（ホイールで拡大縮小）"
  createScene={createControlPolygonScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0.7, 7.2] }}
  orbit={{ target: [0, 0.7, 0], enableRotate: false, minDistance: 4.5, maxDistance: 13 }}
  buildPane={(pane, p) => {
    // 2 次元のパッドは既定だと下へ動かしたときに y が増えるので、図の y 軸と揃うよう反転させる
    pane.addBinding(p, "quadratic", {
      label: "P₁ (制御点3つ)",
      x: { min: -2, max: 2, step: 0.05 },
      y: { min: -1.6, max: 2.1, step: 0.05, inverted: true }
    })
    pane.addBinding(p, "cubic", {
      label: "P₁ (制御点4つ)",
      x: { min: -2, max: 2, step: 0.05 },
      y: { min: -1.6, max: 2.1, step: 0.05, inverted: true }
    })
  }}
/>
