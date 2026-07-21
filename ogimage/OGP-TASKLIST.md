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
- [ ] `/color-theory`
- [ ] `/color-fields`
- [ ] `/jis-color-map`
- [ ] `/cg`
- [ ] `/patterns`
- [ ] `/jis-color-map/all`
- [ ] `/approximate`
- [ ] `/analyze`

## ゲーム（title-only）

- [ ] `/games/lightness-match`
- [ ] `/games/tone-hunt`
- [ ] `/games/tone-match`

## 色の理論（nested） — 記事

- [ ] `/color-theory/additive-color-mixing-types`
- [ ] `/color-theory/adjacent-color-influence`
- [ ] `/color-theory/ancient-european-colors`
- [ ] `/color-theory/basic-color-terms`
- [ ] `/color-theory/bicolor-and-tricolor`
- [ ] `/color-theory/brightness-sensitivity-and-adaptation`
- [ ] `/color-theory/camaieu-and-faux-camaieu`
- [ ] `/color-theory/color-area-proportion`
- [ ] `/color-theory/color-association-symbolism`
- [ ] `/color-theory/color-contrast`
- [ ] `/color-theory/color-matching-and-grassmanns-law`
- [x] `/color-theory/color-mixing-basics`
- [ ] `/color-theory/color-name-types`
- [ ] `/color-theory/color-roles`
- [ ] `/color-theory/color-sensations`
- [ ] `/color-theory/color-system-types`
- [ ] `/color-theory/color-three-attributes`
- [ ] `/color-theory/color-vision-characteristics`
- [ ] `/color-theory/color-vision-theories`
- [ ] `/color-theory/color-wheel-and-color-solid`
- [ ] `/color-theory/color-wheel-based-color-schemes`
- [ ] `/color-theory/contrast-phenomena`
- [ ] `/color-theory/dominant-and-tone-on-tone`
- [ ] `/color-theory/electromagnetic-waves`
- [ ] `/color-theory/eye-structure`
- [ ] `/color-theory/gradient-color-scheme`
- [ ] `/color-theory/how-color-works`
- [ ] `/color-theory/how-to-draw-pccs-color-wheel`
- [ ] `/color-theory/hue-tone-difference`
- [ ] `/color-theory/illuminance-and-lighting-design`
- [ ] `/color-theory/lamp-types`
- [ ] `/color-theory/light-components-and-reflectance`
- [ ] `/color-theory/light-path-through-the-retina`
- [ ] `/color-theory/medieval-european-colors`
- [ ] `/color-theory/modern-european-colors`
- [ ] `/color-theory/munsell-color-system`
- [ ] `/color-theory/natural-harmony`
- [ ] `/color-theory/opponent-color-response`
- [ ] `/color-theory/pccs-basics`
- [ ] `/color-theory/pccs-color-system`
- [ ] `/color-theory/photometric-and-radiometric-quantities`
- [ ] `/color-theory/photoreceptor-types-and-distribution`
- [ ] `/color-theory/psychological-scaling-method`
- [ ] `/color-theory/real-world-color-mixing`
- [ ] `/color-theory/rgb-color-system`
- [ ] `/color-theory/subjective-color`
- [ ] `/color-theory/tonal-color-scheme`
- [ ] `/color-theory/unity-and-variety`
- [ ] `/color-theory/visual-clarity-and-visibility`
- [ ] `/color-theory/what-is-lighting`
- [ ] `/color-theory/xyz-color-system`

## 色の活用分野（nested） — 記事

- [ ] `/color-fields/fashion-color-concepts`
- [ ] `/color-fields/fashion-color`
- [ ] `/color-fields/housing-color-design-process`
- [ ] `/color-fields/landscape-color-approach`
- [ ] `/color-fields/visual-design-and-color`

## CGと画像処理（nested） — ユニット一覧ページ

- [x] `/cg/3d-reconstruction`
- [ ] `/cg/animation`
- [ ] `/cg/basics`
- [ ] `/cg/binary-image`
- [ ] `/cg/camera`
- [ ] `/cg/deep-learning`
- [ ] `/cg/editing`
- [ ] `/cg/feature-detection`
- [ ] `/cg/frequency`
- [ ] `/cg/history`
- [ ] `/cg/image-coding`
- [ ] `/cg/image-properties`
- [ ] `/cg/ip-rights`
- [ ] `/cg/modeling`
- [ ] `/cg/npr`
- [ ] `/cg/optical-analysis`
- [ ] `/cg/pattern-recognition`
- [ ] `/cg/perception`
- [ ] `/cg/rendering`
- [ ] `/cg/restoration`
- [ ] `/cg/segmentation`
- [ ] `/cg/spatial-filtering`
- [ ] `/cg/systems`
- [ ] `/cg/tone-conversion`
- [ ] `/cg/transformation`
- [ ] `/cg/video`

## CGと画像処理（nested） — 記事

- [x] `/cg/basics/anti-aliasing`
- [ ] `/cg/basics/area-filling`
- [ ] `/cg/basics/camera-capture-and-cg`
- [ ] `/cg/basics/cg-and-image-processing`
- [ ] `/cg/basics/gradient-generation`
- [ ] `/cg/basics/grayscale-and-color-images`
- [ ] `/cg/basics/image-digitization`
- [ ] `/cg/basics/image-quantization`
- [ ] `/cg/basics/image-sampling`
- [ ] `/cg/basics/shape-rasterization`
- [ ] `/cg/basics/vector-and-raster`
- [ ] `/cg/camera/digital-camera-structure`
- [ ] `/cg/image-properties/dynamic-range-and-gradation`
- [ ] `/cg/transformation/affine-and-projective-transformation`
- [ ] `/cg/transformation/basic-transformations`
- [ ] `/cg/transformation/coordinate-systems`
- [ ] `/cg/transformation/reflection-and-skew`
- [ ] `/cg/transformation/transformation-composition`

## 慣用色名マップ（nested-fig） — 色系統ごと ※図版が必要

- [ ] `/jis-color-map/red`
- [ ] `/jis-color-map/brown`
- [ ] `/jis-color-map/yellow`
- [ ] `/jis-color-map/green`
- [ ] `/jis-color-map/blue`
- [ ] `/jis-color-map/purple`
- [ ] `/jis-color-map/neutral`

## 配色シミュレータ（nested-fig） — テーマごと ※図版が必要

- [ ] `/patterns/elegant`
- [ ] `/patterns/casual`
- [ ] `/patterns/classic`
- [ ] `/patterns/clear`
- [ ] `/patterns/chic`
- [ ] `/patterns/dynamic`
- [ ] `/patterns/warm-natural`
- [ ] `/patterns/fresh-natural`
- [ ] `/patterns/modern`
- [ ] `/patterns/romantic`
