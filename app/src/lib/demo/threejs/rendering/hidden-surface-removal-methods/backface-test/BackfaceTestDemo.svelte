<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createBackfaceTestScene, type BackfaceTestParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 裏面を外した状態から始めて、切り替えると何が戻ってくるかを見せる。
  // measure は scene.ts が計算して書き戻すので、初期値は使われない
  const params: BackfaceTestParams = {
    targetFace: 0,
    cullBackFaces: true,
    measure: ""
  }

  // 選択肢の番号は scene.ts の createCubeFaces が返す面の順（+z・−z・+x・−x・+y・−y）。
  // 表裏は視点の位置から決まっていて動かないので、ラベルに書いておける。
  // 立方体の対角から見る視点なので、6 面がちょうど表 3 枚・裏 3 枚に分かれる
  const FACE_OPTIONS = {
    "表を向いた面 1": 0,
    "表を向いた面 2": 2,
    "表を向いた面 3": 4,
    "裏を向いた面 1": 1,
    "裏を向いた面 2": 3,
    "裏を向いた面 3": 5
  }
</script>

<!-- カメラは視点から 80 度ほど離れた位置に置く。
     視点方向ベクトルが画面の奥や手前を向いて短く潰れず、どの面を選んでも扇が読める向きになる -->
<ThreeDemoCanvas
  ariaLabel="半透明の立方体と、そこから離れた位置に固定した1つの視点の3次元表示。面の色は、その視点から見て表を向いた面と裏を向いた面で分かれている。選んだ1面にだけ、面に垂直な法線ベクトルnと、面から視点へ向かう視点方向ベクトルe、その2つがなす角を示す扇が付く。表を向いた面ではなす角が鋭角になり、裏を向いた面では鈍角になって、eが立方体の内部を貫く。既定では裏を向いた面を取り除いた状態で、裏面を外すを切り替えると裏を向いた面が暗い色で戻る（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createBackfaceTestScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [-4.6, 3.2, 6.5] }}
  orbit={{
    // 視点とそのラベルが上に出るので、注視点を立方体の中心より少し上に置く
    target: [0, 0.2, 0],
    minDistance: 5,
    maxDistance: 16,
    // 真上・真下から見ると扇が潰れて読めなくなるため、極付近まで回さない
    minPolarAngle: Math.PI * 0.14,
    maxPolarAngle: Math.PI * 0.78
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "targetFace", { options: FACE_OPTIONS, label: "注目する面" })
    pane.addBinding(p, "cullBackFaces", { label: "裏面を外す" })
    pane.addBinding(p, "measure", { readonly: true, label: "nとeのなす角" })
  }}
/>
