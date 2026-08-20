# OGP画像 生成タスクリスト

各ページの OGP 画像（1200×630 PNG）を生成するためのチェックリスト。
生成は `/generate-ogp-image <スラッグ>`（glob 可。「図版のないページ」などの自然言語指定も可）で行う。詳細はスキル `generate-ogp-image` を参照。

- チェック済み `[x]` … 生成済み（`ogimage/data/<route>.json` に記録あり）
- 未チェック `[ ]` … 未生成
- `[draft]` … ページは作成済みだが `draft: true`（noindex）。OGP 生成の対象外。
- `[ページ未作成]` … まだページが存在しない下書き（YAML の `DraftLink`／`CgDraftLink`）。OGP 生成の対象外。
- draft・未作成のものも YAML 上の並び順を保つため一覧に混ぜて掲載する（チェックボックスは付けない）。
- 各記事セクションはコンテンツ YAML の並び順に忠実に並べる。color-theory・color-fields は YAML のトップレベル大分類ごとにセクションを分ける。
- 動的ルートの CG ユニットは全ユニットの一覧ページ `/cg/<unit>` を対象に含む。
- **YAML 由来のセクション（見出しに `` `<yaml>` `` の参照があるもの）は手で並べ替えない。** `node scripts/sync-tasklists.mjs --write` で YAML に追随させる。`[x]` は書き換えられないので記録は失われない。

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

## 色の理論（nested） — 記事：色の表し方（`color-theory.yaml` #color-expression）

- [x] `/color-theory/color-three-attributes`
- [x] `/color-theory/pccs-basics`
- [x] `/color-theory/color-system-types`
- [x] `/color-theory/color-wheel-and-color-solid`
- [x] `/color-theory/pccs-color-system`
- [x] `/color-theory/how-to-draw-pccs-color-wheel`
- [x] `/color-theory/munsell-color-system`
- [x] `/color-theory/color-name-types`
- [ページ未作成] 物体色の色名
- [ページ未作成] 光源色の色名
- [x] `/color-theory/basic-color-terms`
- [ページ未作成] ISCC-NBS色名法

## 色の理論（nested） — 記事：配色と色彩調和（`color-theory.yaml` #color-scheme-and-harmony）

- [x] `/color-theory/hue-tone-difference`
- [x] `/color-theory/color-area-proportion`
- [x] `/color-theory/gradient-color-scheme`
- [x] `/color-theory/dominant-and-tone-on-tone`
- [x] `/color-theory/tonal-color-scheme`
- [x] `/color-theory/camaieu-and-faux-camaieu`
- [x] `/color-theory/bicolor-and-tricolor`
- [x] `/color-theory/color-wheel-based-color-schemes`
- [x] `/color-theory/natural-harmony`
- [ページ未作成] 色の三属性と配色イメージ
- [ページ未作成] イメージ別の配色法
- [x] `/color-theory/unity-and-variety`
- [draft] `/color-theory/chevreul-color-harmony`
- [draft] `/color-theory/judd-four-principles`
- [draft] `/color-theory/natural-hue-sequence`
- [ページ未作成] 色相分割による調和
- [ページ未作成] 混色から考える調和
- [ページ未作成] ムーン＆スペンサーの色彩調和論

## 色の理論（nested） — 記事：色が見えるしくみ（`color-theory.yaml` #how-color-is-perceived）

- [x] `/color-theory/how-color-works`
- [x] `/color-theory/electromagnetic-waves`
- [x] `/color-theory/light-components-and-reflectance`
- [x] `/color-theory/reflection-and-refraction`
- [x] `/color-theory/interference-and-diffraction`
- [x] `/color-theory/light-scattering`
- [x] `/color-theory/eye-structure`
- [x] `/color-theory/light-path-through-the-retina`
- [x] `/color-theory/photoreceptor-types-and-distribution`
- [x] `/color-theory/brightness-sensitivity-and-adaptation`
- [draft] `/color-theory/perceptual-constancy`
- [x] `/color-theory/color-vision-theories`
- [x] `/color-theory/opponent-color-response`
- [ページ未作成] NCS表色系

## 色の理論（nested） — 記事：色の作り方と色再現（`color-theory.yaml` #color-creation-and-reproduction）

- [x] `/color-theory/color-mixing-basics`
- [x] `/color-theory/additive-color-mixing-types`
- [x] `/color-theory/real-world-color-mixing`
- [x] `/color-theory/color-matching-and-grassmanns-law`
- [x] `/color-theory/rgb-color-system`
- [x] `/color-theory/xyz-color-system`
- [x] `/color-theory/xy-chromaticity-diagram`
- [x] `/color-theory/color-difference-and-uniform-color-space`
- [draft] `/color-theory/lab-color-space`
- [ページ未作成] オストワルト表色系
- [draft] `/color-theory/digital-color-generation`
- [draft] `/color-theory/color-gamut`

## 色の理論（nested） — 記事：色の見え方（`color-theory.yaml` #color-appearance）

- [x] `/color-theory/adjacent-color-influence`
- [x] `/color-theory/color-contrast`
- [x] `/color-theory/contrast-phenomena`
- [draft] `/color-theory/color-assimilation`
- [draft] `/color-theory/color-area-effect`
- [x] `/color-theory/subjective-color`
- [x] `/color-theory/optical-illusions`
- [x] `/color-theory/what-is-lighting`
- [x] `/color-theory/color-temperature-and-light-color`
- [draft] `/color-theory/blackbody-radiation`
- [x] `/color-theory/illuminance-and-lighting-design`
- [x] `/color-theory/photometric-quantities`
- [x] `/color-theory/color-rendering`
- [x] `/color-theory/lamp-types`
- [x] `/color-theory/photometric-and-radiometric-quantities`
- [ページ未作成] 色の様相
- [ページ未作成] 色の現れ方の分類
- [ページ未作成] 三属性間の影響
- [ページ未作成] 光の入射角の影響

## 色の理論（nested） — 記事：色のはたらき方（`color-theory.yaml` #color-functions）

- [x] `/color-theory/color-roles`
- [x] `/color-theory/visual-clarity-and-visibility`
- [x] `/color-theory/color-sensations`
- [draft] `/color-theory/color-preference`
- [x] `/color-theory/color-association-symbolism`
- [ページ未作成] 記憶色と色記憶

## 色の理論（nested） — 記事：色の見え方の多様性（`color-theory.yaml` #color-vision-diversity）

- [x] `/color-theory/color-vision-characteristics`
- [x] `/color-theory/color-vision-types`
- [ページ未作成] 混同しやすい色
- [ページ未作成] 色の誤認
- [x] `/color-theory/age-related-vision-changes`
- [x] `/color-theory/elderly-vision-characteristics`
- [x] `/color-theory/age-related-eye-diseases`
- [ページ未作成] 色覚の遺伝
- [ページ未作成] 色覚検査法

## 色の理論（nested） — 記事：色の測り方（`color-theory.yaml` #color-measurement）

- [draft] `/color-theory/colorimetry-basics`
- [ページ未作成] 測色の照明
- [ページ未作成] 視感測色
- [ページ未作成] 物理測色
- [draft] `/color-theory/colorimetric-illuminants`
- [ページ未作成] 測り方による色の分類
- [x] `/color-theory/psychological-scaling-method`
- [draft] `/color-theory/psychological-scale-types`
- [ページ未作成] 一対比較法
- [ページ未作成] SD法
- [ページ未作成] 色のイメージにおける因子
- [ページ未作成] 知覚の度合いと閾
- [ページ未作成] 心理物理学的測定法
- [ページ未作成] 感覚と弁別閾の法則性

## 色の理論（nested） — 記事：色彩文化の発展（`color-theory.yaml` #color-culture-development）

- [x] `/color-theory/ancient-european-colors`
- [x] `/color-theory/medieval-european-colors`
- [x] `/color-theory/modern-european-colors`
- [ページ未作成] 古代の日本と色彩
- [ページ未作成] 古代から中近世の日本と色彩
- [ページ未作成] 近代の日本の色彩

## 色の活用分野（nested） — 記事：デザイン（`color-fields.yaml` #design）

- [x] `/color-fields/visual-design-and-color`
- [x] `/color-fields/media-design-concepts`
- [draft] `/color-fields/color-management`
- [draft] `/color-fields/digital-image-basics`
- [x] `/color-fields/color-universal-design`
- [draft] `/color-fields/color-vision-accessibility`
- [draft] `/color-fields/color-universal-design-process`
- [draft] `/color-fields/color-design-tips`
- [draft] `/color-fields/color-universal-design-improvement`

## 色の活用分野（nested） — 記事：マーケティング（`color-fields.yaml` #marketing）

- [ページ未作成] カラーマーケティングの考え方
- [ページ未作成] カラーリサーチの目的
- [ページ未作成] カラーリサーチの手法
- [ページ未作成] カラーリサーチ用カラーコード
- [ページ未作成] カラーリサーチの分析ツール
- [ページ未作成] さまざまなカラー戦略
- [ページ未作成] CMFの考え方
- [ページ未作成] 消費者の感性とCMF
- [ページ未作成] ラインナップの展開とCMF
- [ページ未作成] 制作におけるCMF

## 色の活用分野（nested） — 記事：ビジネス（`color-fields.yaml` #business）

- [draft] `/color-fields/color-effects-and-business`
- [ページ未作成] カラーコミュニケーションツール
- [ページ未作成] コンシューマプロダクツ
- [ページ未作成] 企業アイデンティティ戦略
- [ページ未作成] 商品企画とカラーバリエーション
- [ページ未作成] 商品価値とプランニングの視点
- [ページ未作成] 商品デザインとCMF
- [ページ未作成] 製造と色再現技術
- [ページ未作成] 流通とパッケージデザイン
- [ページ未作成] プロモーション
- [ページ未作成] 販売形態と色彩戦略

## 色の活用分野（nested） — 記事：ファッション（`color-fields.yaml` #fashion）

- [x] `/color-fields/fashion-color-concepts`
- [ページ未作成] PCCSで見るカラーコーディネート
- [ページ未作成] ファッションの配色用語
- [x] `/color-fields/fashion-color`
- [draft] `/color-fields/fashion-trend`
- [draft] `/color-fields/fashion-style-categories`
- [draft] `/color-fields/fashion-image`
- [ページ未作成] ファッションカラーの変遷
- [ページ未作成] 繊維の種類と発色性
- [ページ未作成] 織物と編物
- [ページ未作成] カラーコーディネーターの役割
- [ページ未作成] カラー情報の収集
- [ページ未作成] カラー情報の分析
- [ページ未作成] シーズンテーマカラーの決定
- [ページ未作成] VMDの定義と分類
- [ページ未作成] 商品陳列の方法と効果

## 色の活用分野（nested） — 記事：インテリア（`color-fields.yaml` #interior）

- [x] `/color-fields/interior-design-basics`
- [x] `/color-fields/interior-concept-history`
- [ページ未作成] インテリアと心理効果・視覚効果
- [draft] `/color-fields/interior-elements-classification`
- [ページ未作成] インテリアエレメントの配色
- [draft] `/color-fields/interior-space-zoning`
- [draft] `/color-fields/public-space-color-scheme`
- [draft] `/color-fields/private-space-color-scheme`
- [ページ未作成] サービス空間の配色
- [ページ未作成] PCCSで見るインテリアの配色形式
- [ページ未作成] インテリアスタイル

## 色の活用分野（nested） — 記事：景観色彩（`color-fields.yaml` #landscape-color）

- [x] `/color-fields/landscape-color-approach`
- [x] `/color-fields/housing-color-design-process`
- [draft] `/color-fields/landscape-act`
- [draft] `/color-fields/landscape-plan`
- [ページ未作成] 景観計画における色彩基準
- [ページ未作成] 色の三属性と景観形成
- [ページ未作成] 遠景・中景・近景の景観色彩

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

## CGと画像処理（nested） — 記事：デジタル画像の基本（`cg/basics.yaml`）

- [x] `/cg/basics/camera-capture-and-cg`
- [x] `/cg/basics/cg-and-image-processing`
- [x] `/cg/basics/image-digitization`
- [x] `/cg/basics/image-sampling`
- [draft] `/cg/basics/sampling-theorem-and-interpolation`
- [x] `/cg/basics/image-quantization`
- [x] `/cg/basics/grayscale-and-color-images`
- [x] `/cg/basics/vector-and-raster`
- [x] `/cg/basics/shape-rasterization`
- [x] `/cg/basics/anti-aliasing`
- [x] `/cg/basics/area-filling`
- [x] `/cg/basics/gradient-generation`

## CGと画像処理（nested） — 記事：変換と投影（`cg/transformation.yaml`）

- [x] `/cg/transformation/coordinate-systems`
- [x] `/cg/transformation/basic-transformations`
- [x] `/cg/transformation/transformation-composition`
- [x] `/cg/transformation/reflection-and-skew`
- [x] `/cg/transformation/affine-transformation`
- [x] `/cg/transformation/projective-transformation`
- [x] `/cg/transformation/viewing-pipeline-transformations`
- [draft] `/cg/transformation/hierarchical-modeling`
- [x] `/cg/transformation/pinhole-camera`
- [x] `/cg/transformation/perspective-and-parallel-projection`
- [x] `/cg/transformation/projection-steps`
- [draft] `/cg/transformation/projection-calculation`
- [draft] `/cg/transformation/clipping-algorithms`
- [draft] `/cg/transformation/vanishing-points-and-n-point-perspective`
- [x] `/cg/transformation/parallel-projection-types`
- [ページ未作成] 画像の幾何学的変換
- [ページ未作成] 画像の再標本化と補間
- [ページ未作成] ニアレストネイバー
- [ページ未作成] バイリニア補間・バイキュービック補間
- [ページ未作成] 再標本化時のアンチエイリアシング
- [ページ未作成] イメージモザイキング
- [ページ未作成] パノラマ画像の生成

## CGと画像処理（nested） — 記事：画像の性質と色（`cg/image-properties.yaml`）

- [x] `/cg/image-properties/dynamic-range-and-gradation`
- [draft] `/cg/image-properties/image-statistics`
- [ページ未作成] 画像のノイズ
- [ページ未作成] コントラストとシャープネス
- [ページ未作成] CIE-RGB表色系
- [ページ未作成] CIE-XYZ表色系
- [ページ未作成] CIE-L*a*b*色空間
- [ページ未作成] YIQ表色系
- [ページ未作成] sRGB色空間
- [ページ未作成] 輝度信号と色差信号
- [ページ未作成] HSI変換と逆変換

## CGと画像処理（nested） — 記事：撮影とレンズ（`cg/camera.yaml`）

- [x] `/cg/camera/digital-camera-structure`
- [ページ未作成] 薄肉レンズ
- [ページ未作成] 厚肉レンズ
- [ページ未作成] 歪曲収差
- [ページ未作成] 周辺光量の低下
- [ページ未作成] 撮影画角
- [ページ未作成] 画像の明るさ（露出）
- [ページ未作成] 被写界深度（フォーカス）
- [ページ未作成] フレームレート
- [ページ未作成] カメラ応答関数
- [ページ未作成] 時系列画像
- [ページ未作成] カラー画像の撮影

## CGと画像処理（nested） — 記事：モデリング（`cg/modeling.yaml`）

- [x] `/cg/modeling/shape-model-overview`
- [draft] `/cg/modeling/csg-representation`
- [draft] `/cg/modeling/boundary-representation`
- [draft] `/cg/modeling/sweep-representation`
- [ページ未作成] 境界表現のデータ構造
- [ページ未作成] オイラー表現
- [x] `/cg/modeling/curve-surface-equations`
- [x] `/cg/modeling/quadratic-curve`
- [x] `/cg/modeling/bezier-curve-surface`
- [x] `/cg/modeling/bezier-curve-properties`
- [ページ未作成] ファーガソン曲線
- [ページ未作成] 双3次クーンズ曲面
- [draft] `/cg/modeling/b-spline-curve-surface`
- [ページ未作成] 有理ベジェ曲線・曲面
- [ページ未作成] NURBS曲線・曲面
- [draft] `/cg/modeling/parametric-curve-surface`
- [ページ未作成] パラメトリック曲線・曲面の微分幾何
- [draft] `/cg/modeling/polygon-surface`
- [ページ未作成] 細分割曲面
- [ページ未作成] ポリゴン曲面の詳細度制御
- [ページ未作成] ポリゴン曲面の平滑化処理
- [ページ未作成] ポリゴン曲面のパラメータ化
- [ページ未作成] セグメンテーション
- [ページ未作成] 電子透かし
- [ページ未作成] 形状検索
- [draft] `/cg/modeling/voxel-and-volume-data`
- [ページ未作成] 四分木と八分木
- [ページ未作成] メタボール
- [draft] `/cg/modeling/isosurface-extraction`
- [ページ未作成] パーティクル
- [ページ未作成] ポイントベースドモデリング
- [ページ未作成] フラクタル

## CGと画像処理（nested） — 記事：レンダリング（`cg/rendering.yaml`）

- [x] `/cg/rendering/photorealism-and-reality-elements`
- [draft] `/cg/rendering/hidden-surface-removal-methods`
- [draft] `/cg/rendering/priority-algorithm`
- [draft] `/cg/rendering/scanline-algorithm`
- [draft] `/cg/rendering/z-buffer-algorithm`
- [draft] `/cg/rendering/ray-tracing-algorithm`
- [draft] `/cg/rendering/shading-purpose`
- [ページ未作成] 光を表す量
- [ページ未作成] シェーディングモデル
- [ページ未作成] 環境光の表現
- [ページ未作成] 拡散反射の表現
- [ページ未作成] 鏡面反射の表現
- [draft] `/cg/rendering/reflection-transmission-refraction`
- [draft] `/cg/rendering/scattering-and-attenuation`
- [draft] `/cg/rendering/smooth-shading`
- [ページ未作成] グローシェーディング
- [ページ未作成] フォンシェーディング
- [draft] `/cg/rendering/shadows-from-point-and-directional-lights`
- [ページ未作成] 大きさをもつ光源による影
- [ページ未作成] マッピングの目的と手法
- [draft] `/cg/rendering/texture-mapping`
- [ページ未作成] アンチエイリアシング
- [draft] `/cg/rendering/bump-mapping`
- [ページ未作成] 環境マッピング
- [ページ未作成] ソリッドテクスチャマッピング
- [ページ未作成] イメージベースドレンダリングの技法
- [ページ未作成] 投影テクスチャマッピング
- [ページ未作成] 画像再投影の利用
- [ページ未作成] パノラマ画像の利用
- [ページ未作成] ビューモーフィング
- [ページ未作成] レイデータベースアプローチ
- [ページ未作成] イメージベースドライティング
- [ページ未作成] レンダリング方程式
- [ページ未作成] ラジオシティ法
- [ページ未作成] モンテカルロ法
- [ページ未作成] マルコフ連鎖モンテカルロ法

## CGと画像処理（nested） — 記事：アニメーション（`cg/animation.yaml`）

- [ページ未作成] 仮現運動とコマ撮り
- [ページ未作成] アニメーション技法
- [ページ未作成] カメラワーク
- [ページ未作成] キーフレーム法とスケルトン法
- [ページ未作成] キーフレームの補間
- [ページ未作成] 形状変形アニメーション
- [ページ未作成] 自由形状変形
- [ページ未作成] 進化・成長のアニメーション
- [ページ未作成] 自然現象のアニメーション
- [ページ未作成] パーティクルによるアニメーション
- [ページ未作成] AIを利用したアニメーション
- [ページ未作成] フォワードキネマティクス
- [ページ未作成] インバースキネマティクス
- [ページ未作成] パスアニメーション
- [ページ未作成] モーションキャプチャ
- [ページ未作成] 筋肉変形アニメーション
- [ページ未作成] 表情のアニメーション
- [ページ未作成] 布地のアニメーション
- [ページ未作成] 髪の毛のアニメーション
- [ページ未作成] 群集アニメーション
- [draft] `/cg/animation/rigid-body-simulation`
- [ページ未作成] 弾性体の物理シミュレーション
- [ページ未作成] 衝突判定
- [ページ未作成] リアルタイムアニメーションの手法
- [draft] `/cg/animation/renderman-and-realtime-shaders`
- [ページ未作成] ゲーム物理
- [ページ未作成] 実写映像との合成時の条件
- [ページ未作成] カメラパラメータの整合
- [ページ未作成] 照明条件の整合

## CGと画像処理（nested） — 記事：画素ごとの濃淡・色変換（`cg/tone-conversion.yaml`）

- [ページ未作成] ヒストグラム
- [ページ未作成] トーンカーブ
- [ページ未作成] 折れ線型・累乗型トーンカーブ
- [ページ未作成] S字トーンカーブ
- [ページ未作成] ヒストグラム平坦化
- [ページ未作成] 各種の濃淡変換
- [ページ未作成] 濃淡の反転
- [ページ未作成] ポスタリゼーション
- [ページ未作成] 2値化（しきい値処理）
- [ページ未作成] ソラリゼーション
- [ページ未作成] 画素ごとの変換による特殊効果
- [ページ未作成] RGBトーンカーブによる変換
- [ページ未作成] 擬似カラー
- [ページ未作成] 色相・彩度・明度の変化
- [ページ未作成] 色補正
- [ページ未作成] 色変換

## CGと画像処理（nested） — 記事：空間フィルタリング（`cg/spatial-filtering.yaml`）

- [ページ未作成] 空間フィルタリング
- [ページ未作成] 平滑化（平均化・重み付き平均化）
- [ページ未作成] 特定方向の平滑化
- [ページ未作成] 微分フィルタ
- [ページ未作成] プリューウィットフィルタ・ソーベルフィルタ
- [ページ未作成] 2次微分とラプラシアン
- [ページ未作成] エッジ検出
- [ページ未作成] 鮮鋭化
- [ページ未作成] 局所領域の選択による平滑化
- [ページ未作成] k最近隣平均化フィルタ
- [ページ未作成] バイラテラルフィルタ
- [ページ未作成] ノンローカルミーンフィルタ
- [ページ未作成] メディアンフィルタ
- [ページ未作成] 領域に基づく変換による特殊効果

## CGと画像処理（nested） — 記事：周波数領域における処理（`cg/frequency.yaml`）

- [ページ未作成] 2次元フーリエ変換
- [ページ未作成] 画像のフーリエ変換
- [ページ未作成] 周波数フィルタリングの原理
- [ページ未作成] 空間フィルタリングとの関係
- [draft] `/cg/frequency/lowpass-highpass-bandpass-filters`
- [ページ未作成] 高域強調フィルタ

## CGと画像処理（nested） — 記事：2値画像処理（`cg/binary-image.yaml`）

- [ページ未作成] 2値化の意味
- [ページ未作成] p-タイル法
- [ページ未作成] モード法
- [ページ未作成] 判別分析法（大津の手法）
- [ページ未作成] 連結性
- [ページ未作成] 輪郭追跡
- [ページ未作成] 収縮・膨張処理（モルフォロジー）
- [ページ未作成] ラベリング
- [ページ未作成] 形状特徴パラメータ
- [ページ未作成] 距離と距離変換画像
- [ページ未作成] ベクトル化処理の流れ
- [ページ未作成] 細線化
- [ページ未作成] 細線の特徴点抽出とベクトル化

## CGと画像処理（nested） — 記事：画像の復元と生成（`cg/restoration.yaml`）

- [ページ未作成] 画像の劣化モデル
- [ページ未作成] 点拡がり関数（PSF）
- [ページ未作成] 逆フィルタ・ウィーナフィルタ
- [ページ未作成] ノイズ除去
- [ページ未作成] 画像超解像
- [ページ未作成] ガイド画像を利用した画像処理
- [ページ未作成] 勾配に基づく画像処理
- [ページ未作成] コンピュテーショナルフォトグラフィの考え方
- [ページ未作成] 光線の記録とその利用
- [ページ未作成] 符号化撮像

## CGと画像処理（nested） — 記事：画像の編集と合成（`cg/editing.yaml`）

- [ページ未作成] 画像間演算
- [ページ未作成] マスク処理
- [ページ未作成] 接続が自然な画像合成
- [ページ未作成] 自然な画像サイズ変更（リターゲティング）
- [ページ未作成] 画像の領域補完
- [ページ未作成] 画像からのテクスチャ合成

## CGと画像処理（nested） — 記事：NPRと可視化（`cg/npr.yaml`）

- [ページ未作成] NPRの概要と特徴
- [ページ未作成] NPRの目的と表現技法
- [ページ未作成] 線を入力とするNPR
- [ページ未作成] 2次元画像を入力とするNPR
- [ページ未作成] 3次元形状を入力とするNPR
- [ページ未作成] 形状の誇張表現
- [ページ未作成] アニメーションへの対応
- [ページ未作成] NPRの描画実現方法の分類
- [ページ未作成] サイエンティフィックビジュアライゼーション
- [ページ未作成] 可視化処理の流れとデータマッピング
- [ページ未作成] 3次元スカラデータの可視化
- [ページ未作成] ベクトル・テンソルデータの可視化
- [ページ未作成] 情報可視化

## CGと画像処理（nested） — 記事：領域分割（`cg/segmentation.yaml`）

- [ページ未作成] 領域のテクスチャ
- [ページ未作成] 2次元フーリエ変換による周波数特徴量
- [ページ未作成] ガボールフィルタによる局所周波数特徴量
- [ページ未作成] 同時生起行列による統計的特徴量
- [ページ未作成] 領域分割のアプローチ
- [ページ未作成] 階層的統合による領域分割
- [ページ未作成] パラメータ空間でのクラス分け
- [ページ未作成] ミーンシフト
- [ページ未作成] エッジを利用した領域分割
- [ページ未作成] グラフカット
- [ページ未作成] 画像のセグメンテーション

## CGと画像処理（nested） — 記事：パターン・特徴の検出とマッチング（`cg/feature-detection.yaml`）

- [ページ未作成] テンプレートマッチング
- [ページ未作成] 類似度
- [ページ未作成] サブピクセル位置推定
- [ページ未作成] 高速探索法
- [ページ未作成] チャンファーマッチング
- [ページ未作成] アクティブ探索
- [ページ未作成] コーナー検出
- [ページ未作成] DoGによる特徴点とスケールの検出
- [ページ未作成] SIFT特徴
- [ページ未作成] 2値特徴量
- [ページ未作成] 対応点マッチング
- [ページ未作成] ハフ変換
- [ページ未作成] 一般化・ランダム化ハフ変換
- [ページ未作成] 顕著性マップ

## CGと画像処理（nested） — 記事：パターン認識と機械学習（`cg/pattern-recognition.yaml`）

- [ページ未作成] パターン認識の流れ
- [ページ未作成] 画像からの特徴抽出
- [ページ未作成] プロトタイプ法による識別
- [ページ未作成] クラスの分布を考慮した識別
- [ページ未作成] NN法・kNN法
- [ページ未作成] kd-tree法
- [ページ未作成] ハッシングによる近似最近傍探索
- [ページ未作成] 線形判別分析
- [ページ未作成] 部分空間法
- [ページ未作成] 教師なし学習・教師あり学習
- [ページ未作成] k-means法によるクラスタリング
- [ページ未作成] 主成分分析による次元圧縮
- [ページ未作成] アダブースト
- [ページ未作成] サポートベクタマシン
- [ページ未作成] ランダムフォレスト
- [ページ未作成] 物体検出
- [ページ未作成] 類似画像検索
- [ページ未作成] 人体姿勢推定

## CGと画像処理（nested） — 記事：深層学習による認識と生成（`cg/deep-learning.yaml`）

- [ページ未作成] 単純パーセプトロン
- [ページ未作成] 誤差逆伝播法
- [ページ未作成] 畳み込みニューラルネットワーク（CNN）
- [ページ未作成] 汎化能力の向上
- [ページ未作成] 画像分類
- [ページ未作成] 物体検出
- [ページ未作成] セマンティックセグメンテーション
- [ページ未作成] 姿勢推定
- [ページ未作成] GAN

## CGと画像処理（nested） — 記事：動画像処理（`cg/video.yaml`）

- [ページ未作成] 差分画像
- [ページ未作成] 背景差分法
- [ページ未作成] フレーム間差分法
- [ページ未作成] 統計的背景差分法
- [ページ未作成] オプティカルフローの求め方
- [ページ未作成] ブロックマッチング法
- [ページ未作成] 勾配法
- [ページ未作成] イメージピラミッドを用いた求め方
- [ページ未作成] 物体追跡の手法分類
- [ページ未作成] KLTトラッカー
- [ページ未作成] ミーンシフトトラッキング
- [ページ未作成] ベイジアンフィルタ

## CGと画像処理（nested） — 記事：画像からの3次元復元（`cg/3d-reconstruction.yaml`）

- [ページ未作成] 透視投影モデルと幾何学的関係
- [ページ未作成] 同次座標を用いた記述
- [ページ未作成] エピポーラ幾何
- [ページ未作成] カメラキャリブレーション
- [ページ未作成] 空間位置の計算
- [ページ未作成] 平行ステレオ
- [ページ未作成] ステレオマッチング
- [ページ未作成] マルチビューステレオ
- [ページ未作成] アクティブステレオ
- [ページ未作成] カメラ位置・姿勢の推定
- [ページ未作成] カメラモーションと3次元位置の推定
- [ページ未作成] 大量の画像を用いた復元（SfM）

## CGと画像処理（nested） — 記事：光学的解析とシーンの復元（`cg/optical-analysis.yaml`）

- [ページ未作成] 放射量の定義と基本法則
- [ページ未作成] 反射の種類
- [ページ未作成] BRDFの定義と性質
- [ページ未作成] 反射モデル
- [ページ未作成] 反射成分の分離
- [ページ未作成] 位置の推定と法線の推定
- [ページ未作成] 照度差ステレオ
- [ページ未作成] BRDFの計測と反射パラメータの推定
- [ページ未作成] 光源分布の計測
- [ページ未作成] インバースライティング
- [ページ未作成] 形状・反射特性・照明環境の同時復元

## CGと画像処理（nested） — 記事：画像符号化（`cg/image-coding.yaml`）

- [draft] `/cg/image-coding/compression-and-file-formats`
- [ページ未作成] 画像圧縮の原理
- [ページ未作成] 画像符号化の分類
- [ページ未作成] 画像ファイル形式一覧
- [ページ未作成] 2値画像のデータ量
- [ページ未作成] ランレングス符号化
- [ページ未作成] チェイン符号化
- [ページ未作成] ハフマン符号化
- [ページ未作成] 算術符号化
- [ページ未作成] 予測符号化
- [ページ未作成] 変換符号化
- [ページ未作成] カラー画像の符号化
- [ページ未作成] 静止画像の符号化方式
- [draft] `/cg/image-coding/video-coding-methods`

## CGと画像処理（nested） — 記事：CGシステムとデバイス（`cg/systems.yaml`）

- [ページ未作成] CGシステムの応用
- [ページ未作成] グラフィックス装置
- [draft] `/cg/systems/graphics-api`
- [x] `/cg/systems/cg-software`
- [ページ未作成] 3次元モデル記述言語・フォーマット
- [draft] `/cg/systems/parallel-processing`
- [draft] `/cg/systems/rendering-pipeline`
- [draft] `/cg/systems/gpu-based-cg-processing`
- [ページ未作成] CGハードウェアの性能評価
- [ページ未作成] 3次元CGハードウェアの変遷
- [ページ未作成] 3次元ディジタイザ
- [ページ未作成] モーションキャプチャ装置
- [ページ未作成] 3次元座標入力・フォースディスプレイ
- [ページ未作成] 関節角入力装置
- [ページ未作成] 撮像素子の種類と特徴
- [ページ未作成] 高速度カメラ・リニアイメージセンサ
- [ページ未作成] 距離画像の取得
- [ページ未作成] 両眼立体視（メガネ方式）
- [ページ未作成] 裸眼立体視
- [ページ未作成] ヘッドマウントディスプレイ
- [ページ未作成] 3次元ディスプレイの映像フォーマット
- [ページ未作成] ホログラフィ
- [ページ未作成] ボリュームディスプレイ
- [ページ未作成] 切削加工装置・3Dプリンタ
- [ページ未作成] ディスプレイ
- [ページ未作成] プリンタ
- [ページ未作成] 画像記録メディア
- [ページ未作成] 画像処理の特性測定
- [ページ未作成] テレビジョンの走査方式
- [ページ未作成] 映像信号接続端子

## CGと画像処理（nested） — 記事：知覚（`cg/perception.yaml`）

- [ページ未作成] 眼の構造と視野
- [ページ未作成] 形の見え
- [ページ未作成] 大きさの恒常性
- [ページ未作成] 動きの見え
- [ページ未作成] 見えの3次元性
- [ページ未作成] 視線の動き

## CGと画像処理（nested） — 記事：知的財産権（`cg/ip-rights.yaml`）

- [ページ未作成] 知的財産権の概要
- [ページ未作成] 著作権・著作物利用のルール
- [ページ未作成] 著作権侵害
- [ページ未作成] 産業財産権と不正競争防止法
- [ページ未作成] ©マークによる著作権表示

## CGと画像処理（nested） — 記事：歴史（`cg/history.yaml`）

- [ページ未作成] CGの歴史
- [ページ未作成] 画像処理の歴史

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
