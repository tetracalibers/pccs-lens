<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createConvexHullScene, type ConvexHullParams } from "./scene"

  // 制御点は canvas の上で直接ドラッグして動かすため、Tweakpane のパネルは付けない
  // （buildPane を渡さなければパネル自体が作られない）。共有するパラメータも無い
  const params: ConvexHullParams = {}
</script>

<!-- 2 枚のパネルを正面から見比べる図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     注視点は見出しと制御点が収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="制御多角形にへこみがある配置と、へこみのない配置を左右に並べた図。どちらも4つの制御点を順に結んだ制御多角形を破線で、制御点の凸包を薄く塗った領域で、そこから求めた3次ベジェ曲線を実線で重ねて描いている。へこんだ配置では、へこんだ制御点が凸包の頂点から外れて内側に入る。どちらの配置でも曲線は凸包の内側に収まる。制御点はドラッグで動かすことができ、動かすと凸包・制御多角形・曲線が引き直される（ホイールで拡大縮小）"
  createScene={createConvexHullScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0.55, 7.2] }}
  orbit={{ target: [0, 0.55, 0], enableRotate: false, minDistance: 4.5, maxDistance: 13 }}
/>
