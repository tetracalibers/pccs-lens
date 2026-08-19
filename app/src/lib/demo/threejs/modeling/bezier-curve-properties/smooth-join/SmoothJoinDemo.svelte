<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSmoothJoinScene, type SmoothJoinParams } from "./scene"

  // 制御点は canvas の上で直接ドラッグして動かし、繋ぎ目の接する向きは常に揃えたままにするため、
  // Tweakpane のパネルは付けない（buildPane を渡さなければパネル自体が作られない）。
  // 共有するパラメータも無い
  const params: SmoothJoinParams = {}
</script>

<!-- 2 本の曲線を横に並べて正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="2本の3次ベジェ曲線を1つの制御点で繋いだ図。1本目を黄色、2本目を緑で描き、それぞれの制御多角形を破線で重ねている。繋ぎ目に入ってくる向きと出ていく向きは2本の水色の矢印で示していて、この2本は常に一直線に並ぶため、繋ぎ目には角がなく滑らかに繋がっている。制御点はドラッグで動かすことができ、動かしても繋ぎ目の隣の制御点が向きの延長上へ付いていく（ホイールで拡大縮小）"
  createScene={createSmoothJoinScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0.15, 5.4] }}
  orbit={{ target: [0, 0.15, 0], enableRotate: false, minDistance: 3, maxDistance: 11 }}
/>
