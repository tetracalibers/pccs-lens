import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  Mesh,
  RGBAFormat,
  ShaderMaterial,
  SphereGeometry
} from "three"
import { desaturateToGamut, encodeSrgb, spectrumToXyz, xyzToLinearSrgb } from "$lib/color/spectrum"
import type { ThreeSceneContext } from "$lib/demo/threejs/_shared/types"

/** Tweakpane で操作するパラメータ */
export type SoapBubbleInterferenceParams = {
  /** 膜の厚み（nm）。むらを掛ける前の基準値 */
  thicknessNm: number
  /** 厚みのむら。`0` で膜全体が同じ厚みになり、上げるほど上が薄く下が厚い分布に近づく */
  unevenness: number
}

/** 膜の厚みとして選べる範囲（nm）。パネルの上限・下限もこれに合わせる */
export const MIN_THICKNESS_NM = 80
export const MAX_THICKNESS_NM = 800

/** シャボン膜（石けん水）の屈折率 */
const FILM_IOR = 1.33

/**
 * 厚みのむらの強さ。
 * `DRAIN` は重力で下に溜まるぶんの偏り（上ほど薄い）、`SWIRL` は面内のゆるやかなゆらぎ。
 * 乱数を使わず固定の式にしてあるので、操作しても模様の形は変わらない
 */
const DRAIN_STRENGTH = 0.55
const SWIRL_STRENGTH = 0.18

/** むらを最大にしたとき、厚みが基準値の何倍まで増えるか */
const MAX_THICKNESS_FACTOR = 1 + DRAIN_STRENGTH + SWIRL_STRENGTH

/** 色を引く表（LUT）が覆う光路差の範囲（nm）と、その分割数 */
const MAX_OPD_NM = 2 * FILM_IOR * MAX_THICKNESS_NM * MAX_THICKNESS_FACTOR
const LUT_SIZE = 1024

/** 球の分割数。色は画素ごとに求めるので、輪郭が滑らかに見える程度あればよい */
const SPHERE_SEGMENTS = 96
const SPHERE_RINGS = 64

/** 数値を GLSL の float リテラルとして埋め込む（`1` のような整数表記は型が合わない） */
const glslFloat = (value: number) => value.toFixed(4)

/**
 * 光路差が `opdNm` のときに、波長 `nm` の光がどれだけ強め合うか（`0`〜`1`）。
 *
 * 外側の面（空気→膜）での反射では波の位相が半波長ぶんずれ、内側の面（膜→空気）ではずれない。
 * そのため、光路差が `0` に近いほど 2 つの反射光は打ち消し合って暗くなる。
 */
const interferenceIntensity = (opdNm: number, nm: number) => {
  const amplitude = Math.sin((Math.PI * opdNm) / nm)
  return amplitude * amplitude
}

/**
 * 光路差から色を引く 1 次元のテクスチャ。
 *
 * 画素ごとに可視域を積分するのは重いので、光路差を刻んで色を先に求めておく。
 * 白色光（すべての波長が同じ強さ）が膜で干渉した結果の色がここに並ぶ。
 */
const createInterferenceColorTexture = () => {
  const colors = Array.from({ length: LUT_SIZE }, (_, i) => {
    const opdNm = (i / (LUT_SIZE - 1)) * MAX_OPD_NM
    return desaturateToGamut(
      xyzToLinearSrgb(spectrumToXyz((nm) => interferenceIntensity(opdNm, nm)))
    )
  })

  // どの波長も元の白色光より強くはならないので、そのままでは全体が暗く沈む。
  // いちばん明るい成分が 1 になるよう一律に引き伸ばし、暗い色との明暗差は保つ
  const peak = Math.max(...colors.flat())

  const data = new Uint8Array(LUT_SIZE * 4)
  colors.forEach((color, i) => {
    color.forEach((value, channel) => {
      data[i * 4 + channel] = Math.round(encodeSrgb(value / peak) * 255)
    })
    data[i * 4 + 3] = 255
  })

  const texture = new DataTexture(data, LUT_SIZE, 1, RGBAFormat)
  // 光路差は連続に変わるので、表の隣り合う色をなめらかに補間する
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vToEye;
  varying vec3 vLocalPosition;

  void main() {
    // 厚みのむらは球に貼り付いた模様なので、回転しても動かないローカル座標で決める
    vLocalPosition = position;
    vNormal = normalize(normalMatrix * normal);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    // 視点座標系ではカメラが原点にいるので、面から視点へ向かうベクトルはこれで求まる
    vToEye = -viewPosition.xyz;

    gl_Position = projectionMatrix * viewPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uInterferenceColor;
  uniform float uThicknessNm;
  uniform float uUnevenness;

  varying vec3 vNormal;
  varying vec3 vToEye;
  varying vec3 vLocalPosition;

  // 場所ごとの厚みの倍率。重力で下に溜まるぶんと、面内のゆらぎを重ねる
  float thicknessFactor(vec3 localPosition) {
    float drain = ${glslFloat(DRAIN_STRENGTH)} * -localPosition.y;
    float swirl = ${glslFloat(SWIRL_STRENGTH)} *
      sin(3.0 * localPosition.x + 2.0 * localPosition.y) * cos(2.5 * localPosition.z);
    return 1.0 + uUnevenness * (drain + swirl);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 toEye = normalize(vToEye);

    // 膜に入るときの角度（法線から測る）。膜の中では屈折して角度が浅くなる
    float cosIncidence = abs(dot(normal, toEye));
    float sinIncidence = sqrt(max(0.0, 1.0 - cosIncidence * cosIncidence));
    float sinRefraction = sinIncidence / ${glslFloat(FILM_IOR)};
    float cosRefraction = sqrt(max(0.0, 1.0 - sinRefraction * sinRefraction));

    // 内側の面で反射した光は、膜の中を往復するぶんだけ余計に進む（＝光路差）。
    // 斜めから見るほど膜の中を斜めに横切るので、同じ厚みでも光路差が変わる
    float thickness = uThicknessNm * thicknessFactor(vLocalPosition);
    float opd = 2.0 * ${glslFloat(FILM_IOR)} * thickness * cosRefraction;

    float lookup = clamp(opd / ${glslFloat(MAX_OPD_NM)}, 0.0, 1.0);
    gl_FragColor = vec4(texture2D(uInterferenceColor, vec2(lookup, 0.5)).rgb, 1.0);
  }
`

export const createSoapBubbleInterferenceScene = ({
  scene,
  params
}: ThreeSceneContext<SoapBubbleInterferenceParams>) => {
  const geometry = new SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_RINGS)
  const texture = createInterferenceColorTexture()

  // 干渉で決まった色をそのまま画面に出したいので、ライトも陰影も使わない
  const material = new ShaderMaterial({
    uniforms: {
      uInterferenceColor: { value: texture },
      uThicknessNm: { value: params.thicknessNm },
      uUnevenness: { value: params.unevenness }
    },
    vertexShader,
    fragmentShader
  })
  scene.add(new Mesh(geometry, material))

  return {
    update: () => {
      material.uniforms.uThicknessNm.value = params.thicknessNm
      material.uniforms.uUnevenness.value = params.unevenness
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      texture.dispose()
    }
  }
}
