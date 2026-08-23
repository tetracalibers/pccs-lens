<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createTangentMagnitudeScene, type TangentMagnitudeParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // magnitude は、曲線がまだ浅く膨らんだだけの状態から始める。
  // controls・offset・crossing は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: TangentMagnitudeParams = { magnitude: 2, controls: "", offset: "", crossing: "" }
</script>

<!-- 大きさの違いを正面から見比べる図なので、回り込みは付けずに固定する。
     大きさを上げていくと接ベクトルの矢印は図の外まで伸びる（曲線と制御点は枠内に収まり続ける）ので、
     矢印の先まで見たいときに引けるよう maxDistance は広めにとる -->
<ThreeDemoCanvas
  ariaLabel="接ベクトルの大きさを変えたファーガソン曲線の図。両端の点P₀・P₁と接ベクトルの向きは固定で、大きさだけをスライダーで変えられる。対応するベジェ曲線の制御点Q₁・Q₂を紫の球で重ね、P₀からQ₁・Q₂からP₁を結ぶ制御多角形を破線で描いている。大きさを上げるほど制御点が端点から離れて曲線は外側へ膨らみ、弦の3.5倍あたりを超えると曲線が自分自身と交わる（ホイールで拡大縮小）"
  createScene={createTangentMagnitudeScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0.3, 0, 4.6] }}
  orbit={{ target: [0.3, 0, 0], enableRotate: false, minDistance: 2.5, maxDistance: 26 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "magnitude", {
      min: 0.6,
      max: 11,
      step: 0.05,
      label: "接ベクトルの大きさ"
    })
    // 制御点は 2 つぶんで 1 行に収まらないので、複数行のモニターにして 1 行 1 つで並べる
    // （scene.ts が改行で区切った文字列を書き戻す）
    pane.addBinding(p, "controls", { readonly: true, multiline: true, rows: 2, label: "制御点" })
    pane.addBinding(p, "offset", { readonly: true, label: "大きさの1/3" })
    pane.addBinding(p, "crossing", { readonly: true, label: "自己交差" })
  }}
/>
