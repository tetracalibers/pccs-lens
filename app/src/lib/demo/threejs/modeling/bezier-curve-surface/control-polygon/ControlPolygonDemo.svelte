<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createControlPolygonScene, type ControlPolygonParams } from "./scene"

  // 制御点は canvas の上で直接ドラッグして動かすため、Tweakpane のパネルは付けない
  // （buildPane を渡さなければパネル自体が作られない）。共有するパラメータも無い
  const params: ControlPolygonParams = {}
</script>

<!-- 2 枚のパネルを正面から見比べる図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     注視点は見出しと制御点が収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="制御点が3つの場合と4つの場合を左右に並べた図。どちらも制御点を順に結んだ制御多角形を破線で、そこから求めたベジェ曲線を実線で重ねて描いている。制御点はドラッグで動かすことができ、動かすと制御多角形と曲線が引き直される。動かす前の曲線が薄く残るので、曲線がどれだけ引き寄せられたかを見比べられる（ホイールで拡大縮小）"
  createScene={createControlPolygonScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0.7, 7.2] }}
  orbit={{ target: [0, 0.7, 0], enableRotate: false, minDistance: 4.5, maxDistance: 13 }}
/>
