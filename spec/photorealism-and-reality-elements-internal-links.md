# 「写実的表現とリアリティの要素」の内部リンク先整理

対象記事: `/cg/rendering/photorealism-and-reality-elements`（CG 4-1-1, 4-1-2）

## 目的

この記事に含める予定のキーワードから、内部リンクの張り先を洗い出す。未作成の記事は、リンクを書けるように先に雛形（slug）を確定させておく必要がある。

## 対象キーワード

三面図, 工業製図, 線画, 物体の色, 照明効果, 透視図, ピンホールカメラ, 陰影, 建築, 照明設計, 材質, 反射特性, 映り込み, ガラス, 透過, 屈折, モデリング, フォトリアリスティックレンダリング, 稜線, 透視投影, ワイヤフレーム表示, デプスキューイング, 輝度, 陰線消去, 隠面消去, シェーディング, 陰付け, テクスチャ, レンダリング, リアリティ, 遠近感, 可視面表示, 表面の明るさ, 影, デプスキュー, 表面の滑らかさ, 反射率, 色, 光の物理的性質, 反射光, 間接光, 大気, 散乱, 減衰, 霧, 霞, 空, 雲, プリズム, 分散, シャボン玉, コンパクトディスク, 干渉, 回折, ポリゴン, 曲面, 濃淡, スムーズシェーディング, バンプマッピング, テクスチャマッピング

## A. 雛形を作るべき未作成記事（本文が直接指すもの）

| 記事タイトル（YAML） | 掲載元 | 対応キーワード | slug |
| --- | --- | --- | --- |
| 写実的表現のためのモデリング | `cg/rendering.yaml` #photorealistic | モデリング, 材質 | `modeling-for-photorealism` |
| レンダリングにおける処理 | `cg/rendering.yaml` #photorealistic | レンダリング, 可視面表示, 陰付け | `rendering-process` |
| シェーディングの目的 | `cg/rendering.yaml` #shading | シェーディング, 陰影, 濃淡, 表面の明るさ | `shading-purpose` |
| 反射・透過・屈折の表現 | `cg/rendering.yaml` #shading | ガラス, 透過, 屈折, 映り込み | `reflection-transmission-refraction` |
| 散乱・減衰の表現 | `cg/rendering.yaml` #shading | 大気, 散乱, 減衰, 霧, 霞, 空, 雲 | `scattering-and-attenuation` |
| スムーズシェーディングの手法 | `cg/rendering.yaml` #shading | スムーズシェーディング, ポリゴン, 曲面, 表面の滑らかさ | `smooth-shading` |
| 平行光源・点光源による影 | `cg/rendering.yaml` #shadowing | 影 | `shadows-from-point-and-directional-lights` |
| テクスチャマッピング | `cg/rendering.yaml` #mapping | テクスチャ | `texture-mapping` |
| バンプマッピング | `cg/rendering.yaml` #mapping | 表面の滑らかさ, 材質 | `bump-mapping` |

## B. あると内部リンクが厚くなる（優先度は次点・slug は案）

| 記事タイトル | 掲載元 | 対応キーワード | slug案 |
| --- | --- | --- | --- |
| マッピングの目的と手法 | `cg/rendering.yaml` #mapping | テクスチャ, 材質 | `mapping-overview` |
| 環境マッピング | `cg/rendering.yaml` #mapping | 映り込み | `environment-mapping` |
| 光を表す量 | `cg/rendering.yaml` #shading | 輝度 | `light-quantities-in-shading` |
| 環境光の表現 | `cg/rendering.yaml` #shading | 間接光 | `ambient-light` |
| 拡散反射の表現 | `cg/rendering.yaml` #shading | 反射率, 反射光 | `diffuse-reflection-shading` |
| 鏡面反射の表現 | `cg/rendering.yaml` #shading | 反射特性, 映り込み | `specular-reflection-shading` |
| バックフェースカリング | `cg/rendering.yaml` #hidden-surface | 隠面消去, 可視面表示 | `back-face-culling` |
| 物体表面の質感と光 | `color-theory.yaml` 色の見え方 | 材質, 反射特性 | `surface-quality-and-light` |
| 反射の種類 | `cg/optical-analysis.yaml` | 反射特性 | `reflection-types` |
| NPRの概要と特徴 | `cg/npr.yaml` | フォトリアリスティックレンダリング（対概念）, 線画 | `npr-overview` |
| 見えの3次元性 | `cg/perception.yaml` | 遠近感 | `three-dimensional-appearance` |

## C. 既存ページにリンクできる（新規作成は不要）

| キーワード | リンク先 |
| --- | --- |
| 三面図, 工業製図, 線画 | `/cg/transformation/parallel-projection-types` |
| 透視図, 透視投影, 遠近感 | `/cg/transformation/perspective-and-parallel-projection`, `/cg/transformation/vanishing-points-and-n-point-perspective` |
| ピンホールカメラ | `/cg/transformation/pinhole-camera` |
| 隠面消去, 陰線消去 | `/cg/rendering/hidden-surface-removal-methods` |
| 光の物理的性質, 反射光, プリズム, 分散 | `/color-theory/reflection-and-refraction` |
| 干渉, 回折, シャボン玉, コンパクトディスク | `/color-theory/interference-and-diffraction` |
| 輝度 | `/color-theory/photometric-quantities`, `/color-theory/photometric-and-radiometric-quantities` |
| 照明効果, 照明設計 | `/color-theory/what-is-lighting`, `/color-theory/illuminance-and-lighting-design` |
| 建築 | `/color-fields/landscape-color-approach`, `/color-fields/housing-color-design-process` |
| 物体の色, 色 | `/color-theory/color-three-attributes`, `/color-theory/light-components-and-reflectance` |

## D. リンク先が存在しないキーワード

ワイヤフレーム表示・稜線・デプスキューイング（デプスキュー）は、どのコンテンツ YAML にも独立したエントリが無い。リアリティの要素を段階的に説明する文脈で登場する語なので、この記事内で説明しきる方針とする（独立記事にするなら「レンダリングにおける処理」に含める）。

## 対応状況

- A の 9 本は雛形（`draft: true`）を作成済み。上表の slug で確定。
- B の slug は案の段階。作成時に再検討してよい。
