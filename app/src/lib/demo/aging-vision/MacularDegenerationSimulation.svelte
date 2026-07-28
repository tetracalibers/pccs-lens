<script lang="ts">
  import JapaneseGarden from "$lib/assets/japanese-style_00007.jpg?enhanced"

  interface Props {
    /** 画像の幅の上限（px）。省略時は置かれた場所の幅いっぱいに広がる */
    maxW?: number
  }

  let { maxW }: Props = $props()

  // ===== 画像 =====
  // フィルタのパラメータはすべて画像の実寸に対する比・視野角で持ち、SVG の viewBox を
  // 実寸に合わせる。表示サイズが変わっても図全体が相似に拡大縮小され、見え方が変わらない。
  const IMAGE_SRC = JapaneseGarden.img.src
  const IMAGE_WIDTH = JapaneseGarden.img.w
  const IMAGE_HEIGHT = JapaneseGarden.img.h

  // ===== 画像が対応する視野角 =====
  // GlaucomaFieldLossSimulation と同じく、画像の横幅がおよそ70度の視野に相当するとみなす
  const FIELD_WIDTH_DEG = 70
  const UNIT_PER_DEG = IMAGE_WIDTH / FIELD_WIDTH_DEG

  // ===== 固視点（視野の中心） =====
  // 加齢黄斑変性で障害されるのは網膜の中心にある黄斑なので、症状はここを中心に現れる
  const FIXATION_X = IMAGE_WIDTH / 2
  const FIXATION_Y = IMAGE_HEIGHT / 2

  // ===== 変視症 =====
  // 黄斑の網膜がむくみ・はがれで凹凸になると、そこに映る像がうねって見える。
  // ゆるやかなノイズで像を変位させて再現する。
  const WARP_OUTER_DEG = 22 // この半径より外では歪まない（画像の上下端の内側に収める）
  const WARP_FLATNESS = 3 // 大きいほど中心付近の歪みが平坦に広がる
  const WARP_FALLOFF_GAMMA = 4 // 大きいほど周辺で急に弱まる
  const WARP_STRENGTH_DEG = 6 // 歪みの強さ。変位マップの振れ幅にあたる
  const WARP_CYCLES = 13 // 画像の横幅あたりのうねりの周期数
  const WARP_OCTAVES = 2
  const WARP_SEED = 7

  // ===== 中心暗点 =====
  const SCOTOMA_RADIUS_DEG = 9 // 暗点の濃さが半分になる半径
  const SCOTOMA_FALLOFF_GAMMA = 8 // 大きいほど輪郭がはっきりする
  const SCOTOMA_GAIN = 0.3 // 暗点内の明るさ（1 なら元のまま）
  const SCOTOMA_BLUR = 0.025 * IMAGE_HEIGHT // 暗点内のぼけ
  const SCOTOMA_EDGE_WARP = 0.08 * IMAGE_HEIGHT // 輪郭を崩す量
  const SCOTOMA_EDGE_BLUR = 0.01 * IMAGE_HEIGHT // 輪郭のぼかし

  // ===== 変位マップ =====
  const NOISE_FREQUENCY = WARP_CYCLES / IMAGE_WIDTH
  // feDisplacementMap の変位量は (チャンネル値 - 0.5) × scale。
  // 中間値が変位なしを表すので、振れ幅の2倍を scale に渡す。
  const WARP_SCALE = 2 * WARP_STRENGTH_DEG * UNIT_PER_DEG
  // 中間値（＝変位なし）。fractalNoise の α を 1 に潰す下地も兼ねる
  const NEUTRAL_GRAY = "rgb(50%, 50%, 50%)"

  // 平坦な面を点光源で照らすと、中心からの距離 r における明るさが
  //   (Z / sqrt(r^2 + Z^2)) ^ GAMMA
  // の放射状の勾配になる。これを症状を中心付近だけに効かせる重みとして使う。
  const falloffAt = (radius: number, z: number, gamma: number): number =>
    (z / Math.hypot(radius, z)) ** gamma

  // 勾配が 0.5 になる距離が指定した半径と一致するよう Z を決める
  const lightZ = (radius: number, gamma: number): number =>
    radius / Math.sqrt(2 ** (2 / gamma) - 1)

  // 歪みの重みは、この勾配の裾を切り落として使う。勾配自体は 0 に達しないため、
  // そのままでは画像の端まで弱く歪んでしまう。Z を半径より十分大きく取って
  // 中心付近を平坦にしたうえで、WARP_OUTER でちょうど 0 になるよう
  // feFuncR の amplitude / offset で線形に引き伸ばす（0 未満は 0 に丸められる）。
  const WARP_OUTER = WARP_OUTER_DEG * UNIT_PER_DEG
  const WARP_LIGHT_Z = WARP_FLATNESS * WARP_OUTER
  const WARP_CUTOFF = falloffAt(WARP_OUTER, WARP_LIGHT_Z, WARP_FALLOFF_GAMMA)
  const WARP_AMPLITUDE = 1 / (1 - WARP_CUTOFF)
  const WARP_OFFSET = -WARP_CUTOFF / (1 - WARP_CUTOFF)

  const SCOTOMA_LIGHT_Z = lightZ(SCOTOMA_RADIUS_DEG * UNIT_PER_DEG, SCOTOMA_FALLOFF_GAMMA)

  const DARKEN_MATRIX = [
    `${SCOTOMA_GAIN} 0 0 0 0`,
    `0 ${SCOTOMA_GAIN} 0 0 0`,
    `0 0 ${SCOTOMA_GAIN} 0 0`,
    `0 0 0 1 0`
  ].join("\n")

  // 赤チャンネルの値を α に移し、重みの勾配をマスクとして使えるようにする
  const RED_TO_ALPHA_MATRIX = [
    `0 0 0 0 0`,
    `0 0 0 0 0`,
    `0 0 0 0 0`,
    `1 0 0 0 0`
  ].join("\n")
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {IMAGE_WIDTH} {IMAGE_HEIGHT}"
  style:--_max-w={maxW ? `${maxW}px` : "none"}
>
  <defs>
    <filter id="macular-degeneration" color-interpolation-filters="sRGB">
      <!-- 照明で勾配をつくるための平坦な面と、変位なしを表す中間値の下地 -->
      <feFlood flood-color="#fff" result="flat" />
      <feFlood flood-color={NEUTRAL_GRAY} result="neutral" />

      <!-- 歪みの元になるゆるやかなノイズ。fractalNoise は α にもノイズが乗り
           変位量が画素ごとにばらつくため、中間値の下地に重ねて α を 1 にする -->
      <feTurbulence
        type="fractalNoise"
        baseFrequency={NOISE_FREQUENCY}
        numOctaves={WARP_OCTAVES}
        seed={WARP_SEED}
        result="rawNoise"
      />
      <feComposite in="rawNoise" in2="neutral" operator="over" result="noise" />

      <!-- 歪みを効かせる範囲の重み -->
      <feDiffuseLighting
        in="flat"
        surfaceScale="0"
        diffuseConstant="1"
        lighting-color="#fff"
        result="warpFalloff"
      >
        <fePointLight x={FIXATION_X} y={FIXATION_Y} z={WARP_LIGHT_Z} />
      </feDiffuseLighting>
      <feComponentTransfer in="warpFalloff" result="warpWeight">
        <feFuncR
          type="gamma"
          exponent={WARP_FALLOFF_GAMMA}
          amplitude={WARP_AMPLITUDE}
          offset={WARP_OFFSET}
        />
        <feFuncG
          type="gamma"
          exponent={WARP_FALLOFF_GAMMA}
          amplitude={WARP_AMPLITUDE}
          offset={WARP_OFFSET}
        />
        <feFuncB
          type="gamma"
          exponent={WARP_FALLOFF_GAMMA}
          amplitude={WARP_AMPLITUDE}
          offset={WARP_OFFSET}
        />
      </feComponentTransfer>

      <!-- 重み w でノイズを中間値へ寄せた変位マップ： 0.5 + w × (noise - 0.5)。
           中心付近ではノイズがそのまま効き、周辺では中間値＝変位なしに戻る -->
      <feComposite
        in="noise"
        in2="warpWeight"
        operator="arithmetic"
        k1="1"
        k2="0"
        k3="-0.5"
        k4="0.5"
        result="warpMap"
      />

      <!-- 変視症：黄斑に映る範囲の像だけがうねる -->
      <feDisplacementMap
        in="SourceGraphic"
        in2="warpMap"
        scale={WARP_SCALE}
        xChannelSelector="R"
        yChannelSelector="G"
        result="warped"
      />

      <!-- 中心暗点の範囲。真円にならないようノイズで輪郭を崩し、境界をぼかす -->
      <feDiffuseLighting
        in="flat"
        surfaceScale="0"
        diffuseConstant="1"
        lighting-color="#fff"
        result="scotomaFalloff"
      >
        <fePointLight x={FIXATION_X} y={FIXATION_Y} z={SCOTOMA_LIGHT_Z} />
      </feDiffuseLighting>
      <feComponentTransfer in="scotomaFalloff" result="scotomaWeight">
        <feFuncR type="gamma" exponent={SCOTOMA_FALLOFF_GAMMA} />
        <feFuncG type="gamma" exponent={SCOTOMA_FALLOFF_GAMMA} />
        <feFuncB type="gamma" exponent={SCOTOMA_FALLOFF_GAMMA} />
      </feComponentTransfer>
      <feDisplacementMap
        in="scotomaWeight"
        in2="noise"
        scale={SCOTOMA_EDGE_WARP}
        xChannelSelector="R"
        yChannelSelector="G"
        result="scotomaWeightWarped"
      />
      <feGaussianBlur
        in="scotomaWeightWarped"
        stdDeviation={SCOTOMA_EDGE_BLUR}
        result="scotomaWeightSoft"
      />
      <feColorMatrix
        in="scotomaWeightSoft"
        type="matrix"
        values={RED_TO_ALPHA_MATRIX}
        result="scotomaMask"
      />

      <!-- 暗点内の見え方：像がぼやけ、暗くなる -->
      <feGaussianBlur in="warped" stdDeviation={SCOTOMA_BLUR} result="scotomaBlur" />
      <feColorMatrix
        in="scotomaBlur"
        type="matrix"
        values={DARKEN_MATRIX}
        result="scotomaImage"
      />

      <!-- 歪んだ像に暗点を重ねる -->
      <feComposite in="scotomaImage" in2="scotomaMask" operator="in" result="scotomaPatch" />
      <feComposite in="scotomaPatch" in2="warped" operator="over" />
    </filter>
  </defs>

  <image
    href={IMAGE_SRC}
    x="0"
    y="0"
    width={IMAGE_WIDTH}
    height={IMAGE_HEIGHT}
    filter="url(#macular-degeneration)"
  />
</svg>

<style>
  /* viewBox が画像の実寸なので、svg の枠は画像にぴったり一致する */
  svg {
    display: block;
    width: 100%;
    height: auto;
    max-width: var(--_max-w);
    margin-inline: auto;
  }
</style>
