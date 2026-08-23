<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createEndpointConditionsScene, type EndpointConditionsParams } from "./scene"

  // endpoints・tangents は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない。
  // 両端の点と接ベクトルの先は canvas の上で直接ドラッグして動かすため、操作するパラメータは無い
  const params: EndpointConditionsParams = { endpoints: "", tangents: "" }
</script>

<!-- 曲線と接ベクトルを正面から見比べる図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     接ベクトルを大きくとると矢印が図の外まで伸びるので、引いて見られるよう maxDistance は広めにとる -->
<ThreeDemoCanvas
  ariaLabel="両端の位置と接ベクトルの4つを条件として与えたファーガソン曲線の図。両端の点P₀・P₁を紫の球で、そこから伸びる接ベクトルV₀・V₁を水色の矢印で描き、4つの条件を満たす3次曲線を黄色で重ねている。曲線の上の小さな矢印は、始点から終点へ進む向きを示している。両端の点と接ベクトルの先はドラッグで動かすことができ、動かすと曲線が引き直される（ホイールで拡大縮小）"
  createScene={createEndpointConditionsScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0.4, 0.2, 5.4] }}
  orbit={{ target: [0.4, 0.2, 0], enableRotate: false, minDistance: 3, maxDistance: 13 }}
  buildPane={(pane, p) => {
    // 両端ぶんの値は 1 行に収まらないので、複数行のモニターにして 1 行 1 つで並べる
    // （scene.ts が改行で区切った文字列を書き戻す）
    pane.addBinding(p, "endpoints", { readonly: true, multiline: true, rows: 2, label: "位置" })
    pane.addBinding(p, "tangents", {
      readonly: true,
      multiline: true,
      rows: 2,
      label: "接ベクトル"
    })
  }}
/>
