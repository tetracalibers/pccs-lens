<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createEndpointTangentScene, type EndpointTangentParams } from "./scene"

  // start・end は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない。
  // 制御点は canvas の上で直接ドラッグして動かすため、操作するパラメータは無い
  const params: EndpointTangentParams = { start: "", end: "" }
</script>

<!-- 制御多角形と曲線を正面から見比べる図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     接ベクトルは辺の 3 倍まで伸びるので、制御点を大きく動かしたときに引いて見られるよう
     maxDistance は広めにとる。注視点は矢印の先まで収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="4つの制御点から作った3次ベジェ曲線の図。制御点を順に結んだ制御多角形を破線で描き、接ベクトルの向きを決める最初の辺と最後の辺だけを実線で重ねている。両端の制御点からは、その辺と同じ向きに辺の3倍の長さで伸びる接ベクトルを矢印で描いている。制御点はドラッグで動かすことができ、動かすと曲線と接ベクトルが引き直される（ホイールで拡大縮小）"
  createScene={createEndpointTangentScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0.35, 5.6] }}
  orbit={{ target: [0, 0.35, 0], enableRotate: false, minDistance: 3, maxDistance: 14 }}
  buildPane={(pane, p) => {
    // 辺のベクトルとその 3 倍は 1 行に収まらないので、複数行のモニターにして 1 行 1 つで並べる
    // （scene.ts が改行で区切った文字列を書き戻す）
    pane.addBinding(p, "start", { readonly: true, multiline: true, rows: 2, label: "始点" })
    pane.addBinding(p, "end", { readonly: true, multiline: true, rows: 2, label: "終点" })
  }}
/>
