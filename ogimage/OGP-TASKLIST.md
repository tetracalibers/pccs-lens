# OGP画像 生成タスクリスト

各ページの OGP 画像（1200×630 PNG）を生成するためのチェックリスト。
生成は `/generate-ogp-image <スラッグ>`（glob 可）で行う。詳細はスキル `generate-ogp-image` を参照。

- チェック済み `[x]` … 生成済み（`ogimage/data/<route>.json` に記録あり）
- 未チェック `[ ]` … 未生成
- draft（`draft: true`）ページは noindex のため対象外（このリストに含めない）。
- 動的ルートの CG ユニットは全ユニットの一覧ページ `/cg/<unit>` を対象に含む。

---

## トップ / 既定（default）

- [x] `/` （サイト既定画像 `app/static/ogp/default.png`）

## 単体・一覧ページ（title-only）

- [x] `/concept`
- [x] `/color-theory`
- [x] `/color-fields`
- [x] `/jis-color-map`
- [x] `/cg`
- [x] `/patterns`
- [x] `/jis-color-map/all`
- [x] `/approximate`
- [x] `/analyze`

## ゲーム（title-only）

- [x] `/games/lightness-match`
- [x] `/games/tone-hunt`
- [x] `/games/tone-match`

## 色の理論（nested） — 記事

- [x] `/color-theory/additive-color-mixing-types`
- [x] `/color-theory/adjacent-color-influence`
- [x] `/color-theory/ancient-european-colors`
- [x] `/color-theory/basic-color-terms`
- [ ] `/color-theory/bicolor-and-tricolor`
- [x] `/color-theory/brightness-sensitivity-and-adaptation`
- [ ] `/color-theory/camaieu-and-faux-camaieu`
- [ ] `/color-theory/color-area-proportion`
- [x] `/color-theory/color-association-symbolism`
- [ ] `/color-theory/color-contrast`
- [x] `/color-theory/color-matching-and-grassmanns-law`
- [x] `/color-theory/color-mixing-basics`
- [x] `/color-theory/color-name-types`
- [x] `/color-theory/color-roles`
- [ ] `/color-theory/color-sensations`
- [x] `/color-theory/color-system-types`
- [x] `/color-theory/color-three-attributes`
- [x] `/color-theory/color-vision-characteristics`
- [x] `/color-theory/color-vision-theories`
- [x] `/color-theory/color-wheel-and-color-solid`
- [ ] `/color-theory/color-wheel-based-color-schemes`
- [x] `/color-theory/contrast-phenomena`
- [ ] `/color-theory/dominant-and-tone-on-tone`
- [x] `/color-theory/electromagnetic-waves`
- [x] `/color-theory/eye-structure`
- [ ] `/color-theory/gradient-color-scheme`
- [x] `/color-theory/how-color-works`
- [x] `/color-theory/how-to-draw-pccs-color-wheel`
- [x] `/color-theory/hue-tone-difference`
- [ ] `/color-theory/illuminance-and-lighting-design`
- [ ] `/color-theory/lamp-types`
- [x] `/color-theory/light-components-and-reflectance`
- [x] `/color-theory/light-path-through-the-retina`
- [x] `/color-theory/medieval-european-colors`
- [x] `/color-theory/modern-european-colors`
- [x] `/color-theory/munsell-color-system`
- [ ] `/color-theory/natural-harmony`
- [x] `/color-theory/opponent-color-response`
- [x] `/color-theory/pccs-basics`
- [x] `/color-theory/pccs-color-system`
- [x] `/color-theory/photometric-and-radiometric-quantities`
- [x] `/color-theory/photoreceptor-types-and-distribution`
- [x] `/color-theory/psychological-scaling-method`
- [x] `/color-theory/real-world-color-mixing`
- [x] `/color-theory/rgb-color-system`
- [ ] `/color-theory/subjective-color`
- [ ] `/color-theory/tonal-color-scheme`
- [x] `/color-theory/unity-and-variety`
- [ ] `/color-theory/visual-clarity-and-visibility`
- [x] `/color-theory/what-is-lighting`
- [x] `/color-theory/xyz-color-system`

## 色の活用分野（nested） — 記事

- [x] `/color-fields/fashion-color-concepts`
- [x] `/color-fields/fashion-color`
- [x] `/color-fields/housing-color-design-process`
- [x] `/color-fields/landscape-color-approach`
- [x] `/color-fields/visual-design-and-color`

## CGと画像処理（nested） — ユニット一覧ページ

- [x] `/cg/3d-reconstruction`
- [x] `/cg/animation`
- [x] `/cg/basics`
- [x] `/cg/binary-image`
- [x] `/cg/camera`
- [x] `/cg/deep-learning`
- [x] `/cg/editing`
- [x] `/cg/feature-detection`
- [x] `/cg/frequency`
- [x] `/cg/history`
- [x] `/cg/image-coding`
- [x] `/cg/image-properties`
- [x] `/cg/ip-rights`
- [x] `/cg/modeling`
- [x] `/cg/npr`
- [x] `/cg/optical-analysis`
- [x] `/cg/pattern-recognition`
- [x] `/cg/perception`
- [x] `/cg/rendering`
- [x] `/cg/restoration`
- [x] `/cg/segmentation`
- [x] `/cg/spatial-filtering`
- [x] `/cg/systems`
- [x] `/cg/tone-conversion`
- [x] `/cg/transformation`
- [x] `/cg/video`

## CGと画像処理（nested） — 記事

- [x] `/cg/basics/anti-aliasing`
- [x] `/cg/basics/area-filling`
- [x] `/cg/basics/camera-capture-and-cg`
- [x] `/cg/basics/cg-and-image-processing`
- [x] `/cg/basics/gradient-generation`
- [x] `/cg/basics/grayscale-and-color-images`
- [x] `/cg/basics/image-digitization`
- [x] `/cg/basics/image-quantization`
- [x] `/cg/basics/image-sampling`
- [x] `/cg/basics/shape-rasterization`
- [x] `/cg/basics/vector-and-raster`
- [x] `/cg/camera/digital-camera-structure`
- [x] `/cg/image-properties/dynamic-range-and-gradation`
- [x] `/cg/transformation/affine-and-projective-transformation`
- [x] `/cg/transformation/basic-transformations`
- [x] `/cg/transformation/coordinate-systems`
- [x] `/cg/transformation/reflection-and-skew`
- [x] `/cg/transformation/transformation-composition`

## 慣用色名マップ（nested-fig） — 色系統ごと ※図版が必要

- [x] `/jis-color-map/red`
- [x] `/jis-color-map/brown`
- [x] `/jis-color-map/yellow`
- [x] `/jis-color-map/green`
- [x] `/jis-color-map/blue`
- [x] `/jis-color-map/purple`
- [x] `/jis-color-map/neutral`

## 配色シミュレータ（nested-fig） — テーマごと ※図版が必要

- [x] `/patterns/elegant`
- [x] `/patterns/casual`
- [x] `/patterns/classic`
- [x] `/patterns/clear`
- [x] `/patterns/chic`
- [x] `/patterns/dynamic`
- [x] `/patterns/warm-natural`
- [x] `/patterns/fresh-natural`
- [x] `/patterns/modern`
- [x] `/patterns/romantic`
