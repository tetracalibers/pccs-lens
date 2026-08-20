<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createConvexHullScene, type ConvexHullParams } from "./scene"

  // 制御点は canvas の上で直接ドラッグして動かすため、Tweakpane のパネルは付けない
  // （buildPane を渡さなければパネル自体が作られない）。共有するパラメータも無い
  const params: ConvexHullParams = {}
</script>

<!-- 凸包・制御多角形・曲線の重なりを正面から見る図なので、回り込みは付けずに固定する
     （拡大縮小だけ残す）。制御点を動かせる範囲とそのラベルが収まる距離にカメラを置く -->
<ThreeDemoCanvas
  ariaLabel="4つの制御点から作った3次ベジェ曲線と、その制御点の凸包の図。制御点を順に結んだ制御多角形を破線で、制御点の凸包を薄く塗った領域で、曲線を実線で重ねて描いている。初期の配置では制御多角形にへこみがあり、へこんだ制御点は凸包の頂点から外れて内側に入る。曲線は凸包の内側に収まる。制御点はドラッグで動かすことができ、動かすと凸包・制御多角形・曲線が引き直される（ホイールで拡大縮小）"
  createScene={createConvexHullScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0, 0, 5] }}
  orbit={{ enableRotate: false, minDistance: 3, maxDistance: 11 }}
/>
