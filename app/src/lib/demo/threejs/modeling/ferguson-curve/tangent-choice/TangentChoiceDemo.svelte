<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createTangentChoiceScene, type TangentChoiceParams } from "./scene"

  // tangents は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない。
  // 接ベクトルの先は canvas の上で直接ドラッグして動かすため、操作するパラメータは無い
  const params: TangentChoiceParams = { tangents: "" }
</script>

<!-- 2 本の曲線を正面から見比べる図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     接ベクトルを大きくとると矢印が図の外まで伸びるので、引いて見られるよう maxDistance は広めにとる -->
<ThreeDemoCanvas
  ariaLabel="同じ3点を通る2本の複合ファーガソン曲線の図。通したい3点P₀・P₁・P₂を白い球で描き、そこから伸びる接ベクトルV₀・V₁・V₂を水色の矢印で示している。黄色の曲線はこの接ベクトルから引いたもので、薄い緑の曲線は同じ3点に別の接ベクトルを与えたときのもの。接ベクトルの先はドラッグで動かすことができ、動かすと黄色の曲線の形が変わる一方、3点は通り続ける（ホイールで拡大縮小）"
  createScene={createTangentChoiceScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0.7, -0.1, 5.9] }}
  orbit={{ target: [0.7, -0.1, 0], enableRotate: false, minDistance: 3, maxDistance: 15 }}
  buildPane={(pane, p) => {
    // 3 つぶんの値は 1 行に収まらないので、複数行のモニターにして 1 行 1 つで並べる
    // （scene.ts が改行で区切った文字列を書き戻す）
    pane.addBinding(p, "tangents", {
      readonly: true,
      multiline: true,
      rows: 3,
      label: "接ベクトル"
    })
  }}
/>
