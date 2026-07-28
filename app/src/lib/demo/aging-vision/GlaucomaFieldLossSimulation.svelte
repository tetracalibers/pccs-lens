<script lang="ts">
  import { areaRadial, curveLinear } from "d3-shape"
  import JapaneseGarden from "$lib/assets/japanese-style_00007.jpg?enhanced"

  interface Props {
    /** 円の直径の上限（px）。省略時は置かれた場所の幅いっぱいに広がる */
    maxW?: number
  }

  let { maxW }: Props = $props()

  // ===== 画像 =====
  // 重ねる SVG の viewBox を画像に合わせるため、実寸を使う。
  // 暗点内に敷く「ぼかして暗くした版」は SVG の <image> として取り込む。
  const IMAGE_SRC = JapaneseGarden.img.src
  const IMAGE_WIDTH = JapaneseGarden.img.w
  const IMAGE_HEIGHT = JapaneseGarden.img.h

  // ===== 視野を表す円 =====
  // 画像の高さいっぱいを直径とする円で切り抜く。円に余白なくフィットさせるため、
  // 画像の中央から正方形を切り出し、その内接円をくり抜く。
  const FIELD_SIZE = IMAGE_HEIGHT
  const FIELD_OFFSET_X = (IMAGE_WIDTH - FIELD_SIZE) / 2

  // ===== 画像が対応する視野角 =====
  // 画像の横幅がおよそ70度の視野に相当するとみなし、以下の角度指定を
  // 画像上の位置に変換する。角度は右を0度、反時計回りに測る。
  const FIELD_WIDTH_DEG = 70
  const UNIT_PER_DEG = IMAGE_WIDTH / FIELD_WIDTH_DEG

  // ===== 固視点（視野の中心） =====
  const FIXATION_X = IMAGE_WIDTH / 2
  const FIXATION_Y = IMAGE_HEIGHT / 2

  // ===== 欠損の形状（中等度を想定） =====
  // 以下の角度・半径を差し替えれば、軽度・重度のプリセットも作れる。
  // 鼻側を左（右眼を想定）とし、上方の視野に欠損を置く。

  // 弓状暗点：固視点を取り巻く弧。中心から30度以内に生じることが多い
  const ARCUATE_RADIUS_DEG = 14
  const ARCUATE_HALF_WIDTH_DEG = 4.5
  const ARCUATE_FROM_DEG = 0 // 耳側（マリオット盲点のある側）の端
  const ARCUATE_TO_DEG = 180 // 鼻側の端
  const ARCUATE_TAPER_DEG = 65 // 耳側の端で細くなる角度範囲
  const ARCUATE_TAPER_MIN = 0.4 // 耳側の端の太さ（最大に対する比）

  // 鼻側階段：弓状暗点の外側から周辺へ広がり、水平経線で段差になる
  const NASAL_STEP_FROM_DEG = 152
  const NASAL_STEP_TO_DEG = 180
  const NASAL_STEP_INNER_DEG = 18
  const NASAL_STEP_OUTER_DEG = 34

  // 小さな暗点：固視点の近くに孤立して現れる
  const PARACENTRAL_ANGLE_DEG = 135
  const PARACENTRAL_RADIUS_DEG = 7
  const PARACENTRAL_LENGTH_DEG = 3.5 // 弧に沿う方向の半径
  const PARACENTRAL_WIDTH_DEG = 2.6 // 動径方向の半径

  const BAND_SAMPLES = 64 // 帯の輪郭を折れ線で近似する分割数

  // ===== 境界の処理 =====
  // 形をノイズでわずかに歪ませたうえで、境界を大きくぼかす。
  // 実際の視野欠損は輪郭のはっきりした穴ではなく、感度がなだらかに落ちた領域。
  // ぼかし量・変位量は円の直径に対する比で持つ。表示サイズが変わっても
  // 図全体が相似に拡大縮小され、見え方が変わらない。
  const NOISE_CYCLES = 9.6 // 円の直径あたりのノイズの周期数
  const NOISE_FREQUENCY = NOISE_CYCLES / FIELD_SIZE
  const NOISE_OCTAVES = 2
  const NOISE_SEED = 12
  const DISPLACEMENT_SCALE = 0.008 * FIELD_SIZE
  const EDGE_BLUR = 0.029 * FIELD_SIZE

  // ===== 暗点内の見え方 =====
  // 暗くするだけでは像がそのまま見えてしまうので、あわせて像をぼかす
  const SCOTOMA_BLUR = 0.021 * FIELD_SIZE
  const SCOTOMA_GAIN = 0.5 // 暗点内の明るさ（1 なら元のまま）

  const DARKEN_MATRIX = [
    `${SCOTOMA_GAIN} 0 0 0 0`,
    `0 ${SCOTOMA_GAIN} 0 0 0`,
    `0 0 ${SCOTOMA_GAIN} 0 0`,
    `0 0 0 1 0`
  ].join("\n")

  const smoothstep = (t: number): number => {
    const x = Math.min(Math.max(t, 0), 1)
    return x * x * (3 - 2 * x)
  }

  // 極座標の帯をパスにする。d3 の極座標は真上を0・時計回りなので、
  // 右を0・反時計回りの角度から変換する。
  const radialBand = (
    fromDeg: number,
    toDeg: number,
    innerRadiusAt: (deg: number) => number,
    outerRadiusAt: (deg: number) => number
  ): string => {
    const degrees = Array.from(
      { length: BAND_SAMPLES },
      (_, index) => fromDeg + ((toDeg - fromDeg) * index) / (BAND_SAMPLES - 1)
    )
    const generator = areaRadial<number>()
      .angle((deg) => ((90 - deg) * Math.PI) / 180)
      .innerRadius(innerRadiusAt)
      .outerRadius(outerRadiusAt)
      .curve(curveLinear)
    return generator(degrees) ?? ""
  }

  const ARCUATE_RADIUS = ARCUATE_RADIUS_DEG * UNIT_PER_DEG
  const ARCUATE_HALF_WIDTH = ARCUATE_HALF_WIDTH_DEG * UNIT_PER_DEG

  // 耳側の端をすぼめ、鼻側では太いまま水平経線に達する形にする
  const arcuateHalfWidthAt = (deg: number): number =>
    ARCUATE_HALF_WIDTH *
    (ARCUATE_TAPER_MIN +
      (1 - ARCUATE_TAPER_MIN) * smoothstep((deg - ARCUATE_FROM_DEG) / ARCUATE_TAPER_DEG))

  const ARCUATE_PATH = radialBand(
    ARCUATE_FROM_DEG,
    ARCUATE_TO_DEG,
    (deg) => ARCUATE_RADIUS - arcuateHalfWidthAt(deg),
    (deg) => ARCUATE_RADIUS + arcuateHalfWidthAt(deg)
  )

  const NASAL_STEP_PATH = radialBand(
    NASAL_STEP_FROM_DEG,
    NASAL_STEP_TO_DEG,
    () => NASAL_STEP_INNER_DEG * UNIT_PER_DEG,
    () => NASAL_STEP_OUTER_DEG * UNIT_PER_DEG
  )

  const PARACENTRAL_RAD = (PARACENTRAL_ANGLE_DEG * Math.PI) / 180
  const PARACENTRAL_X =
    FIXATION_X + PARACENTRAL_RADIUS_DEG * UNIT_PER_DEG * Math.cos(PARACENTRAL_RAD)
  const PARACENTRAL_Y =
    FIXATION_Y - PARACENTRAL_RADIUS_DEG * UNIT_PER_DEG * Math.sin(PARACENTRAL_RAD)
  // 長い方の半径を弧の接線方向に向ける
  const PARACENTRAL_ROTATION = 90 - PARACENTRAL_ANGLE_DEG
</script>

<div class="simulation" style:--_max-w={maxW ? `${maxW}px` : "none"}>
  <enhanced:img src={JapaneseGarden} alt="" />
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="{FIELD_OFFSET_X} 0 {FIELD_SIZE} {FIELD_SIZE}"
  >
    <defs>
      <!-- 欠損の形をわずかに歪ませ、境界をぼかす -->
      <filter
        id="glaucoma-defect-edge"
        x="-25%"
        y="-35%"
        width="150%"
        height="170%"
        color-interpolation-filters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency={NOISE_FREQUENCY}
          numOctaves={NOISE_OCTAVES}
          seed={NOISE_SEED}
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale={DISPLACEMENT_SCALE}
          xChannelSelector="R"
          yChannelSelector="G"
          result="warped"
        />
        <feGaussianBlur in="warped" stdDeviation={EDGE_BLUR} />
      </filter>

      <!-- 暗点内の見え方：像がぼやけ、暗くなる -->
      <filter id="glaucoma-scotoma" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation={SCOTOMA_BLUR} result="blurred" />
        <feColorMatrix in="blurred" type="matrix" values={DARKEN_MATRIX} />
      </filter>

      <mask id="glaucoma-field-loss">
        <g filter="url(#glaucoma-defect-edge)" fill="#fff">
          <path d={ARCUATE_PATH} transform="translate({FIXATION_X} {FIXATION_Y})" />
          <path d={NASAL_STEP_PATH} transform="translate({FIXATION_X} {FIXATION_Y})" />
          <ellipse
            cx={PARACENTRAL_X}
            cy={PARACENTRAL_Y}
            rx={PARACENTRAL_LENGTH_DEG * UNIT_PER_DEG}
            ry={PARACENTRAL_WIDTH_DEG * UNIT_PER_DEG}
            transform="rotate({PARACENTRAL_ROTATION} {PARACENTRAL_X} {PARACENTRAL_Y})"
          />
        </g>
      </mask>
    </defs>

    <image
      href={IMAGE_SRC}
      x="0"
      y="0"
      width={IMAGE_WIDTH}
      height={IMAGE_HEIGHT}
      filter="url(#glaucoma-scotoma)"
      mask="url(#glaucoma-field-loss)"
    />
  </svg>
</div>

<style>
  /* 正方形の枠に内接する円で切り抜く */
  .simulation {
    position: relative;
    aspect-ratio: 1;
    max-width: var(--_max-w);
    margin-inline: auto;
    clip-path: circle(closest-side at 50% 50%);
  }

  /* 正方形の枠に合わせて中央を切り出す */
  .simulation :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 画像と同じ位置・同じ大きさに重ねる */
  .simulation svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
