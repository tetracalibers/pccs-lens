<script lang="ts">
  import CherryBlossom from "$lib/assets/cherry-blossom_00009.jpg?enhanced"

  interface DensityPoint {
    nm: number
    density: number
  }

  interface ChannelBand {
    key: "r" | "g" | "b"
    peakNm: number
    sigmaNm: number
  }

  // ===== 画像の表示サイズ =====
  const IMAGE_MAX_WIDTH = 480

  // ===== 比較する年齢 =====
  // 同ページの LensSpectralTransmittance が描く曲線の両端に合わせる
  const AGE_YOUNG = 20
  const AGE_OLD = 80

  // ===== 色順応の度合い（0 = 順応なし / 1 = 完全順応） =====
  // 透過率の低下をそのまま適用すると青がほぼ消えてしまうが、実際の観察者は
  // 黄変した水晶体越しの光に色順応するため、そこまで極端な黄色さは知覚しない。
  // von Kries 型の部分順応として、各チャンネルの利得を T^(1 - ADAPTATION) に緩める。
  const ADAPTATION = 0.5

  // ===== 水晶体の分光透過率モデル =====
  // Pokorny, Smith & Lutze (1987) の加齢モデル。32歳の水晶体の分光光学濃度 D32(λ) に
  // 年齢係数 k(A) を掛け、透過率 T = 10^(-D) を求める（LensSpectralTransmittance と同じ表）。
  //   A <= 60: k(A) = 1 + 0.02 * (A - 32)
  //   A >  60: k(A) = 1.56 + 0.0667 * (A - 56)
  const DENSITY_32: DensityPoint[] = [
    { nm: 400, density: 1.1 },
    { nm: 410, density: 0.95 },
    { nm: 420, density: 0.83 },
    { nm: 430, density: 0.72 },
    { nm: 440, density: 0.63 },
    { nm: 450, density: 0.56 },
    { nm: 460, density: 0.49 },
    { nm: 470, density: 0.43 },
    { nm: 480, density: 0.38 },
    { nm: 490, density: 0.33 },
    { nm: 500, density: 0.29 },
    { nm: 510, density: 0.25 },
    { nm: 520, density: 0.22 },
    { nm: 530, density: 0.19 },
    { nm: 540, density: 0.16 },
    { nm: 550, density: 0.14 },
    { nm: 560, density: 0.12 },
    { nm: 570, density: 0.1 },
    { nm: 580, density: 0.085 },
    { nm: 590, density: 0.07 },
    { nm: 600, density: 0.06 },
    { nm: 610, density: 0.05 },
    { nm: 620, density: 0.04 },
    { nm: 630, density: 0.032 },
    { nm: 640, density: 0.025 },
    { nm: 650, density: 0.02 }
  ]

  // ===== RGB各チャンネルが担う波長帯 =====
  // 画像の各チャンネルはディスプレイの原色として発光するため、
  // sRGB原色の主波長を中心とするガウス分布で近似する。
  const CHANNEL_BANDS: ChannelBand[] = [
    { key: "r", peakNm: 611, sigmaNm: 25 },
    { key: "g", peakNm: 549, sigmaNm: 35 },
    { key: "b", peakNm: 465, sigmaNm: 20 }
  ]
  const BAND_SIGMA_RANGE = 3 // 帯域の積分範囲（±この倍数 × σ）
  const BAND_SAMPLE_STEP = 1 // 積分の刻み幅 (nm)

  const ageFactor = (age: number): number =>
    age <= 60 ? 1 + 0.02 * (age - 32) : 1.56 + 0.0667 * (age - 56)

  // データ表からの線形補間
  const interpolateDensity = (nm: number): number => {
    if (nm <= DENSITY_32[0].nm) return DENSITY_32[0].density
    const last = DENSITY_32[DENSITY_32.length - 1]
    if (nm >= last.nm) return last.density
    for (let i = 1; i < DENSITY_32.length; i++) {
      if (DENSITY_32[i].nm >= nm) {
        const prev = DENSITY_32[i - 1]
        const curr = DENSITY_32[i]
        const t = (nm - prev.nm) / (curr.nm - prev.nm)
        return prev.density + t * (curr.density - prev.density)
      }
    }
    return 0
  }

  // 若年時を基準にした相対透過率。元画像は若年の見え方を表しているとみなし、
  // 加齢による濃度の増分ぶんだけを画像に上乗せする。
  const DELTA_FACTOR = ageFactor(AGE_OLD) - ageFactor(AGE_YOUNG)

  const relativeTransmittance = ({ peakNm, sigmaNm }: ChannelBand): number => {
    const from = peakNm - BAND_SIGMA_RANGE * sigmaNm
    const to = peakNm + BAND_SIGMA_RANGE * sigmaNm
    let weighted = 0
    let total = 0
    for (let nm = from; nm <= to; nm += BAND_SAMPLE_STEP) {
      const weight = Math.exp(-((nm - peakNm) ** 2) / (2 * sigmaNm ** 2))
      weighted += weight * Math.pow(10, -interpolateDensity(nm) * DELTA_FACTOR)
      total += weight
    }
    return weighted / total
  }

  const [GAIN_R, GAIN_G, GAIN_B] = CHANNEL_BANDS.map((band) =>
    Math.pow(relativeTransmittance(band), 1 - ADAPTATION)
  )

  // feColorMatrix は既定で linearRGB 空間で処理されるため、
  // 透過率（リニアな光量の比）をそのまま係数として掛けられる。
  const COLOR_MATRIX = [
    `${GAIN_R} 0 0 0 0`,
    `0 ${GAIN_G} 0 0 0`,
    `0 0 ${GAIN_B} 0 0`,
    `0 0 0 1 0`
  ].join("\n")
</script>

<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute; width:0; height:0; overflow:hidden">
  <filter id="lens-yellowing">
    <feColorMatrix type="matrix" values={COLOR_MATRIX} />
  </filter>
</svg>

<div class="image-set">
  <enhanced:img src={CherryBlossom} alt="" style="max-width: {IMAGE_MAX_WIDTH}px;" />
  <enhanced:img
    src={CherryBlossom}
    alt=""
    style="max-width: {IMAGE_MAX_WIDTH}px; filter: url(#lens-yellowing);"
  />
</div>

<style>
  .image-set {
    display: grid;
  }

  .image-set :global(> *) {
    width: fit-content;
    max-width: 100%;
  }

  .image-set :global(> *:last-child) {
    margin-inline-start: auto;
  }

  .image-set :global(img) {
    max-width: 100%;
    height: auto;
  }
</style>
